# 🚀 Simple Vercel Deployment Guide

## Step 1: Install Vercel CLI

Open your terminal and run:
```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```
- Choose your preferred login method (GitHub, GitLab, etc.)
- Complete the authentication in your browser

## Step 3: Deploy Your Backend

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Start deployment:**
   ```bash
   vercel
   ```

3. **Answer the questions:**
   - "Set up and deploy?" → **Yes**
   - "Which scope?" → Choose your account
   - "Link to existing project?" → **No** (for first deployment)
   - "What's your project's name?" → `bc-scanner-backend` (or any name you like)
   - "In which directory is your code located?" → **./** (current directory)
   - "Want to override the settings?" → **Yes**

4. **Configure Project Settings:**
   - "Which settings would you like to override?"
     - **Build Command**: `chmod +x build_files.sh && ./build_files.sh`
     - **Output Directory**: `staticfiles`
     - **Install Command**: `pip install -r requirements.txt`
     - **Development Command**: Leave empty or press Enter

## Step 4: Add Environment Variables

After deployment, you'll get a URL like: `https://bc-scanner-backend.vercel.app`

### Method 1: Using Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Open [vercel.com](https://vercel.com)
   - Click on your project (`bc-scanner-backend`)

2. **Navigate to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" on the left

3. **Add these variables one by one:**

   **Click "Add New" for each:**

   | Name | Value |
   |------|-------|
   | `SECRET_KEY` | `iQG_8vR2nW4pV7xE9yF3zL1mK5oU6qA8bN7cD2eR4tY9wS3gH1jM0lZ6xV9uI2oP5a` |
   | `DEBUG` | `False` |
   | `DJANGO_SETTINGS_MODULE` | `core.settings_production` |
   | `DATABASE_URL` | `postgresql://postgres:pUbGdoKJueHBsQqwqlMGdHueQoxdronB@metro.proxy.rlwy.net:27107/railway` |
   | `TESSERACT_CMD` | `/usr/bin/tesseract` |

4. **Save each variable:**
   - After adding each variable, click "Save"

### Method 2: Using Command Line

```bash
# Add each environment variable
vercel env add SECRET_KEY
# Paste: iQG_8vR2nW4pV7xE9yF3zL1mK5oU6qA8bN7cD2eR4tY9wS3gH1jM0lZ6xV9uI2oP5a

vercel env add DEBUG
# Type: False

vercel env add DJANGO_SETTINGS_MODULE
# Type: core.settings_production

vercel env add DATABASE_URL
# Paste: postgresql://postgres:pUbGdoKJueHBsQqwqlMGdHueQoxdronB@metro.proxy.rlwy.net:27107/railway

vercel env add TESSERACT_CMD
# Type: /usr/bin/tesseract
```

## Step 5: Deploy to Production

```bash
vercel --prod
```

## Step 6: Update Your Frontend

1. **Note your backend URL** (from Step 3)
   - Example: `https://bc-scanner-backend.vercel.app`

2. **Update frontend config:**
   - Open `app/config.ts`
   - Find this line:
     ```typescript
     const PRODUCTION_API_URL = 'https://your-backend-vercel-app.vercel.app/api';
     ```
   - Replace with your actual URL:
     ```typescript
     const PRODUCTION_API_URL = 'https://bc-scanner-backend.vercel.app/api';
     ```

## Step 7: Test Your API

Open your browser and visit:
```
https://your-backend-url.vercel.app/api/business-cards/
```

You should see an empty list `[]` or your business cards.

## 🔧 Vercel Project Settings

If you need to change project settings later:

1. **Go to Project Settings:**
   - Vercel Dashboard → Your Project → Settings

2. **Important Settings:**
   - **Root Directory**: `./` (current directory)
   - **Framework Preset**: Other
   - **Build Command**: `chmod +x build_files.sh && ./build_files.sh`
   - **Output Directory**: `staticfiles`
   - **Install Command**: `pip install -r requirements.txt`

## 📁 Directory Structure Check

Make sure your `backend` folder has these files:
```
backend/
├── vercel.json          ✅
├── build_files.sh       ✅
├── requirements.txt     ✅
├── manage.py           ✅
├── core/
│   ├── settings_production.py  ✅
│   └── wsgi.py         ✅
└── scanner/
    └── (your app files)
```

## 🎯 Quick Troubleshooting

### Problem: Build fails
**Solution:** Check if all files exist:
```bash
ls -la backend/
# You should see vercel.json, build_files.sh, requirements.txt
```

### Problem: Environment variables not working
**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Make sure all variables are added
3. Redeploy: `vercel --prod`

### Problem: Database connection error
**Solution:**
1. Check DATABASE_URL is exactly: 
   `postgresql://postgres:pUbGdoKJueHBsQqwqlMGdHueQoxdronB@metro.proxy.rlwy.net:27107/railway`
2. No extra spaces or characters

### Problem: CORS errors
**Solution:**
1. Update `backend/core/settings_production.py`
2. Add your frontend domain to `CORS_ALLOWED_ORIGINS`
3. Redeploy

## ✅ Success Checklist

- [ ] Vercel CLI installed
- [ ] Successfully logged in to Vercel
- [ ] Project deployed (got a URL)
- [ ] Environment variables added
- [ ] Frontend config updated with backend URL
- [ ] API endpoint accessible in browser
- [ ] No CORS errors when testing

## 🎉 You're Done!

Your Django Business Card Scanner backend is now live on Vercel! 

**Next steps:**
1. Test the API endpoints
2. Upload a business card image to test OCR
3. Configure your frontend to use the new backend URL

**Your backend URL:** `https://your-project-name.vercel.app/api/` 