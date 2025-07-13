const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sunny-isles-news');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default data if database is empty
    await initializeDefaultData();
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const initializeDefaultData = async () => {
  const User = require('../models/User');
  const Tag = require('../models/Tag');
  
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default admin user created');
    }
    
    // Check if default tags exist
    const tagCount = await Tag.countDocuments();
    if (tagCount === 0) {
      const defaultTags = [
        { name: 'Technology', color: '#667eea' },
        { name: 'Business', color: '#764ba2' },
        { name: 'Sports', color: '#f093fb' },
        { name: 'Politics', color: '#4facfe' }
      ];
      
      await Tag.insertMany(defaultTags);
      console.log('Default tags created');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

module.exports = connectDB; 