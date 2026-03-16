# Cloud Deployment Guide

This guide covers deploying your construction materials ordering application to the cloud.

## Project Architecture

- **Frontend**: React + Vite (SPA)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **File Storage**: Local uploads folder (needs cloud storage)

---

## Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) + MongoDB Atlas
**Best for**: Quick deployment, free tier available

### Option 2: AWS (Full Stack)
**Best for**: Production, scalability, full control

### Option 3: Heroku (Full Stack)
**Best for**: Simple deployment, good for startups

---

## Option 1: Vercel + Render + MongoDB Atlas (RECOMMENDED)

### Step 1: Setup MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user:
   - Username: `admin`
   - Password: (generate strong password)
5. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
6. Get connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/construction-app?retryWrites=true&w=majority
   ```

### Step 2: Setup Cloudinary (File Storage)

Since you have image/video uploads, you need cloud storage:

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create free account
3. Get credentials:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Deploy Backend to Render

1. Create account at [Render](https://render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `construction-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

5. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/construction-app
   PORT=4000
   NODE_ENV=production
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

6. Deploy! You'll get a URL like: `https://construction-backend.onrender.com`

### Step 4: Deploy Frontend to Vercel

1. Create account at [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://construction-backend.onrender.com/api
   ```

6. Deploy! You'll get a URL like: `https://construction-app.vercel.app`

### Step 5: Update Frontend API Configuration

Update `frontend/src/utils/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const ordersAPI = {
  getAll: (params) => fetch(`${API_BASE_URL}/orders${params ? '?' + new URLSearchParams(params) : ''}`).then(r => r.json()),
  // ... rest of your API calls
};
```

### Step 6: Update Backend for Production

Update `backend/server.js`:

```javascript
const cors = require('cors');

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://construction-app.vercel.app', 'https://your-custom-domain.com']
    : 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
```

---

## Option 2: AWS Deployment (Advanced)

### Architecture:
- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS EC2 or Elastic Beanstalk
- **Database**: MongoDB Atlas or AWS DocumentDB
- **File Storage**: AWS S3

### Steps:

1. **Setup S3 for Frontend**:
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Upload to S3
   aws s3 sync dist/ s3://your-bucket-name --acl public-read
   ```

2. **Setup CloudFront** (CDN):
   - Create distribution pointing to S3 bucket
   - Get CloudFront URL

3. **Deploy Backend to EC2**:
   ```bash
   # SSH into EC2 instance
   ssh -i your-key.pem ec2-user@your-ec2-ip
   
   # Install Node.js
   curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   
   # Clone and setup
   git clone your-repo
   cd backend
   npm install
   
   # Install PM2 for process management
   sudo npm install -g pm2
   pm2 start server.js
   pm2 startup
   pm2 save
   ```

4. **Setup Nginx as Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option 3: Heroku Deployment

### Steps:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku Apps**:
   ```bash
   # Backend
   cd backend
   heroku create construction-backend
   
   # Frontend
   cd ../frontend
   heroku create construction-frontend
   ```

3. **Add MongoDB**:
   ```bash
   heroku addons:create mongolab:sandbox -a construction-backend
   ```

4. **Deploy Backend**:
   ```bash
   cd backend
   git init
   heroku git:remote -a construction-backend
   git add .
   git commit -m "Deploy backend"
   git push heroku master
   ```

5. **Deploy Frontend**:
   ```bash
   cd frontend
   # Add buildpack for Vite
   heroku buildpacks:set heroku/nodejs -a construction-frontend
   git init
   heroku git:remote -a construction-frontend
   git add .
   git commit -m "Deploy frontend"
   git push heroku master
   ```

---

## Pre-Deployment Checklist

### Backend Changes:

1. **Environment Variables**:
   - Create `.env` file (don't commit!)
   - Add to `.gitignore`
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=4000
   NODE_ENV=production
   ```

2. **Update CORS**:
   ```javascript
   const allowedOrigins = [
     'https://your-frontend-domain.com',
     'http://localhost:5173' // for local development
   ];
   ```

3. **Add Health Check Endpoint**:
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date() });
   });
   ```

4. **Error Handling**:
   ```javascript
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({ 
       message: process.env.NODE_ENV === 'production' 
         ? 'Internal server error' 
         : err.message 
     });
   });
   ```

### Frontend Changes:

1. **Environment Variables**:
   Create `.env.production`:
   ```
   VITE_API_URL=https://your-backend-domain.com/api
   ```

2. **Build Optimization**:
   Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: 'dist',
       sourcemap: false,
       minify: 'terser'
     }
   });
   ```

3. **Add Loading States**:
   Handle API delays in production

---

## Post-Deployment Tasks

1. **Setup Custom Domain**:
   - Buy domain from Namecheap/GoDaddy
   - Point DNS to your hosting provider
   - Setup SSL certificate (Let's Encrypt)

2. **Setup Monitoring**:
   - Use Render/Vercel built-in monitoring
   - Or setup Sentry for error tracking
   - Add Google Analytics

3. **Backup Strategy**:
   - MongoDB Atlas automatic backups
   - Export data regularly

4. **Performance Optimization**:
   - Enable CDN for static assets
   - Compress images
   - Enable gzip compression

5. **Security**:
   - Enable HTTPS only
   - Add rate limiting
   - Sanitize user inputs
   - Use helmet.js for security headers

---

## Cost Estimates (Monthly)

### Free Tier (Recommended for Start):
- MongoDB Atlas: Free (M0 - 512MB)
- Render: Free (with sleep after inactivity)
- Vercel: Free (100GB bandwidth)
- Cloudinary: Free (25GB storage, 25GB bandwidth)
- **Total: $0/month**

### Production Tier:
- MongoDB Atlas: $9/month (M10 - 2GB)
- Render: $7/month (always on)
- Vercel: Free or $20/month (Pro)
- Cloudinary: $89/month (Plus plan)
- Domain: $12/year
- **Total: ~$16-105/month**

---

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check backend CORS configuration
   - Verify frontend API URL

2. **Database Connection Failed**:
   - Check MongoDB connection string
   - Verify IP whitelist in MongoDB Atlas

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies in package.json

4. **File Upload Issues**:
   - Implement Cloudinary integration
   - Update multer configuration

---

## Next Steps

1. Choose deployment option (Vercel + Render recommended)
2. Setup MongoDB Atlas
3. Deploy backend first
4. Deploy frontend with backend URL
5. Test all features
6. Setup custom domain
7. Monitor and optimize

Need help with any specific step? Let me know!
