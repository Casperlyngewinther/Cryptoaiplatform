#!/bin/bash

# CryptoAI PostgreSQL/TimescaleDB Setup Script
# Automatiseret installation og konfiguration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo -e "${BLUE}"
echo "=========================================="
echo "   CryptoAI PostgreSQL Migration Setup"
echo "=========================================="
echo -e "${NC}"

# Check if running as root for system-wide installation
if [[ $EUID -eq 0 ]]; then
   log_warn "Running as root. This will install PostgreSQL system-wide."
else
   log_info "Running as regular user. Will install Node.js dependencies only."
fi

# Step 1: Install Node.js dependencies
log_step "Installing Node.js dependencies..."

cd "$(dirname "$0")/.."

# Update package.json with PostgreSQL dependencies
log_info "Adding PostgreSQL dependencies to package.json..."

npm install pg@8.11.3 --save
npm install uuid@9.0.1 --save

log_info "PostgreSQL Node.js dependencies installed"

# Step 2: Install PostgreSQL (if root)
if [[ $EUID -eq 0 ]]; then
    log_step "Installing PostgreSQL and TimescaleDB..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            log_info "Installing on Ubuntu/Debian..."
            
            # Add PostgreSQL repository
            sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
            wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
            
            # Add TimescaleDB repository
            echo "deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main" | tee /etc/apt/sources.list.d/timescaledb.list
            wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | apt-key add -
            
            apt-get update
            apt-get install -y postgresql-14 postgresql-client-14 postgresql-contrib-14
            apt-get install -y timescaledb-2-postgresql-14 timescaledb-tools
            
        # CentOS/RHEL
        elif command -v yum &> /dev/null; then
            log_info "Installing on CentOS/RHEL..."
            
            yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
            yum install -y postgresql14-server postgresql14 postgresql14-contrib
            
            # TimescaleDB
            yum install -y https://packagecloud.io/timescale/timescaledb/packages/el/7/timescaledb-postgresql-14-2.8.1-0.el7.x86_64.rpm/download.rpm
            
        else
            log_error "Unsupported Linux distribution"
            exit 1
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        log_info "Installing on macOS..."
        
        if command -v brew &> /dev/null; then
            brew install postgresql@14
            brew install timescaledb
        else
            log_error "Homebrew not found. Please install Homebrew first."
            exit 1
        fi
        
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    log_info "PostgreSQL and TimescaleDB installed successfully"
else
    log_info "Skipping PostgreSQL installation (requires root privileges)"
    log_info "Please install PostgreSQL and TimescaleDB manually:"
    echo "  - PostgreSQL 14+"
    echo "  - TimescaleDB extension"
fi

# Step 3: Setup database (if PostgreSQL is running)
log_step "Setting up database..."

if command -v psql &> /dev/null && pg_isready &> /dev/null; then
    log_info "PostgreSQL is running. Setting up database..."
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE cryptoai_production;" 2>/dev/null || log_warn "Database already exists"
    sudo -u postgres psql -c "CREATE USER cryptoai_user WITH PASSWORD 'cryptoai_password123';" 2>/dev/null || log_warn "User already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cryptoai_production TO cryptoai_user;" 2>/dev/null
    sudo -u postgres psql -c "ALTER USER cryptoai_user CREATEDB;" 2>/dev/null
    
    # Enable TimescaleDB extension
    sudo -u postgres psql -d cryptoai_production -c "CREATE EXTENSION IF NOT EXISTS timescaledb;" 2>/dev/null
    sudo -u postgres psql -d cryptoai_production -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;" 2>/dev/null
    
    log_info "Database setup completed"
else
    log_warn "PostgreSQL not running. Please start PostgreSQL and run database setup manually."
fi

# Step 4: Create environment configuration
log_step "Creating environment configuration..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    log_info "Created .env file from template"
    log_warn "Please edit .env file with your actual database credentials"
else
    log_info ".env file already exists"
fi

# Step 5: Run database migrations
log_step "Running database migrations..."

# Create migrations directory if it doesn't exist
mkdir -p migrations

log_info "Migration files are ready in ./migrations/"
log_info "Run 'node scripts/migrate-to-postgresql.js' to migrate data from SQLite"

# Step 6: Create backup scripts
log_step "Setting up backup scripts..."

chmod +x scripts/backup-database.sh
log_info "Backup script is now executable"

# Step 7: Setup cron job for backups (optional)
read -p "Do you want to setup automatic daily backups? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Setting up daily backup cron job..."
    
    # Add cron job for daily backups at 2 AM
    CRON_JOB="0 2 * * * $(pwd)/scripts/backup-database.sh >> $(pwd)/logs/backup.log 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
        log_info "Backup cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_info "Daily backup cron job added"
    fi
fi

# Step 8: Create log directories
log_step "Creating log directories..."

mkdir -p logs
touch logs/backup.log
touch logs/migration.log
touch logs/cryptoai.log
touch logs/error.log

log_info "Log directories created"

# Step 9: Test database connection
log_step "Testing database connection..."

node -e "
const DatabaseConfig = require('./config/database');
(async () => {
  try {
    const result = await DatabaseConfig.testConnection();
    if (result.success) {
      console.log('✅ Database connection successful');
      console.log('   Version:', result.version);
      console.log('   Timestamp:', result.timestamp);
    } else {
      console.log('❌ Database connection failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  } finally {
    process.exit(0);
  }
})();
" 2>/dev/null || log_warn "Database connection test failed (normal if PostgreSQL not configured yet)"

echo
log_info "PostgreSQL/TimescaleDB setup completed!"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit .env file with your database credentials"
echo "2. Start PostgreSQL service if not running"
echo "3. Run: node scripts/migrate-to-postgresql.js"
echo "4. Update your application to use PostgreSQLDatabaseService"
echo "5. Test the application thoroughly"
echo
echo -e "${GREEN}Setup script finished successfully!${NC}"
