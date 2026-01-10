# GTC Management System

**Ghous Trading Company - Inventory & Accounting Management System**

A comprehensive management system for pesticides and fertilizers trading, built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- **Companies Management**: Manage pesticide and fertilizer manufacturers with officer allocation
- **Products Management**: Browse and manage product inventory with dynamic pricing
- **Customers Management**: Track customer accounts and debt (udhar) management
- **Orders Management**: Create and track sales orders with flexible pricing
- **Transactions Tracking**: Handle advance payments, PR receipts, and company transactions (khata/bookkeeping)
- **Expenses Tracking**: Monitor business expenses with categorization
- **Reports & Analytics**: Generate detailed reports by customers, companies, and products

## 🛠️ Technology Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Deployment**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL database (can use Docker Compose)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GTC
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and update the database connection:

```env
DATABASE_URL="postgresql://username:password@your-db-ip:5432/GTC?schema=public"
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Database Migrations

```bash
npm run prisma:migrate
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start all services:

```bash
docker-compose up -d
```

2. Run database migrations:

```bash
docker-compose exec app npx prisma migrate deploy
```

3. Access the application at `http://localhost:3000`

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f app
```

## 📁 Project Structure

```
GTC/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API Routes
│   │   └── companies/        # Company API endpoints
│   ├── companies/            # Companies page
│   ├── customers/            # Customers page
│   ├── expenses/             # Expenses page
│   ├── orders/               # Orders page
│   ├── products/             # Products page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # Reusable components
│   └── Navigation.tsx        # Navigation bar
├── lib/                      # Utilities
│   └── prisma.ts             # Prisma client instance
├── prisma/                   # Prisma configuration
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker configuration
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🗄️ Database Schema

The system includes the following models:

- **Company**: Pesticide/fertilizer manufacturers
- **Officer**: Company officers allotted to GTC
- **Product**: Products from various companies
- **Customer**: GTC customers
- **Order**: Sales orders with items
- **OrderItem**: Individual products in orders
- **Transaction**: Company transactions (advances, payments, PR receipts)
- **Payment**: Customer payments
- **Expense**: Business expenses

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 📊 Key Features Details

### Dynamic Pricing
The system asks for both buying and selling prices for each product order, allowing flexible pricing based on market conditions.

### Debt Management (Udhar)
Customers can purchase products on credit. The system tracks:
- Total order amount
- Paid amount
- Remaining balance (customer debt)

### Transaction Tracking (Khata)
For companies, the system tracks:
- Advance payments sent
- PR (Payment Receipt) details
- Payment history
- Outstanding balances

### Reports & Analytics
Generate comprehensive reports filtered by:
- Customers
- Companies
- Products
- Date ranges
- Payment status

## 🔐 Security Notes

- Always use strong passwords for production databases
- Update the default credentials in `docker-compose.yml`
- Keep `.env` file secure and never commit it to version control
- Use environment-specific configurations for different deployments

## 📝 Development Roadmap

- [ ] Complete CRUD operations for all entities
- [ ] Implement advanced reporting and analytics
- [ ] Add user authentication and authorization
- [ ] Create PDF export functionality for reports
- [ ] Implement real-time notifications
- [ ] Add data backup and restore features
- [ ] Mobile responsive design improvements
- [ ] Multi-language support (Urdu/English)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary software for Ghous Trading Company.

## 📞 Support

For support and inquiries, please contact GTC management.

---

Built with ❤️ for Ghous Trading Company