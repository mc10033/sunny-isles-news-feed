# 🚀 Sunny Isles News Feed - Deployment Guide

## 📋 Prerequisites
- GitHub account (✅ Already have)
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Railway account (free tier)
- Vercel account (free tier)

---

## Step 1: Set up MongoDB Atlas Database

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Shared" (free tier) cluster
4. Select your preferred cloud provider and region
5. Click "Create Cluster"

### 1.2 Configure Database Access
1. In Atlas dashboard, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

### 1.3 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for now - we'll secure this later)
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `sunny-isles-news`

**Example connection string:**
```
mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/sunny-isles-news?retryWrites=true&w=majority
```

---

## Step 2: Set up Cloudinary for Image Storage

### 2.1 Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Click "Sign Up For Free"
3. Create an account
4. Verify your email

### 2.2 Get Cloudinary Credentials
1. In your Cloudinary dashboard, go to "Settings" → "Access Keys"
2. Copy your:
   - Cloud Name
   - API Key
   - API Secret

---

## Step 3: Deploy Backend to Railway

### 3.1 Create Railway Account
1. Go to [Railway](https://railway.app/)
2. Click "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway to access your repositories

### 3.2 Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select your `sunny-isles-news-feed` repository
3. Railway will automatically detect it's a Node.js app

### 3.3 Configure Environment Variables
In Railway dashboard, go to your project → "Variables" and add:

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_EMAIL=admin@yourdomain.com
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/sunny-isles-news?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 3.4 Configure Build Settings
1. Go to "Settings" → "General"
2. Set "Start Command" to: `npm run setup-prod`
3. Set "Root Directory" to: `/` (leave empty)

### 3.5 Deploy
1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete
3. Copy your Railway app URL (e.g., `https://your-app.railway.app`)

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com/)
2. Click "Sign Up" and sign in with GitHub
3. Authorize Vercel to access your repositories

### 4.2 Deploy from GitHub
1. Click "New Project"
2. Import your `sunny-isles-news-feed` repository
3. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4.3 Configure Environment Variables
In Vercel dashboard, go to your project → "Settings" → "Environment Variables" and add:

```env
REACT_APP_API_URL=https://your-railway-app.railway.app
```

### 4.4 Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Copy your Vercel app URL (e.g., `https://your-app.vercel.app`)

---

## Step 5: Update Backend CORS

### 5.1 Update Railway Environment Variables
Go back to Railway and update the `FRONTEND_URL` variable with your Vercel URL:

```env
FRONTEND_URL=https://your-app.vercel.app
```

### 5.2 Redeploy Backend
Railway will automatically redeploy when you update environment variables.

---

## Step 6: Test Your Deployment

### 6.1 Test Frontend
1. Visit your Vercel URL
2. Check that the news feed loads
3. Test the search and filter functionality

### 6.2 Test Admin Panel
1. Go to `/admin` on your Vercel URL
2. Login with your admin credentials
3. Test creating, editing, and deleting stories
4. Test creating and deleting tags

### 6.3 Test Image Uploads
1. Try uploading an image when creating a story
2. Verify the image appears correctly

---

## Step 7: Security Hardening

### 7.1 Update MongoDB Network Access
1. Go back to MongoDB Atlas
2. Go to "Network Access"
3. Remove "Allow Access from Anywhere"
4. Add your Railway app's IP address (get this from Railway logs)

### 7.2 Set up Custom Domain (Optional)
1. In Vercel: Go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS settings as instructed
4. Update `FRONTEND_URL` in Railway

### 7.3 Monitor Your App
1. Set up monitoring in Railway and Vercel
2. Check logs regularly
3. Monitor for any errors

---

## 🎉 Congratulations!

Your Sunny Isles news feed app is now live and secure! 

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`
- Admin Panel: `https://your-app.vercel.app/admin`

**Next Steps:**
1. Share your app with others
2. Add more content through the admin panel
3. Consider adding analytics
4. Set up automated backups
5. Monitor performance and security

---

## 🆘 Troubleshooting

### Common Issues:

**Frontend can't connect to backend:**
- Check `REACT_APP_API_URL` in Vercel environment variables
- Verify backend is running in Railway
- Check CORS settings

**Database connection errors:**
- Verify MongoDB connection string
- Check network access settings in Atlas
- Ensure database user has correct permissions

**Image upload issues:**
- Verify Cloudinary credentials
- Check file size limits
- Ensure proper file types

**Admin login not working:**
- Run the admin setup script in Railway
- Check admin credentials in environment variables
- Verify JWT secret is set correctly

### Getting Help:
- Check Railway and Vercel logs
- Review the security checklist
- Check GitHub issues for similar problems 