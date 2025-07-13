const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import models and configs
const connectDB = require('./config/database');
const { uploadImage, deleteImage } = require('./config/cloudinary');
const Story = require('./models/Story');
const Tag = require('./models/Tag');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Create uploads directory for temporary storage
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer configuration for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tags
app.get('/api/tags', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new tag (admin only)
app.post('/api/tags', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingTag) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    const tag = new Tag({
      name: name.trim(),
      color: color || '#667eea'
    });

    await tag.save();

    // Emit real-time update
    io.emit('tagAdded', tag);

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete tag (admin only)
app.delete('/api/tags/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const tag = await Tag.findByIdAndDelete(id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Remove tag from all stories
    await Story.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    // Emit real-time updates
    io.emit('tagDeleted', id);
    
    const updatedStories = await Story.find().populate('tags');
    io.emit('storiesUpdated', updatedStories);

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all stories with optional search and filter
app.get('/api/stories', async (req, res) => {
  try {
    const { search, tags: tagFilter } = req.query;
    let query = {};

    // Search by title or content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by tags
    if (tagFilter) {
      const tagIds = tagFilter.split(',');
      query.tags = { $in: tagIds };
    }

    const stories = await Story.find(query).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new story (admin only)
app.post('/api/stories', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content, website, websiteButtonText, tags: storyTags, imageUrl } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Handle image upload
    let image = null;
    if (req.file) {
      try {
        image = await uploadImage(req.file);
        // Clean up temporary file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    } else if (imageUrl && imageUrl.trim()) {
      image = imageUrl.trim();
    }

    const story = new Story({
      title,
      content,
      image,
      author: req.user.username,
      website: website || '',
      websiteButtonText: websiteButtonText || 'Visit Website',
      tags: storyTags ? storyTags.split(',').map(tag => tag.trim()) : []
    });

    await story.save();

    // Emit real-time update to all connected clients
    io.emit('storyAdded', story);

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update story (admin only)
app.put('/api/stories/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { title, content, website, websiteButtonText, tags: storyTags, imageUrl } = req.body;
    
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Handle image upload
    let image = story.image; // Keep existing image by default
    if (req.file) {
      try {
        // Delete old image if it exists
        if (story.image) {
          await deleteImage(story.image);
        }
        
        image = await uploadImage(req.file);
        // Clean up temporary file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    } else if (imageUrl !== undefined) {
      // Delete old image if it exists and new URL is different
      if (story.image && story.image !== imageUrl.trim()) {
        await deleteImage(story.image);
      }
      image = imageUrl.trim() || null;
    }

    const updatedStory = await Story.findByIdAndUpdate(id, {
      title: title || story.title,
      content: content || story.content,
      image,
      website: website !== undefined ? website : story.website,
      websiteButtonText: websiteButtonText !== undefined ? websiteButtonText : story.websiteButtonText,
      tags: storyTags ? storyTags.split(',').map(tag => tag.trim()) : story.tags || [],
      updatedAt: Date.now()
    }, { new: true });

    // Emit real-time update
    io.emit('storyUpdated', updatedStory);

    res.json(updatedStory);
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete story (admin only)
app.delete('/api/stories/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const story = await Story.findByIdAndDelete(id);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Delete image from cloud storage if it exists
    if (story.image) {
      await deleteImage(story.image);
    }

    // Emit real-time update
    io.emit('storyDeleted', id);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  console.error('Server error:', error);
  res.status(500).json({ error: error.message });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin login: username: admin, password: admin123`);
}); 