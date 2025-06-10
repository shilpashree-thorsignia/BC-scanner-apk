# Deployment Instructions for Vercel

## Prerequisites
1. Make sure you have the latest Expo CLI: `npm install -g @expo/cli`
2. Install Vercel CLI: `npm install -g vercel`

## Steps to Deploy

### 1. Test Local Web Build
```bash
npm run build:web
```
This should create a `dist` folder with your web build.

### 2. Deploy to Vercel
```bash
vercel
```

### 3. For subsequent deployments
```bash
vercel --prod
```

## Troubleshooting

### If you get build errors:
1. Make sure all dependencies are installed: `npm install`
2. Clear Expo cache: `expo r -c`
3. Try building locally first: `npm run build:web`

### If pages don't load properly:
1. Check that the `dist` folder contains `index.html`
2. Verify the routes are working in local development
3. Check Vercel function logs for errors

### Common Issues:
- **404 errors**: Usually means the build output directory is wrong
- **Assets not loading**: Check that asset paths are relative
- **Routing issues**: Make sure React Router/Expo Router is configured for web

## Alternative: Deploy to Expo Hosting
If Vercel continues to have issues, consider using Expo's built-in hosting:
```bash
expo publish
``` 