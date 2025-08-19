# 🗄️ Medical Devices Marketplace - Database Setup Guide

## Overview
This guide provides complete instructions for setting up the PostgreSQL database for the Medical Devices Marketplace platform.

---

## 📋 Prerequisites

- **PostgreSQL 14+** installed
- **Node.js 18+** installed
- **Docker** (optional, for containerized setup)
- **Git** installed

---

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

```bash
# 1. Start all database services
npm run db:docker:up

# 2. Wait for services to be healthy (about 30 seconds)
docker-compose -f docker-compose.db.yml ps

# 3. Run migrations
npx prisma migrate dev

# 4. Seed the database
npm run db:seed

# 5. Open Prisma Studio to view data
npm run db:studio
```

**Services Started:**
- PostgreSQL (port 5432)
- Redis (port 6379)
- Elasticsearch (port 9200)
- pgAdmin (port 5050)
- MinIO S3 (ports 9000/9001)

### Option 2: Local PostgreSQL Setup

```bash
# 1. Run the setup script
npm run db:setup

# 2. Follow the prompts
# The script will:
# - Create database and user
# - Run migrations
# - Optionally seed data
# - Create initial backup

# 3. Verify setup
npm run db:studio
```

### Option 3: Manual Setup

```bash
# 1. Create PostgreSQL database
sudo -u postgres psql
CREATE USER medical_admin WITH PASSWORD 'SecurePass123!';
CREATE DATABASE medical_devices_db OWNER medical_admin;
GRANT ALL PRIVILEGES ON DATABASE medical_devices_db TO medical_admin;
\q

# 2. Set environment variables
cp .env.example .env
# Edit .env and set:
# DATABASE_URL=postgresql://medical_admin:SecurePass123!@localhost:5432/medical_devices_db

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Seed database
npm run db:seed
```

---

## 📊 Database Schema

### Core Models

#### User Management
- **User** - Central user model with multi-role support
- **HealthcareProvider** - Hospital/clinic profiles
- **EquipmentSupplier** - Supplier company profiles
- **MaintenanceEngineer** - Service engineer profiles
- **CustomerServiceProfile** - Support staff profiles
- **AdminProfile** - Administrator profiles
- **IndividualCustomer** - Individual buyer profiles

#### Product Management
- **Product** - Medical equipment catalog
- **ProductCategory** - Category taxonomy
- **ProductReview** - Customer reviews
- **ProductQuestion** - Q&A system
- **ProductAnswer** - Answer to questions

#### Order Management
- **Order** - Purchase orders
- **OrderItem** - Order line items
- **Payment** - Payment records
- **Refund** - Refund tracking
- **Shipment** - Shipping information
- **Invoice** - Invoice generation

#### Additional Features
- **Cart** - Shopping cart
- **CartItem** - Cart contents
- **WishlistItem** - Saved products
- **RentalAgreement** - Equipment rentals
- **MaintenanceRequest** - Service requests
- **ChatSession** - Real-time messaging
- **Notification** - User notifications
- **SupportTicket** - Customer support

---

## 🔧 Database Management

### Common Commands

```bash
# View database in GUI
npm run db:studio

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Create backup
npm run db:backup

# Run migrations
npx prisma migrate dev

# Deploy migrations (production)
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Push schema changes (development)
npx prisma db push
```

### Docker Commands

```bash
# Start services
npm run db:docker:up

# Stop services
npm run db:docker:down

# Reset everything (including volumes)
npm run db:docker:reset

# View logs
docker-compose -f docker-compose.db.yml logs -f

# Access PostgreSQL shell
docker exec -it medical_devices_postgres psql -U medical_admin -d medical_devices_db

# Access Redis CLI
docker exec -it medical_devices_redis redis-cli -a RedisPass123!
```

---

## 🌱 Seed Data

The seed script creates comprehensive test data:

### Users Created
| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@medicaldevices.com | Demo123!@# | Admin | Super administrator |
| hospital@demo.com | Demo123!@# | Healthcare Provider | King Faisal Hospital |
| supplier@medtech.com | Demo123!@# | Equipment Supplier | MedTech Solutions |
| engineer@service.com | Demo123!@# | Maintenance Engineer | Ahmed Hassan |
| customer@demo.com | Demo123!@# | Individual Customer | John Doe |
| support@medicaldevices.com | Demo123!@# | Customer Service | Sarah Johnson |

### Sample Products
- Advanced MRI Scanner ProMax 3000
- Revolution CT Scanner 256-Slice
- EPIQ Elite Ultrasound System
- IntelliVue MX750 Patient Monitor
- da Vinci Xi Surgical System
- HAMILTON-G5 Ventilator

### Sample Data Includes
- Orders with different statuses
- Product reviews and ratings
- Questions and answers
- System settings
- Email templates

---

## 🔒 Security

### Default Credentials

**PostgreSQL:**
- User: `medical_admin`
- Password: `SecurePass123!`
- Database: `medical_devices_db`

**pgAdmin:**
- Email: `admin@medicaldevices.com`
- Password: `AdminPass123!`

**Redis:**
- Password: `RedisPass123!`

**MinIO:**
- Access Key: `minioadmin`
- Secret Key: `MinioPass123!`

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use environment variables for credentials
- [ ] Enable SSL/TLS for database connections
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Use connection pooling
- [ ] Set up monitoring alerts

---

## 📦 Backup & Restore

### Automated Backup

```bash
# Create backup
npm run db:backup

# Backups are stored in ./backups/
```

### Manual Backup

```bash
# Backup database
pg_dump -h localhost -U medical_admin -d medical_devices_db > backup.sql

# Backup with compression
pg_dump -h localhost -U medical_admin -d medical_devices_db -Fc > backup.dump
```

### Restore

```bash
# Restore from SQL
psql -h localhost -U medical_admin -d medical_devices_db < backup.sql

# Restore from compressed dump
pg_restore -h localhost -U medical_admin -d medical_devices_db backup.dump
```

---

## 🔍 Database Access

### Prisma Studio (GUI)
```bash
npm run db:studio
# Opens at http://localhost:5555
```

### pgAdmin (Docker)
```
URL: http://localhost:5050
Email: admin@medicaldevices.com
Password: AdminPass123!
```

### PostgreSQL CLI
```bash
# Local
psql -h localhost -p 5432 -U medical_admin -d medical_devices_db

# Docker
docker exec -it medical_devices_postgres psql -U medical_admin -d medical_devices_db
```

### Connection String
```
postgresql://medical_admin:SecurePass123!@localhost:5432/medical_devices_db?schema=public
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Cannot connect to database
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if database exists
psql -U postgres -l

# Check connection
psql -h localhost -p 5432 -U medical_admin -d medical_devices_db -c "SELECT 1"
```

#### 2. Migration errors
```bash
# Reset migrations
npx prisma migrate reset

# Force push schema (development only)
npx prisma db push --force-reset
```

#### 3. Docker issues
```bash
# Clean up everything
docker-compose -f docker-compose.db.yml down -v
docker system prune -a

# Restart
npm run db:docker:up
```

#### 4. Permission denied
```bash
# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE medical_devices_db TO medical_admin;
ALTER USER medical_admin CREATEDB;
```

---

## 📈 Performance Optimization

### Indexes
The schema includes optimized indexes for:
- User lookups by email
- Product searches by category, SKU
- Order queries by status, user
- Full-text search on products

### Views
Materialized views for:
- Product search optimization
- Analytics dashboards
- Reporting

### Best Practices
1. Use connection pooling in production
2. Enable query logging for debugging
3. Regular VACUUM and ANALYZE
4. Monitor slow queries
5. Use read replicas for scaling

---

## 🔗 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/tutorial.html)

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review logs: `docker-compose logs -f postgres`
3. Check Prisma logs: `DEBUG=* npx prisma migrate dev`
4. Open an issue in the repository

---

**Database Version**: PostgreSQL 15
**Schema Version**: 3.0.0
**Last Updated**: December 2024