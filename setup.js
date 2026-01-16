#!/usr/bin/env node

/**
 * Interior Library Setup Script
 * Helps configure the Firebase project and environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏠 Interior Library Setup');
console.log('========================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created');
        console.log('⚠️  Please edit .env with your Firebase configuration\n');
    } else {
        console.log('❌ .env.example not found\n');
    }
} else {
    console.log('✅ .env file already exists\n');
}

// Check if Firebase CLI is installed
try {
    execSync('firebase --version', { stdio: 'ignore' });
    console.log('✅ Firebase CLI is installed');
} catch (error) {
    console.log('❌ Firebase CLI not found');
    console.log('📦 Install it with: npm install -g firebase-tools\n');
    process.exit(1);
}

// Check if user is logged in to Firebase
try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    console.log('✅ Firebase CLI is authenticated');
} catch (error) {
    console.log('❌ Not logged in to Firebase');
    console.log('🔐 Run: firebase login\n');
    process.exit(1);
}

console.log('\n🚀 Setup complete! Next steps:');
console.log('1. Edit .env with your Firebase configuration');
console.log('2. Run: firebase init (if not done already)');
console.log('3. Run: npm install');
console.log('4. Run: npm run dev');
console.log('5. Run: npm run deploy (when ready)');
console.log('\n📖 See DEPLOYMENT.md for detailed instructions');