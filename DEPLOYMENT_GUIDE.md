# DelivraX Deployment Guide

## ✅ Backend Deployment (Completed)

Your backend is successfully deployed on Render:
- **Live URL**: https://delivery-app-7t7f.onrender.com
- **API Base**: https://delivery-app-7t7f.onrender.com/api
- **Socket URL**: https://delivery-app-7t7f.onrender.com

---

## 📝 Frontend Configuration (Completed)

All frontend files have been updated to use your deployed backend:

### Files Modified:

1. **`.env`** - Environment variables
   ```env
   VITE_API_URL=https://delivery-app-7t7f.onrender.com/api
   VITE_SOCKET_URL=https://delivery-app-7t7f.onrender.com
   VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
   ```

2. **`src/utils/axios.js`** - API client configuration
   - Updated to use `import.meta.env.VITE_API_URL`

3. **`src/pages/Dashboard/Driver/index.jsx`** - Driver dashboard
   - Socket connection updated to use `import.meta.env.VITE_SOCKET_URL`

4. **`src/pages/Dashboard/Customer/CustomerDashboard.jsx`** - Customer dashboard
   - Socket connection updated
   - Rating API call updated

5. **`src/pages/Dashboard/Admin/AdminDashboard.jsx`** - Admin dashboard
   - Socket connection updated

6. **`src/pages/TrackOrder/index.jsx`** - Order tracking
   - Socket connection updated

---

## 🚀 Frontend Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Navigate to Frontend Directory
```bash
cd frontend
```

#### Step 3: Deploy
```bash
vercel
```

#### Step 4: Follow Prompts
- Set up and deploy: **Yes**
- Which scope: **Your account**
- Link to existing project: **No**
- Project name: **delivrax-frontend** (or your choice)
- Directory: **./frontend** (current directory)
- Override settings: **No**

#### Step 5: Production Deployment
```bash
vercel --prod
```

**Your frontend will be live at**: `https://delivrax-frontend.vercel.app`

---

### Option 2: Netlify

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Build Your Project
```bash
cd frontend
npm run build
```

#### Step 3: Deploy
```bash
netlify deploy
```

#### Step 4: Production Deployment
```bash
netlify deploy --prod
```

**Build Settings**:
- Build command: `npm run build`
- Publish directory: `dist`

---

### Option 3: Render (Same as Backend)

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Frontend deployment ready"
git push origin main
```

#### Step 2: Create New Web Service on Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: delivrax-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Environment**: Node

#### Step 3: Add Environment Variables
```
VITE_API_URL=https://delivery-app-7t7f.onrender.com/api
VITE_SOCKET_URL=https://delivery-app-7t7f.onrender.com
```

---

## 🔧 Backend Configuration Check

### Ensure CORS is Configured

Your backend should allow requests from your frontend domain. Check `backend/server.js`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-frontend-domain.vercel.app', // Add your frontend URL
    'https://your-frontend-domain.netlify.app',
    'https://your-frontend-domain.onrender.com'
  ],
  credentials: true
}));
```

### Socket.IO CORS Configuration

Check `backend/server.js` for Socket.IO setup:

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://your-frontend-domain.vercel.app', // Add your frontend URL
      'https://your-frontend-domain.netlify.app',
      'https://your-frontend-domain.onrender.com'
    ],
    credentials: true
  }
});
```

---

## 🧪 Testing Your Deployment

### 1. Test API Connection
Open browser console on your frontend and check:
```javascript
console.log(import.meta.env.VITE_API_URL);
// Should show: https://delivery-app-7t7f.onrender.com/api
```

### 2. Test Socket Connection
Check browser console for:
```
✅ Socket connected: [socket-id]
```

### 3. Test Features
- [ ] User registration
- [ ] User login
- [ ] Create order (Customer)
- [ ] Accept order (Driver)
- [ ] Real-time notifications
- [ ] Order tracking
- [ ] Driver location updates

---

## 🔐 Environment Variables Checklist

### Frontend (.env)
- [x] `VITE_API_URL` - Backend API URL
- [x] `VITE_SOCKET_URL` - Backend Socket URL
- [ ] `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (if using)

### Backend (.env)
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - JWT secret key
- [ ] `PORT` - Server port (5000)
- [ ] `NODE_ENV` - Environment (production)

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Error**: "Access to fetch blocked by CORS policy"

**Solution**: 
- Add your frontend domain to backend CORS configuration
- Redeploy backend after changes

### Issue 2: Socket Connection Failed
**Error**: "WebSocket connection failed"

**Solution**:
- Check `VITE_SOCKET_URL` in frontend `.env`
- Verify Socket.IO CORS settings in backend
- Ensure backend is running

### Issue 3: API Calls Failing
**Error**: "Failed to fetch" or 404 errors

**Solution**:
- Verify `VITE_API_URL` is correct
- Check backend API routes are working
- Test backend API directly: `https://delivery-app-7t7f.onrender.com/api/health`

### Issue 4: Environment Variables Not Loading
**Error**: `import.meta.env.VITE_API_URL` is undefined

**Solution**:
- Ensure `.env` file is in frontend root directory
- Restart development server
- For production, set environment variables in hosting platform

---

## 📊 Deployment Checklist

### Pre-Deployment
- [x] Backend deployed on Render
- [x] Frontend configured with backend URL
- [x] Environment variables set
- [ ] Google Maps API key added (if needed)
- [ ] Test all features locally

### Deployment
- [ ] Choose hosting platform (Vercel/Netlify/Render)
- [ ] Build frontend successfully
- [ ] Deploy to hosting platform
- [ ] Set environment variables on hosting platform

### Post-Deployment
- [ ] Test frontend URL
- [ ] Verify API connection
- [ ] Test Socket.IO connection
- [ ] Test all user flows
- [ ] Check browser console for errors
- [ ] Test on mobile devices

---

## 🌐 Production URLs

### Backend (Render)
- **API**: https://delivery-app-7t7f.onrender.com/api
- **Socket**: https://delivery-app-7t7f.onrender.com
- **Health Check**: https://delivery-app-7t7f.onrender.com/api/health

### Frontend (To be deployed)
- **Vercel**: `https://[your-project].vercel.app`
- **Netlify**: `https://[your-project].netlify.app`
- **Render**: `https://[your-project].onrender.com`

---

## 📞 Support

If you encounter any issues:

1. Check browser console for errors
2. Check backend logs on Render dashboard
3. Verify environment variables are set correctly
4. Test API endpoints directly using Postman or browser
5. Ensure MongoDB is accessible from Render

---

## 🎉 Next Steps

1. **Deploy Frontend**: Choose a platform and deploy
2. **Update Backend CORS**: Add frontend URL to allowed origins
3. **Test Everything**: Run through all user flows
4. **Set Up Custom Domain** (Optional): Configure custom domain
5. **Monitor Performance**: Use platform analytics
6. **Set Up CI/CD** (Optional): Automate deployments

---

**Last Updated**: October 18, 2025
**Backend Status**: ✅ Deployed
**Frontend Status**: ⏳ Ready to Deploy
