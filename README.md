# 🌞 Sunny Isles News Feed

A modern, real-time news feed application built with React, Express, and Socket.IO. Perfect for communities that need a dynamic platform to share local news and updates.

## ✨ Features

- **📰 Real-time News Feed** - Instant updates with Socket.IO
- **🔍 Advanced Search & Filtering** - Find stories by content or tags
- **🏷️ Tag Management** - Organize content with custom tags
- **📱 Responsive Design** - Works perfectly on all devices
- **🖼️ Image Upload** - Cloud storage for images
- **👨‍💼 Admin Panel** - Easy content management
- **🔐 Secure Authentication** - JWT-based admin access
- **⚡ Fast Performance** - Optimized for speed

## 🚀 Live Demo

*Coming soon - Deploy to see it in action!*

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **CSS3** - Custom styling

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Cloudinary** - Cloud image storage

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sunny-isles-news-feed.git
   cd sunny-isles-news-feed
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Admin: http://localhost:3000/login (admin/admin123)

## 🌐 Deployment

This application is designed for easy deployment to modern cloud platforms:

### Quick Deploy Options
- **Frontend**: Deploy to Vercel (recommended)
- **Backend**: Deploy to Railway
- **Database**: MongoDB Atlas (free tier)
- **Images**: Cloudinary (free tier)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📁 Project Structure

```
sunny-isles-news-feed/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── config/            # Configuration files
│   ├── models/            # MongoDB models
│   └── index.js           # Main server file
├── uploads/               # Local image storage
├── package.json           # Root package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/sunny-isles-news

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 👨‍💼 Admin Access

Default admin credentials:
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials after first login in production!

## 🔄 API Endpoints

### Public Endpoints
- `GET /api/stories` - Get all stories
- `GET /api/tags` - Get all tags
- `POST /api/login` - Admin login

### Protected Endpoints (Admin Only)
- `POST /api/stories` - Create new story
- `PUT /api/stories/:id` - Update story
- `DELETE /api/stories/:id` - Delete story
- `POST /api/tags` - Create new tag
- `DELETE /api/tags/:id` - Delete tag

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting section](./DEPLOYMENT.md#troubleshooting)
2. Review the logs in your deployment platform
3. Open an issue on GitHub

## 🎯 Roadmap

- [ ] User registration and profiles
- [ ] Comments and reactions
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support

---

**Built with ❤️ for the Sunny Isles community** 