# 🔒 Security Checklist for Production Deployment

## ✅ Pre-Deployment Security Measures

### 1. Environment Variables
- [ ] **JWT_SECRET**: Set a strong, unique secret key (at least 32 characters)
- [ ] **ADMIN_PASSWORD**: Use a strong password (8+ chars, uppercase, lowercase, numbers, special chars)
- [ ] **MONGODB_URI**: Use MongoDB Atlas with proper authentication
- [ ] **NODE_ENV**: Set to "production"
- [ ] **FRONTEND_URL**: Set to your production frontend URL
- [ ] **CLOUDINARY_CREDENTIALS**: Set up Cloudinary account and credentials

### 2. Database Security
- [ ] **MongoDB Atlas**: Use cloud database with proper authentication
- [ ] **Network Access**: Restrict IP access to your deployment servers
- [ ] **Database User**: Create dedicated user with minimal required permissions
- [ ] **Connection String**: Use connection string with authentication

### 3. Admin User Setup
- [ ] **Run Setup Script**: `npm run setup-admin`
- [ ] **Strong Password**: Use complex password meeting all requirements
- [ ] **Unique Username**: Don't use default "admin" username
- [ ] **Email Verification**: Set up admin email for password recovery

### 4. Dependencies
- [ ] **Install Security Packages**: `npm install express-rate-limit helmet`
- [ ] **Update Dependencies**: `npm audit fix`
- [ ] **Remove Dev Dependencies**: Don't include dev tools in production

## ✅ Production Server Security

### 1. HTTPS/SSL
- [ ] **SSL Certificate**: Install valid SSL certificate
- [ ] **Force HTTPS**: Redirect all HTTP traffic to HTTPS
- [ ] **HSTS Headers**: Enable HTTP Strict Transport Security

### 2. Server Configuration
- [ ] **Use Secure Server**: Use `server/index-secure.js` instead of simple version
- [ ] **Rate Limiting**: Implement rate limiting on all endpoints
- [ ] **CORS Configuration**: Restrict CORS to your frontend domain only
- [ ] **Security Headers**: Enable Helmet.js security headers

### 3. File Upload Security
- [ ] **File Type Validation**: Only allow image files
- [ ] **File Size Limits**: Set reasonable file size limits (5MB)
- [ ] **Cloud Storage**: Use Cloudinary instead of local storage
- [ ] **Virus Scanning**: Consider implementing virus scanning for uploads

## ✅ Authentication & Authorization

### 1. JWT Security
- [ ] **Strong Secret**: Use cryptographically strong JWT secret
- [ ] **Token Expiration**: Set reasonable token expiration (24h)
- [ ] **Token Storage**: Store tokens securely in frontend
- [ ] **Token Refresh**: Implement token refresh mechanism

### 2. Password Security
- [ ] **Password Hashing**: Use bcrypt with salt rounds (12+)
- [ ] **Password Policy**: Enforce strong password requirements
- [ ] **Password Reset**: Implement secure password reset flow
- [ ] **Account Lockout**: Implement account lockout after failed attempts

### 3. Session Management
- [ ] **Secure Sessions**: Use secure session configuration
- [ ] **Session Timeout**: Implement automatic session timeout
- [ ] **Logout**: Implement proper logout functionality
- [ ] **Session Storage**: Use secure session storage

## ✅ API Security

### 1. Input Validation
- [ ] **Sanitize Inputs**: Validate and sanitize all user inputs
- [ ] **SQL Injection**: Use parameterized queries (MongoDB handles this)
- [ ] **XSS Protection**: Implement XSS protection headers
- [ ] **CSRF Protection**: Implement CSRF tokens

### 2. Rate Limiting
- [ ] **Login Endpoint**: 5 attempts per 15 minutes
- [ ] **API Endpoints**: 100 requests per 15 minutes
- [ ] **File Uploads**: Limit upload frequency
- [ ] **Admin Actions**: Stricter limits for admin operations

### 3. Error Handling
- [ ] **Generic Errors**: Don't expose internal server details
- [ ] **Logging**: Log security events and errors
- [ ] **Monitoring**: Set up monitoring for suspicious activity
- [ ] **Alerting**: Set up alerts for security incidents

## ✅ Deployment Security

### 1. Hosting Platform
- [ ] **Railway/Vercel**: Use secure hosting platforms
- [ ] **Environment Variables**: Set all environment variables in hosting platform
- [ ] **Build Process**: Secure build and deployment process
- [ ] **Access Control**: Restrict access to deployment settings

### 2. Domain & DNS
- [ ] **Custom Domain**: Use custom domain with SSL
- [ ] **DNS Security**: Enable DNS security features
- [ ] **Subdomain Security**: Secure any subdomains
- [ ] **SSL Certificate**: Ensure SSL certificate is valid

### 3. Monitoring & Logging
- [ ] **Application Logs**: Monitor application logs
- [ ] **Error Tracking**: Set up error tracking (Sentry, etc.)
- [ ] **Performance Monitoring**: Monitor application performance
- [ ] **Security Monitoring**: Set up security monitoring

## ✅ Post-Deployment Security

### 1. Testing
- [ ] **Security Testing**: Run security tests
- [ ] **Penetration Testing**: Consider professional penetration testing
- [ ] **Vulnerability Scanning**: Regular vulnerability scans
- [ ] **Code Review**: Security-focused code review

### 2. Maintenance
- [ ] **Regular Updates**: Keep dependencies updated
- [ ] **Security Patches**: Apply security patches promptly
- [ ] **Backup Strategy**: Implement regular backups
- [ ] **Disaster Recovery**: Plan for disaster recovery

### 3. Monitoring
- [ ] **Uptime Monitoring**: Monitor application uptime
- [ ] **Performance Monitoring**: Monitor application performance
- [ ] **Security Alerts**: Set up security alerting
- [ ] **User Activity**: Monitor suspicious user activity

## 🚨 Critical Security Commands

```bash
# Install security dependencies
npm install express-rate-limit helmet

# Set up admin user (REQUIRED)
npm run setup-admin

# Start secure production server
npm run setup-prod

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🔐 Environment Variables Template

```env
# REQUIRED FOR PRODUCTION
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=YourSecurePassword123!
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
FRONTEND_URL=https://your-domain.com

# OPTIONAL BUT RECOMMENDED
ADMIN_USERNAME=your-admin-username
ADMIN_EMAIL=admin@yourdomain.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## ⚠️ Security Warnings

1. **NEVER** commit `.env` files to version control
2. **NEVER** use default passwords in production
3. **ALWAYS** use HTTPS in production
4. **REGULARLY** update dependencies
5. **MONITOR** for suspicious activity
6. **BACKUP** your data regularly
7. **TEST** security measures before deployment

## 🆘 Emergency Contacts

- **Security Issues**: Report immediately to your team
- **Data Breach**: Follow your incident response plan
- **System Compromise**: Isolate affected systems immediately 