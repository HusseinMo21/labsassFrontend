#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
const args = process.argv.slice(2);

// Function to update Vite config base path
function updateViteConfig(environment) {
  try {
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    if (environment === 'development') {
      // For development, use relative base path
      viteConfig = viteConfig.replace(/base:\s*['"`][^'"`]*['"`]/, "base: './'");
    } else {
      // For production, use /dryasser/ base path
      viteConfig = viteConfig.replace(/base:\s*['"`][^'"`]*['"`]/, "base: '/dryasser/'");
    }
    
    fs.writeFileSync(viteConfigPath, viteConfig);
    console.log(`📁 Updated Vite base path for ${environment}`);
  } catch (error) {
    console.error('❌ Error updating Vite config:', error.message);
  }
}

if (args.length === 0) {
  console.log(`
🔧 Environment Switcher

Usage:
  npm run env:dev     - Switch to development (localhost API + relative base path)
  npm run env:prod    - Switch to production (production API + /dryasser/ base path)
  npm run env:status  - Show current environment and configuration

Environments:
  📱 Development:
      App URL: http://localhost:5173/
      API URL: http://localhost:8000/api
      Base Path: ./ (relative)
      
  🌐 Production:
      App URL: https://semou.it.com/dryasser/
      API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api
      Base Path: /dryasser/
`);
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'development':
  case 'dev':
    fs.writeFileSync(envPath, 'VITE_APP_ENV=development\n');
    updateViteConfig('development');
    console.log('✅ Switched to DEVELOPMENT environment');
    console.log('🌐 App URL: http://localhost:5173/');
    console.log('🔄 API URL: http://localhost:8000/api');
    console.log('📁 Base path: ./ (relative)');
    console.log('▶️  Run: npm run dev');
    break;
    
  case 'production':
  case 'prod':
    fs.writeFileSync(envPath, 'VITE_APP_ENV=production\n');
    updateViteConfig('production');
    console.log('✅ Switched to PRODUCTION environment');
    console.log('🌐 App URL: https://semou.it.com/dryasser/');
    console.log('🔄 API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api');
    console.log('📁 Base path: /dryasser/');
    console.log('▶️  Run: npm run build (for production deployment)');
    break;
    
  case 'status':
    // Check current environment
    let currentEnv = 'production'; // default
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const envMatch = content.match(/VITE_APP_ENV=(\w+)/);
      if (envMatch) {
        currentEnv = envMatch[1];
      }
    }
    
    // Check current Vite base path
    let basePath = '/dryasser/';
    try {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      const baseMatch = viteConfig.match(/base:\s*['"`]([^'"`]*)['"`]/);
      if (baseMatch) {
        basePath = baseMatch[1];
      }
    } catch (error) {
      console.log('⚠️  Could not read Vite config');
    }
    
    console.log(`📍 Current environment: ${currentEnv.toUpperCase()}`);
    console.log(`📁 Current base path: ${basePath}`);
    
    if (currentEnv === 'development') {
      console.log('🌐 App URL: http://localhost:5173/');
      console.log('🔄 API URL: http://localhost:8000/api');
    } else {
      console.log('🌐 App URL: https://semou.it.com/dryasser/');
      console.log('🔄 API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api');
    }
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available commands: dev, prod, status');
    process.exit(1);
}
