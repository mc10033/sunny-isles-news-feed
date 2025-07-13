const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import security configurations
const {
  loginLimiter,
  apiLimiter,
  authenticateToken,
  requireAdmin,
  securityHeaders
} = require('./config/security');

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
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/login', loginLimiter);

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

// Connect to database
connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role 
      } 
    });
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
app.post('/api/tags', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
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
app.delete('/api/tags/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
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

    const stories = await Story.find(query)
      .populate('tags')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new story (admin only)
app.post('/api/stories', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let imageUrl = '';
    if (req.file) {
      try {
        const result = await uploadImage(req.file.path);
        imageUrl = result.secure_url;
        
        // Delete temporary file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    const story = new Story({
      title: title.trim(),
      content: content.trim(),
      image: imageUrl,
      tags: tags ? tags.split(',') : []
    });

    await story.save();
    await story.populate('tags');

    // Emit real-time update
    io.emit('storyAdded', story);

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update story (admin only)
app.put('/api/stories/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    let imageUrl = story.image;
    if (req.file) {
      try {
        // Delete old image if it exists
        if (story.image) {
          await deleteImage(story.image);
        }

        const result = await uploadImage(req.file.path);
        imageUrl = result.secure_url;
        
        // Delete temporary file
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    story.title = title ? title.trim() : story.title;
    story.content = content ? content.trim() : story.content;
    story.image = imageUrl;
    story.tags = tags ? tags.split(',') : story.tags;

    await story.save();
    await story.populate('tags');

    // Emit real-time update
    io.emit('storyUpdated', story);

    res.json(story);
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete story (admin only)
app.delete('/api/stories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findByIdAndDelete(id);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Delete image from Cloudinary if it exists
    if (story.image) {
      try {
        await deleteImage(story.image);
      } catch (deleteError) {
        console.error('Image deletion error:', deleteError);
      }
    }

    // Emit real-time update
    io.emit('storyDeleted', id);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Secure server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security features enabled`);
}); 