# Vercel Deployment Guide

This guide will help you deploy the Property Tax Lookup application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? **No**
   - Project name: `property-tax-lookup` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings? **No**

### Option 2: Deploy via Vercel Dashboard

1. **Push to Git**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect the configuration

## Project Structure

```
PropertyTaxLookup/
├── api/
│   └── search.js          # Serverless API function
├── frontend/              # React frontend
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── backend/
│   └── properties.csv     # Data file
├── vercel.json           # Main Vercel config
└── DEPLOYMENT.md         # This file
```

## Configuration Files

- **`vercel.json`**: Main configuration for routing and builds
- **`api/search.js`**: Serverless function for property search API
- **`frontend/vercel.json`**: Frontend-specific Vercel configuration

## Environment Variables

No environment variables are required for this deployment.

## API Endpoints

- **Production**: `https://your-app.vercel.app/api/search`
- **Development**: `http://localhost:5000/api/search`

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **API Not Working**:
   - Verify the CSV file is in the correct location
   - Check Vercel function logs in the dashboard

3. **CORS Issues**:
   - The API includes CORS headers for cross-origin requests

### Checking Logs

1. Go to your Vercel dashboard
2. Select your project
3. Click on "Functions" tab
4. View logs for the `/api/search` function

## Post-Deployment

After successful deployment:

1. **Test the application**: Visit your Vercel URL
2. **Test the API**: Try searching for properties
3. **Monitor performance**: Check Vercel analytics
4. **Set up custom domain** (optional): In Vercel dashboard

## Local Development

To test the production build locally:

```bash
# Build the frontend
cd frontend
npm run build

# Test with Vercel CLI
vercel dev
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
