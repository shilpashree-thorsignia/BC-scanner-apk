# Complete Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Backend Deployment (Django on Vercel)

```bash
# Navigate to backend directory
cd backend

# Run deployment preparation script
python deploy.py

# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
```

### 2. Configure Environment Variables in Vercel Dashboard

After deployment, add these environment variables in your Vercel project dashboard:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | `iQG_8vR2nW4pV7xE9yF3zL1mK5oU6qA8bN7cD2eR4tY9wS3gH1jM0lZ6xV9uI2oP5a` |
| `DEBUG` | `False` |
| `DJANGO_SETTINGS_MODULE` | `core.settings_production` |
| `DATABASE_URL` | `postgresql://postgres:pUbGdoKJueHBsQqwqlMGdHueQoxdronB@metro.proxy.rlwy.net:27107/railway` |
| `DOMAIN` | `your-actual-backend-domain.vercel.app` |
| `TESSERACT_CMD` | `/usr/bin/tesseract` |

### 3. Update Frontend Configuration

After backend deployment, update the frontend configuration:

1. Open `app/config.ts`
2. Replace `'https://your-backend-vercel-app.vercel.app/api'` with your actual Vercel backend URL
3. Example: `'https://bc-scanner-backend.vercel.app/api'`

### 4. Update Backend CORS Settings

After getting your frontend domain, update `backend/core/settings_production.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-actual-frontend-domain.vercel.app",  # Your frontend domain
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://192.168.1.26:8081",
]
```

## 📋 Pre-configured Values

### Database Configuration ✅
- **Railway PostgreSQL** is already configured
- Connection string: `postgresql://postgres:pUbGdoKJueHBsQqwqlMGdHueQoxdronB@metro.proxy.rlwy.net:27107/railway`

### Security ✅
- **SECRET_KEY** is generated and configured
- **DEBUG** is set to False for production

### API Configuration ✅
- Frontend is configured to auto-detect environment
- Development: Uses local IP (192.168.1.26:8000)
- Production: Uses Vercel backend URL

## 🔧 Manual Configuration Steps

### Step 1: Deploy Backend
```bash
cd backend
vercel --prod
```

### Step 2: Note Your Backend URL
After deployment, Vercel will give you a URL like:
`https://your-project-name.vercel.app`

### Step 3: Update Frontend Config
```typescript
// In app/config.ts
const PRODUCTION_API_URL = 'https://your-actual-backend-url.vercel.app/api';
```

### Step 4: Update Backend CORS
```python
# In backend/core/settings_production.py
CORS_ALLOWED_ORIGINS = [
    "https://your-actual-frontend-domain.vercel.app",
    # ... other origins
]
```

### Step 5: Redeploy Both
```bash
# Backend
cd backend && vercel --prod

# Frontend (if needed)
cd ../app && vercel --prod
```

## 🧪 Testing the Deployment

### Test Backend API
```bash
curl https://your-backend-url.vercel.app/api/business-cards/
```

### Test Database Connection
The backend will automatically run migrations on deployment.

### Test OCR Functionality
Upload a business card image through the frontend to test OCR processing.

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Update CORS_ALLOWED_ORIGINS with your actual frontend domain
   - Ensure both HTTP and HTTPS variants are included if needed

2. **Database Connection Issues**
   - Verify DATABASE_URL is correctly set in Vercel environment variables
   - Check Railway database is active and accessible

3. **API Not Found (404)**
   - Verify frontend API_BASE_URL points to correct backend domain
   - Check backend deployment was successful

4. **Tesseract Errors**
   - OCR may not work immediately on Vercel due to Tesseract availability
   - Consider using a different OCR service for production

### Environment Variables Checklist:
- [ ] SECRET_KEY is set and unique
- [ ] DEBUG is set to False
- [ ] DATABASE_URL points to Railway database
- [ ] DOMAIN matches your Vercel domain
- [ ] CORS origins include your frontend domain

## 📱 Frontend Deployment (Optional)

If you want to deploy the React Native app as a web app:

```bash
cd app
npm run web
vercel --prod
```

## 🎉 Success!

Once everything is configured:
- Backend API will be available at: `https://your-backend.vercel.app/api/`
- Database will persist data in Railway PostgreSQL
- OCR functionality will work for business card scanning
- QR code scanning will be functional

Your Business Card Scanner is now live! 🚀 