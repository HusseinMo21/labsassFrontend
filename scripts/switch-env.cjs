#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
🔧 Environment Switcher

Usage:
  npm run env:dev     - Switch to development
  npm run env:prod    - Switch to production
  npm run env:status  - Show current environment

Current environments:
  📱 Development: http://localhost:5173/
      API: http://localhost:8000/api
  🌐 Production:  https://phplaravel-1526034-5875973.cloudwaysapps.com/
      API: https://phplaravel-1526034-5875973.cloudwaysapps.com/api
`);
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'development':
  case 'dev':
    fs.writeFileSync(envPath, 'VITE_APP_ENV=development\n');
    console.log('✅ Switched to DEVELOPMENT environment');
    console.log('🌐 App URL: http://localhost:5173/');
    console.log('🔄 API URL: http://localhost:8000/api');
    console.log('▶️  Run: npm run dev');
    break;
    
  case 'production':
  case 'prod':
    fs.writeFileSync(envPath, 'VITE_APP_ENV=production\n');
    console.log('✅ Switched to PRODUCTION environment');
    console.log('🌐 App URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/');
    console.log('🔄 API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api');
    console.log('▶️  Run: npm run dev (to test production API)');
    break;
    
  case 'status':
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const envMatch = content.match(/VITE_APP_ENV=(\w+)/);
      if (envMatch) {
        const currentEnv = envMatch[1];
        console.log(`📍 Current environment: ${currentEnv.toUpperCase()}`);
        
        if (currentEnv === 'development') {
          console.log('🌐 App URL: http://localhost:5173/');
          console.log('🔄 API URL: http://localhost:8000/api');
        } else {
          console.log('🌐 App URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/');
          console.log('🔄 API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api');
        }
      } else {
        console.log('📍 Current environment: PRODUCTION (default)');
        console.log('🌐 App URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/');
        console.log('🔄 API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api');
      }
    } else {
      console.log('📍 Current environment: PRODUCTION (default)');
      console.log('🌐 App URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/');
      console.log('🔄 API URL: https://phplaravel-1526034-5875973.cloudwaysapps.com/api');
    }
    break;
    
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available commands: dev, prod, status');
    process.exit(1);
}
