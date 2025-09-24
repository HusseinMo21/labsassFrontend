# Environment Configuration

This project supports easy switching between development and production environments.

## Available Commands

### Environment Switching
```bash
npm run env:dev     # Switch to development environment
npm run env:prod    # Switch to production environment  
npm run env:status  # Show current environment status
```

### Build Commands
```bash
npm run build:dev   # Switch to dev + build
npm run build:prod  # Switch to prod + build
npm run build       # Build with current environment
```

## Environment Configurations

### Development Environment
- **App URL**: `http://localhost:5173/`
- **API URL**: `http://localhost:8000/api`
- **Base Path**: `./` (relative)
- **Use Case**: Local development with local Laravel server

### Production Environment  
- **App URL**: `https://semou.it.com/dryasser/`
- **API URL**: `https://phplaravel-1526034-5875973.cloudwaysapps.com/api`
- **Base Path**: `/dryasser/`
- **Use Case**: Production deployment

## What Gets Changed

When you run the environment switching commands, the following files are updated:

1. **`.env.local`** - Sets `VITE_APP_ENV` variable
2. **`vite.config.ts`** - Updates the `base` path for asset loading

## Usage Examples

```bash
# Start development
npm run env:dev
npm run dev

# Build for production
npm run env:prod  
npm run build

# Check current status
npm run env:status
```

## Environment Variables

The environment configuration is handled in `src/config/environment.ts` and uses the `VITE_APP_ENV` variable to determine which configuration to use.

- `development` - Uses localhost URLs
- `production` - Uses production URLs