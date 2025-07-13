const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/database');
require('dotenv').config();

const setupAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Get admin credentials from environment or prompt
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD environment variable is required!');
      console.log('Please set ADMIN_PASSWORD in your .env file');
      console.log('Example: ADMIN_PASSWORD=YourSecurePassword123!');
      process.exit(1);
    }

    // Validate password strength
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(adminPassword);
    const hasLowerCase = /[a-z]/.test(adminPassword);
    const hasNumbers = /\d/.test(adminPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(adminPassword);

    if (adminPassword.length < minLength) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }
    if (!hasUpperCase) {
      console.error('❌ Password must contain at least one uppercase letter');
      process.exit(1);
    }
    if (!hasLowerCase) {
      console.error('❌ Password must contain at least one lowercase letter');
      process.exit(1);
    }
    if (!hasNumbers) {
      console.error('❌ Password must contain at least one number');
      process.exit(1);
    }
    if (!hasSpecialChar) {
      console.error('❌ Password must contain at least one special character');
      process.exit(1);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const adminUser = new User({
      username: adminUsername,
      password: hashedPassword,
      role: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@sunnyisles.com'
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log(`Username: ${adminUsername}`);
    console.log('Role: admin');
    console.log('⚠️  Please keep your password secure and never share it!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

setupAdmin(); 