# Environment Configuration Guide

This frontend application supports switching between development and production API environments using the same approach as your SeaFrance project.

## 🚀 Quick Start

### Development Environment (localhost)
```bash
# Switch to development environment
npm run env:dev

# Start the development server
npm run dev
```

### Production Environment (Cloudways)
```bash
# Switch to production environment
npm run env:prod

# Start the development server (but using production API)
npm run dev
```

### Check Current Environment
```bash
npm run env:status
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run env:dev` | Switch to development environment (localhost API) |
| `npm run env:prod` | Switch to production environment (Cloudways API) |
| `npm run env:status` | Show current environment configuration |
| `npm run dev` | Start development server with current environment |
| `npm run build` | Build for production |

## 🔧 How It Works

1. **Environment Switching**: The `scripts/switch-env.cjs` script creates/updates `.env.local` file
2. **Environment Configuration**: The `src/config/environment.ts` file reads from `.env.local` and configures the app
3. **Axios Configuration**: The `src/config/axios.ts` file automatically uses the correct API base URL
4. **Default Environment**: Production is the default environment

## 🌍 Environment Configuration

### Development
- **App URL**: `http://localhost:5173/`
- **API URL**: `http://localhost:8000/api`
- **Debug Mode**: Enabled
- **Timeout**: 120 seconds

### Production
- **App URL**: `https://phplaravel-1526034-5875973.cloudwaysapps.com/`
- **API URL**: `https://phplaravel-1526034-5875973.cloudwaysapps.com/api`
- **Debug Mode**: Disabled
- **Timeout**: 120 seconds

## 📝 Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Check Current Environment**:
   ```bash
   npm run env:status
   ```

3. **Switch to Development** (if needed):
   ```bash
   npm run env:dev
   npm run dev
   ```

4. **Switch to Production** (if needed):
   ```bash
   npm run env:prod
   npm run dev
   ```

## 🔍 Verification

When you start the application, check the browser console for:

**Development:**
```
🚀 API configured for development environment
📡 Base URL: http://localhost:8000/api
🏷️  App Name: Dryasser Development
🔧 Debug Mode: true
⏱️  Timeout: 120000ms
```

**Production:**
```
🚀 API configured for production environment
📡 Base URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api
🏷️  App Name: Dryasser
```

## 🛠️ Troubleshooting

### "Backend not available" Error
This means the API server is not accessible. Check:

1. **For Development**: Make sure your Laravel backend is running on `http://localhost:8000`
2. **For Production**: Verify the Cloudways server is running and accessible
3. **Network Issues**: Check your internet connection
4. **CORS Issues**: Make sure your Laravel backend allows the frontend domain

### Environment Not Switching
1. Check if `.env.local` file exists in the frontend root
2. Verify the content of `.env.local` file
3. Restart the development server after switching environments

### API Connection Issues
1. Test the API directly in Postman or browser
2. Check if the API endpoints are working
3. Verify authentication is working
