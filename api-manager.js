#!/usr/bin/env node
/**
 * api-manager.js - CryptoAI Platform V5.0 API Key Management CLI
 * Command-line tool for managing exchange API credentials
 */

const APIKeyManager = require('./server/services/APIKeyManager');
const readline = require('readline');

class APIManagerCLI {
    constructor() {
        this.apiKeyManager = new APIKeyManager();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        try {
            switch (command) {
                case 'list':
                    this.listExchanges();
                    break;
                case 'add':
                    await this.addExchange(args[1]);
                    break;
                case 'remove':
                    this.removeExchange(args[1]);
                    break;
                case 'validate':
                    await this.validateExchange(args[1]);
                    break;
                case 'status':
                    this.showStatus();
                    break;
                case 'settings':
                    await this.manageSettings();
                    break;
                case 'generate-env':
                    this.generateEnv();
                    break;
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        } finally {
            this.rl.close();
        }
    }

    listExchanges() {
        console.log('\n🏦 CONFIGURED EXCHANGES:\n');
        
        const exchanges = this.apiKeyManager.listConfiguredExchanges();
        
        if (exchanges.length === 0) {
            console.log('  No exchanges configured yet.');
            console.log('  Use "node api-manager.js add <exchange>" to add one.\n');
            return;
        }

        exchanges.forEach(exchange => {
            const status = exchange.validated ? '✅ Validated' : '⚠️ Pending';
            const lastValidated = exchange.lastValidated ? 
                new Date(exchange.lastValidated).toLocaleDateString() : 'Never';
            
            console.log(`  ${exchange.icon} ${exchange.name}`);
            console.log(`    Status: ${status}`);
            console.log(`    Added: ${new Date(exchange.added).toLocaleDateString()}`);
            console.log(`    Last Validated: ${lastValidated}`);
            console.log('');
        });
    }

    async addExchange(exchangeName) {
        if (!exchangeName) {
            console.log('❌ Please specify an exchange name.');
            console.log('Usage: node api-manager.js add <exchange>');
            this.showSupportedExchanges();
            return;
        }

        const normalizedName = exchangeName.toLowerCase().replace(/\s+/g, '_');
        
        if (!this.apiKeyManager.supportedExchanges[normalizedName]) {
            console.log(`❌ Unsupported exchange: ${exchangeName}`);
            this.showSupportedExchanges();
            return;
        }

        const exchangeInfo = this.apiKeyManager.supportedExchanges[normalizedName];
        console.log(`\n🔧 Adding ${exchangeInfo.icon} ${exchangeInfo.name} credentials:\n`);

        const credentials = {};
        
        for (const field of exchangeInfo.fields) {
            const prompt = field === 'secretKey' ? 
                `Enter ${field} (input will be hidden): ` : 
                `Enter ${field}: `;
                
            credentials[field] = await this.askQuestion(prompt, field === 'secretKey');
        }

        console.log(`\n🔄 Adding ${exchangeInfo.name} credentials...`);
        
        const result = await this.apiKeyManager.addExchangeCredentials(normalizedName, credentials);
        
        if (result.success) {
            console.log(`✅ ${result.message}`);
        } else {
            console.log(`❌ Failed to add ${exchangeInfo.name}: ${result.error}`);
        }
    }

    removeExchange(exchangeName) {
        if (!exchangeName) {
            console.log('❌ Please specify an exchange name.');
            console.log('Usage: node api-manager.js remove <exchange>');
            return;
        }

        const normalizedName = exchangeName.toLowerCase().replace(/\s+/g, '_');
        const result = this.apiKeyManager.removeExchangeCredentials(normalizedName);
        
        if (result.success) {
            console.log(`✅ ${result.message}`);
        } else {
            console.log(`❌ ${result.message}`);
        }
    }

    async validateExchange(exchangeName) {
        if (!exchangeName) {
            console.log('❌ Please specify an exchange name.');
            console.log('Usage: node api-manager.js validate <exchange>');
            return;
        }

        const normalizedName = exchangeName.toLowerCase().replace(/\s+/g, '_');
        
        console.log(`🔍 Validating ${normalizedName} credentials...`);
        
        const isValid = await this.apiKeyManager.validateExchangeCredentials(normalizedName);
        
        if (isValid) {
            console.log(`✅ ${normalizedName} credentials are valid`);
        } else {
            console.log(`❌ ${normalizedName} credentials validation failed`);
        }
    }

    showStatus() {
        console.log('\n📊 CRYPTOAI PLATFORM STATUS:\n');
        
        const status = this.apiKeyManager.getSystemStatus();
        
        console.log(`Version: ${status.version}`);
        console.log(`API Key Manager: ${status.apiKeyManagerStatus}`);
        console.log(`Total Exchanges: ${status.totalExchanges}`);
        console.log(`Validated Exchanges: ${status.validatedExchanges}`);
        console.log(`Auto Trading: ${status.autoTradingEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Last Updated: ${new Date(status.lastUpdated).toLocaleString()}`);
        
        const settings = status.settings;
        console.log('\n⚙️ TRADING SETTINGS:');
        console.log(`  Risk Level: ${settings.riskLevel}`);
        console.log(`  Max Daily Loss: ${settings.maxDailyLoss}%`);
        console.log(`  Quote Currency: ${settings.preferredQuoteCurrency}`);
        
        if (status.exchanges.length > 0) {
            console.log('\n🏦 EXCHANGE STATUS:');
            status.exchanges.forEach(exchange => {
                const statusIcon = exchange.validated ? '✅' : '⚠️';
                console.log(`  ${statusIcon} ${exchange.icon} ${exchange.name}`);
            });
        }
        
        console.log('');
    }

    async manageSettings() {
        console.log('\n⚙️ TRADING SETTINGS MANAGEMENT:\n');
        
        const currentSettings = this.apiKeyManager.getTradingSettings();
        
        console.log('Current settings:');
        console.log(`  Auto Trading: ${currentSettings.autoTradingEnabled}`);
        console.log(`  Risk Level: ${currentSettings.riskLevel}`);
        console.log(`  Max Daily Loss: ${currentSettings.maxDailyLoss}%`);
        console.log(`  Quote Currency: ${currentSettings.preferredQuoteCurrency}`);
        
        const updateSettings = await this.askQuestion('\nUpdate settings? (y/n): ');
        
        if (updateSettings.toLowerCase() !== 'y') {
            return;
        }

        const newSettings = {};
        
        const autoTrading = await this.askQuestion('Enable auto trading? (y/n): ');
        newSettings.autoTradingEnabled = autoTrading.toLowerCase() === 'y';
        
        if (newSettings.autoTradingEnabled) {
            console.log('\nRisk levels: 1=Conservative, 2=Moderate, 3=Aggressive');
            const riskChoice = await this.askQuestion('Risk level (1-3): ');
            const riskLevels = { '1': 'conservative', '2': 'moderate', '3': 'aggressive' };
            newSettings.riskLevel = riskLevels[riskChoice] || 'moderate';
            
            const maxLoss = await this.askQuestion('Max daily loss % (1-20): ');
            newSettings.maxDailyLoss = Math.min(Math.max(parseFloat(maxLoss) || 5, 1), 20);
            
            const quoteCurrency = await this.askQuestion('Quote currency (USDT/BUSD/USDC): ');
            newSettings.preferredQuoteCurrency = quoteCurrency.toUpperCase() || 'USDT';
        }
        
        const result = this.apiKeyManager.updateTradingSettings(newSettings);
        
        if (result.success) {
            console.log('✅ Settings updated successfully');
        } else {
            console.log(`❌ Failed to update settings: ${result.error}`);
        }
    }

    generateEnv() {
        console.log('\n🔄 Generating environment configuration...');
        
        const result = this.apiKeyManager.generateEnvFile();
        
        if (result.success) {
            console.log(`✅ Environment file generated: ${result.path}`);
            console.log('\n📝 Next steps:');
            console.log('  1. Review the generated .env file');
            console.log('  2. Start the platform: npm run start:v5');
            console.log('  3. Access dashboard: http://localhost:3000');
        } else {
            console.log(`❌ Failed to generate environment file: ${result.error}`);
        }
    }

    showSupportedExchanges() {
        console.log('\n📈 SUPPORTED EXCHANGES:');
        Object.entries(this.apiKeyManager.supportedExchanges).forEach(([key, info]) => {
            console.log(`  ${info.icon} ${info.name} (${key})`);
        });
        console.log('');
    }

    showHelp() {
        console.log(`
🔧 CryptoAI Platform V5.0 - API Key Manager

USAGE:
  node api-manager.js <command> [options]

COMMANDS:
  list                   List all configured exchanges
  add <exchange>         Add exchange API credentials
  remove <exchange>      Remove exchange credentials
  validate <exchange>    Validate exchange credentials
  status                 Show platform status
  settings               Manage trading settings
  generate-env           Generate .env configuration file
  help                   Show this help message

EXAMPLES:
  node api-manager.js list
  node api-manager.js add binance
  node api-manager.js validate coinbase
  node api-manager.js status

SUPPORTED EXCHANGES:
        `);
        
        this.showSupportedExchanges();
    }

    async askQuestion(question, hideInput = false) {
        return new Promise((resolve) => {
            if (hideInput) {
                // Hide input for sensitive data
                process.stdout.write(question);
                process.stdin.setRawMode(true);
                let input = '';
                
                const handler = (char) => {
                    char = char.toString();
                    
                    if (char === '\r' || char === '\n') {
                        process.stdin.setRawMode(false);
                        process.stdin.removeListener('data', handler);
                        process.stdout.write('\n');
                        resolve(input);
                    } else if (char === '\u0003') {
                        // Ctrl+C
                        process.exit();
                    } else if (char === '\u007f') {
                        // Backspace
                        if (input.length > 0) {
                            input = input.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    } else {
                        input += char;
                        process.stdout.write('*');
                    }
                };
                
                process.stdin.on('data', handler);
            } else {
                this.rl.question(question, resolve);
            }
        });
    }
}

// Run the CLI
if (require.main === module) {
    const cli = new APIManagerCLI();
    cli.run().catch(error => {
        console.error('❌ CLI Error:', error.message);
        process.exit(1);
    });
}

module.exports = APIManagerCLI;
