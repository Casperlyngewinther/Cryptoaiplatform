#!/usr/bin/env node
/**
 * setup.js - CryptoAI Platform V5.0 Easy Setup Script
 * One-command setup for API keys and platform configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               🚀 CryptoAI Platform V5.0 Setup                ║
║                   Easy API Key Installation                  ║
╚═══════════════════════════════════════════════════════════════╝
`);

console.log('🔧 Starting easy setup process...\n');

// Check if we're in the right directory
const serverDir = path.join(__dirname, 'server');
const wizardPath = path.join(serverDir, 'services', 'FirstTimeSetupWizard.js');

if (!fs.existsSync(wizardPath)) {
    console.error('❌ Setup wizard not found. Please run this from the project root directory.');
    process.exit(1);
}

// Check if Node.js modules are installed
const packageJsonPath = path.join(serverDir, 'package.json');
const nodeModulesPath = path.join(serverDir, 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    
    const npm = spawn('npm', ['install'], {
        cwd: serverDir,
        stdio: 'inherit'
    });
    
    npm.on('close', (code) => {
        if (code !== 0) {
            console.error('❌ Failed to install dependencies');
            process.exit(1);
        }
        
        console.log('✅ Dependencies installed successfully\n');
        startWizard();
    });
} else {
    startWizard();
}

function startWizard() {
    console.log('🧙‍♂️ Launching setup wizard...\n');
    
    // Start the setup wizard
    const wizard = spawn('node', [wizardPath], {
        cwd: serverDir,
        stdio: 'inherit'
    });
    
    wizard.on('close', (code) => {
        if (code === 0) {
            console.log('\n🎉 Setup completed successfully!');
            console.log('\n🚀 Quick Commands:');
            console.log('  • Start platform: npm run start:v5');
            console.log('  • Check status: npm run status:v5');
            console.log('  • View dashboard: http://localhost:3000');
            console.log('\n📚 Documentation: ./README_V5.md');
        } else {
            console.log('\n⚠️ Setup was cancelled or failed.');
            console.log('You can run the setup again anytime with: node setup.js');
        }
    });
    
    wizard.on('error', (error) => {
        console.error('❌ Error starting setup wizard:', error.message);
        process.exit(1);
    });
}
