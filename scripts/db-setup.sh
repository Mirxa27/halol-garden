#!/bin/bash

# Medical Devices Marketplace - Database Setup Script
# This script sets up the PostgreSQL database for development and production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-medical_devices_db}
DB_USER=${DB_USER:-medical_admin}
DB_PASSWORD=${DB_PASSWORD:-SecurePass123!}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
ENVIRONMENT=${NODE_ENV:-development}

echo -e "${GREEN}Medical Devices Marketplace - Database Setup${NC}"
echo "================================================"

# Function to check if PostgreSQL is installed
check_postgres() {
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
}

# Function to check if database exists
database_exists() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME
}

# Function to create database
create_database() {
    echo -e "${YELLOW}Creating database: $DB_NAME${NC}"
    
    # Create user if not exists
    sudo -u postgres psql <<EOF
DO
\$do\$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = '$DB_USER') THEN

      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$do\$;
EOF
    
    # Create database
    sudo -u postgres createdb -O $DB_USER $DB_NAME 2>/dev/null || true
    
    # Grant all privileges
    sudo -u postgres psql <<EOF
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF
    
    echo -e "${GREEN}✓ Database created successfully${NC}"
}

# Function to setup environment file
setup_env() {
    echo -e "${YELLOW}Setting up environment file${NC}"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        
        # Update DATABASE_URL in .env
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public|" .env
        
        echo -e "${GREEN}✓ Environment file created${NC}"
    else
        echo -e "${YELLOW}! Environment file already exists${NC}"
    fi
}

# Function to run migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations${NC}"
    
    # Generate Prisma client
    npx prisma generate
    
    # Push schema to database (for development)
    if [ "$ENVIRONMENT" = "development" ]; then
        npx prisma db push --skip-generate
    else
        # Run migrations for production
        npx prisma migrate deploy
    fi
    
    echo -e "${GREEN}✓ Migrations completed${NC}"
}

# Function to seed database
seed_database() {
    echo -e "${YELLOW}Seeding database with sample data${NC}"
    
    npx prisma db seed
    
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
}

# Function to create backup
create_backup() {
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
    
    echo -e "${YELLOW}Creating database backup${NC}"
    
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE
    
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
}

# Main setup flow
main() {
    echo "Environment: $ENVIRONMENT"
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST:$DB_PORT"
    echo ""
    
    # Check prerequisites
    check_postgres
    
    # Setup database
    if database_exists; then
        echo -e "${YELLOW}Database already exists${NC}"
        read -p "Do you want to reset the database? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Dropping existing database${NC}"
            sudo -u postgres dropdb $DB_NAME
            create_database
        fi
    else
        create_database
    fi
    
    # Setup environment
    setup_env
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies${NC}"
        npm install
    fi
    
    # Run migrations
    run_migrations
    
    # Seed database (only in development)
    if [ "$ENVIRONMENT" = "development" ]; then
        read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            seed_database
        fi
    fi
    
    # Create initial backup
    create_backup
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}Database setup completed successfully!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Connection string:"
    echo "postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    echo "You can now run the application with:"
    echo "  npm run dev"
    echo ""
    echo "To access the database directly:"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    echo ""
    echo "To view the database in Prisma Studio:"
    echo "  npx prisma studio"
}

# Handle command line arguments
case "$1" in
    --reset)
        echo -e "${YELLOW}Resetting database${NC}"
        sudo -u postgres dropdb $DB_NAME 2>/dev/null || true
        create_database
        run_migrations
        seed_database
        ;;
    --migrate)
        run_migrations
        ;;
    --seed)
        seed_database
        ;;
    --backup)
        create_backup
        ;;
    *)
        main
        ;;
esac