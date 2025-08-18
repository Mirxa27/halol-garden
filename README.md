# 🏥 Medical Devices Marketplace Platform

[![CI/CD Pipeline](https://github.com/your-org/medical-platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/medical-platform/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

A comprehensive B2B/B2C medical devices marketplace platform designed for the Arabic-speaking healthcare market, connecting equipment suppliers, healthcare providers, and maintenance engineers.

## 🌟 Features

### Core Functionality
- **Multi-User Platform**: Support for Healthcare Providers, Equipment Suppliers, Maintenance Engineers, and Individual Customers
- **Product Marketplace**: Browse, search, and purchase medical equipment
- **Rental System**: Equipment rental agreements and management
- **Maintenance Services**: Request and track equipment maintenance
- **Real-time Chat**: Integrated messaging system for users
- **Multi-language**: Full Arabic and English support
- **Payment Integration**: PayPal and MyFatoorah payment gateways
- **Advanced Search**: Filter by category, price, specifications
- **Review System**: Product reviews and ratings
- **Order Management**: Complete order lifecycle tracking
- **Admin Dashboard**: Comprehensive admin controls

### Security Features
- **JWT Authentication**: Secure token-based auth
- **Two-Factor Authentication**: Optional 2FA for enhanced security
- **Rate Limiting**: Protection against abuse
- **Input Validation**: XSS and injection prevention
- **HTTPS Enforcement**: SSL/TLS encryption
- **CORS Protection**: Configured CORS policies
- **Security Headers**: Helmet.js integration

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes + Express middleware
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis (ioredis)
- **Authentication**: NextAuth.js
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **File Upload**: Multer + Sharp

### DevOps & Tools
- **Container**: Docker multi-stage builds
- **CI/CD**: GitHub Actions
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier
- **Monitoring**: Vercel Analytics
- **Deployment**: Vercel / Docker

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- PostgreSQL 14+ database
- Redis server (optional for caching)
- Git

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-org/medical-platform.git
cd medical-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Set up the database
```bash
# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npm run db:seed
```

### 5. Start development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Project Structure

```
medical-platform/
├── .github/            # GitHub Actions workflows
├── client/             # Client-side code
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   └── __tests__/      # Test files
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   └── index.tsx       # Home page
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── server/             # Server-side code
│   ├── config/         # Server configuration
│   ├── middleware/     # Express middleware
│   ├── routes/         # API route handlers
│   └── services/       # Business logic
├── shared/             # Shared types and utilities
├── styles/             # Global styles
└── scripts/            # Utility scripts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- auth.test.ts
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run db:push` | Push database schema changes |
| `npm run db:studio` | Open Prisma Studio |
| `npm run analyze` | Analyze bundle size |

## 🐳 Docker Deployment

### Build and run with Docker
```bash
# Build the image
docker build -t medical-platform .

# Run the container
docker run -p 3000:3000 --env-file .env medical-platform
```

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

## 🚢 Production Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD on push to main branch

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Database Schema

The platform uses PostgreSQL with the following main entities:
- **Users**: Multi-role user management
- **Products**: Medical equipment catalog
- **Orders**: Purchase orders and tracking
- **Rentals**: Equipment rental agreements
- **Maintenance**: Service requests and tracking
- **Reviews**: Product feedback system
- **Chat**: Real-time messaging

## 🔐 Security Considerations

- All sensitive data is encrypted at rest
- API endpoints are protected with authentication
- Rate limiting prevents abuse
- Input validation on all user inputs
- Regular security audits and dependency updates
- GDPR and HIPAA compliance considerations

## 📈 Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Redis caching for frequently accessed data
- Database query optimization with Prisma
- CDN integration for static assets
- Compression middleware for responses

## 🌍 Internationalization

The platform supports:
- Arabic (RTL support)
- English
- Dynamic language switching
- Localized content and formatting

## 📝 API Documentation

API documentation is available at `/api/docs` when running in development mode.

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/reset-password` - Password reset

### Main API Routes
- `/api/products` - Product management
- `/api/orders` - Order processing
- `/api/rentals` - Rental agreements
- `/api/maintenance` - Maintenance requests
- `/api/users` - User management
- `/api/chat` - Real-time messaging

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, email support@medical-devices.com or open an issue in the repository.

## 👥 Team

- **Project Lead**: [Name]
- **Tech Lead**: [Name]
- **UI/UX Designer**: [Name]
- **Backend Developer**: [Name]
- **Frontend Developer**: [Name]

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- All open-source contributors

---

**Last Updated**: December 2024
**Version**: 1.0.0