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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://sunny-isles-news-feed.vercel.app"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://sunny-isles-news-feed.vercel.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// In-memory storage (for local development)
let stories = [];
let tags = [
  { id: '1', name: 'Technology', color: '#667eea' },
  { id: '2', name: 'Business', color: '#764ba2' },
  { id: '3', name: 'Sports', color: '#f093fb' },
  { id: '4', name: 'Politics', color: '#4facfe' }
];
let users = [
  {
    id: '1',
    username: 'maxcarter',
    password: bcrypt.hashSync('Shudder23', 10),
    role: 'admin'
  }
];

// Multer configuration for file uploads
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

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Change password (admin only)
app.put('/api/change-password', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const validCurrentPassword = bcrypt.compareSync(currentPassword, user.password);
  if (!validCurrentPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Update password
  user.password = bcrypt.hashSync(newPassword, 10);

  res.json({ message: 'Password updated successfully' });
});

// Get all tags
app.get('/api/tags', (req, res) => {
  res.json(tags);
});

// Create new tag (admin only)
app.post('/api/tags', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }

  // Check if tag already exists
  const existingTag = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  if (existingTag) {
    return res.status(400).json({ error: 'Tag already exists' });
  }

  const tag = {
    id: uuidv4(),
    name: name.trim(),
    color: color || '#667eea'
  };

  tags.push(tag);

  // Emit real-time update
  io.emit('tagAdded', tag);

  res.status(201).json(tag);
});

// Delete tag (admin only)
app.delete('/api/tags/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const tagIndex = tags.findIndex(tag => tag.id === id);
  
  if (tagIndex === -1) {
    return res.status(404).json({ error: 'Tag not found' });
  }

  const deletedTag = tags.splice(tagIndex, 1)[0];

  // Remove tag from all stories
  stories.forEach(story => {
    if (story.tags) {
      story.tags = story.tags.filter(tagId => tagId !== id);
    }
  });

  // Emit real-time updates
  io.emit('tagDeleted', id);
  io.emit('storiesUpdated', stories);

  res.json({ message: 'Tag deleted successfully' });
});

// Get all stories with optional search and filter
app.get('/api/stories', (req, res) => {
  const { search, tags: tagFilter } = req.query;
  let filteredStories = [...stories];

  // Search by title or content
  if (search) {
    const searchLower = search.toLowerCase();
    filteredStories = filteredStories.filter(story => 
      story.title.toLowerCase().includes(searchLower) ||
      story.content.toLowerCase().includes(searchLower)
    );
  }

  // Filter by tags
  if (tagFilter) {
    const tagIds = tagFilter.split(',');
    filteredStories = filteredStories.filter(story => 
      story.tags && story.tags.some(tagId => tagIds.includes(tagId))
    );
  }

  res.json(filteredStories);
});

// Create new story (admin only)
app.post('/api/stories', authenticateToken, upload.single('image'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, content, website, websiteButtonText, tags: storyTags, imageUrl } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // Determine image source - uploaded file takes precedence over URL
  let image = null;
  if (req.file) {
    image = `/uploads/${req.file.filename}`;
  } else if (imageUrl && imageUrl.trim()) {
    image = imageUrl.trim();
  }

  const story = {
    id: uuidv4(),
    title,
    content,
    image,
    createdAt: new Date().toISOString(),
    author: req.user.username,
    website: website || '',
    websiteButtonText: websiteButtonText || 'Visit Website',
    tags: storyTags ? storyTags.split(',').map(tag => tag.trim()) : []
  };

  stories.unshift(story); // Add to beginning of array

  // Emit real-time update to all connected clients
  io.emit('storyAdded', story);

  res.status(201).json(story);
});

// Update story (admin only)
app.put('/api/stories/:id', authenticateToken, upload.single('image'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { title, content, website, websiteButtonText, tags: storyTags, imageUrl } = req.body;
  
  const storyIndex = stories.findIndex(s => s.id === id);
  if (storyIndex === -1) {
    return res.status(404).json({ error: 'Story not found' });
  }

  // Determine image source - uploaded file takes precedence over URL
  let image = stories[storyIndex].image; // Keep existing image by default
  if (req.file) {
    image = `/uploads/${req.file.filename}`;
  } else if (imageUrl !== undefined) {
    image = imageUrl.trim() || null;
  }

  const updatedStory = {
    ...stories[storyIndex],
    title: title || stories[storyIndex].title,
    content: content || stories[storyIndex].content,
    image,
    website: website !== undefined ? website : stories[storyIndex].website,
    websiteButtonText: websiteButtonText !== undefined ? websiteButtonText : stories[storyIndex].websiteButtonText,
    tags: storyTags ? storyTags.split(',').map(tag => tag.trim()) : stories[storyIndex].tags || [],
    updatedAt: new Date().toISOString()
  };

  stories[storyIndex] = updatedStory;

  // Emit real-time update
  io.emit('storyUpdated', updatedStory);

  res.json(updatedStory);
});

// Delete story (admin only)
app.delete('/api/stories/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex === -1) {
    return res.status(404).json({ error: 'Story not found' });
  }

  const deletedStory = stories.splice(storyIndex, 1)[0];

  // Delete image file if it exists
  if (deletedStory.image && deletedStory.image.startsWith('/uploads/')) {
    const imagePath = path.join(__dirname, '..', deletedStory.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // Emit real-time update
  io.emit('storyDeleted', id);

  res.json({ message: 'Story deleted successfully' });
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
  res.status(500).json({ error: error.message });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin login: username: ${users[0].username}, password: Shudder23`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log(`API health check available at: http://localhost:${PORT}/api/health`);
}); 