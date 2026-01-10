# GTC Management System - Deployment Guide

## 🚀 Deploying to GCP VM

Since your PostgreSQL database is on GCP's private network, the application must be deployed on a GCP VM in the same network to access it.

## 📋 Prerequisites

- GCP VM instance in the same network as your PostgreSQL database
- SSH access to the VM
- Database credentials for PostgreSQL at `34.70.114.57:6432`

---

## 🖥️ STEP 1: Prepare the VM (Fresh Ubuntu/Debian VM)

### Connect to Your VM via SSH

```bash
ssh username@YOUR_VM_IP
```

### Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker

```bash
# Remove old versions if any
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install required packages
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify Docker installation
sudo docker --version
```

### Install Docker Compose (Standalone)

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Add User to Docker Group (Optional - to run without sudo)

```bash
sudo usermod -aG docker $USER
newgrp docker

# Test Docker without sudo
docker ps
```

### Install Git

```bash
sudo apt-get install -y git
git --version
```

---

## 📦 STEP 2: Clone and Setup Project

### Clone the Repository

```bash
cd ~
git clone https://github.com/Forhopp-Inc/gtc.git
cd gtc
```

### Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit with your database credentials
nano .env
```

Update the `.env` file:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
DIRECT_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://YOUR_VM_IP:3000
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## 🐳 STEP 3: Deploy with Docker Compose

### Update Docker Compose for Production (Optional)

If you need to modify the docker-compose.yml to remove the bundled PostgreSQL:

```bash
nano docker-compose.yml
```

**Simplified version (using external database only):**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

### Build and Start the Application

```bash
# Build and start in detached mode
docker-compose up -d --build

# This will:
# 1. Build the Next.js application
# 2. Install all dependencies
# 3. Generate Prisma Client
# 4. Start the application
```

### Run Database Migrations

```bash
# Create all database tables
docker-compose exec app npx prisma migrate deploy

# Or if you want to create a named migration
docker-compose exec app npx prisma migrate dev --name init
```

### Verify Deployment

```bash
# Check if containers are running
docker-compose ps

# View application logs
docker-compose logs -f app

# Test the application
curl http://localhost:3000
```

---

## 🌐 STEP 4: Configure Firewall (Allow External Access)

### GCP Firewall Rule

Create a firewall rule to allow traffic on port 3000:

```bash
# From your local machine (not on VM)
gcloud compute firewall-rules create allow-gtc-app \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow access to GTC Management System"
```

### Or Configure in GCP Console:
1. Go to VPC Network → Firewall
2. Create Firewall Rule:
   - Name: `allow-gtc-app`
   - Direction: Ingress
   - Targets: All instances
   - Source IP ranges: `0.0.0.0/0` (or your specific IP)
   - Protocols/Ports: `tcp:3000`

---

## ✅ STEP 5: Access Your Application

Open browser and navigate to:
```
http://YOUR_VM_EXTERNAL_IP:3000
```

You should see the GTC Management System homepage!

---
# GTC Management System - Deployment Guide

## 🚀 Deploying to GCP VM

Since your PostgreSQL database is on GCP's private network, the application must be deployed on a GCP VM in the same network to access it.

## 📋 Prerequisites

- GCP VM instance in the same network as your PostgreSQL database
- SSH access to the VM
- Database credentials for PostgreSQL at `34.70.114.57:6432`

---

## 🖥️ STEP 1: Prepare the VM (Fresh Ubuntu/Debian VM)

### Connect to Your VM via SSH

```bash
ssh username@YOUR_VM_IP
```

### Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker

```bash
# Remove old versions if any
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install required packages
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify Docker installation
sudo docker --version
```

### Install Docker Compose (Standalone)

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Add User to Docker Group (Optional - to run without sudo)

```bash
sudo usermod -aG docker $USER
newgrp docker

# Test Docker without sudo
docker ps
```

### Install Git

```bash
sudo apt-get install -y git
git --version
```

---

## 📦 STEP 2: Clone and Setup Project

### Clone the Repository

```bash
cd ~
git clone https://github.com/Forhopp-Inc/gtc.git
cd gtc
```

### Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit with your database credentials
nano .env
```

Update the `.env` file:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
DIRECT_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://YOUR_VM_IP:3000
```

Save and exit (Ctrl+X, then Y, then Enter)

---

## 🐳 STEP 3: Deploy with Docker Compose

### Update Docker Compose for Production (Optional)

If you need to modify the docker-compose.yml to remove the bundled PostgreSQL:

```bash
nano docker-compose.yml
```

**Simplified version (using external database only):**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

### Build and Start the Application

```bash
# Build and start in detached mode
docker-compose up -d --build

# This will:
# 1. Build the Next.js application
# 2. Install all dependencies
# 3. Generate Prisma Client
# 4. Start the application
```

### Run Database Migrations

```bash
# Create all database tables
docker-compose exec app npx prisma migrate deploy

# Or if you want to create a named migration
docker-compose exec app npx prisma migrate dev --name init
```

### Verify Deployment

```bash
# Check if containers are running
docker-compose ps

# View application logs
docker-compose logs -f app

# Test the application
curl http://localhost:3000
```

---

## 🌐 STEP 4: Configure Firewall (Allow External Access)

### GCP Firewall Rule

Create a firewall rule to allow traffic on port 3000:

```bash
# From your local machine (not on VM)
gcloud compute firewall-rules create allow-gtc-app \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow access to GTC Management System"
```

### Or Configure in GCP Console:
1. Go to VPC Network → Firewall
2. Create Firewall Rule:
   - Name: `allow-gtc-app`
   - Direction: Ingress
   - Targets: All instances
   - Source IP ranges: `0.0.0.0/0` (or your specific IP)
   - Protocols/Ports: `tcp:3000`

---

## ✅ STEP 5: Access Your Application

Open browser and navigate to:
```
http://YOUR_VM_EXTERNAL_IP:3000
```

You should see the GTC Management System homepage!

---

### 2. Configure Environment Variables

On the VM, edit the `.env` file:

```bash
nano .env
```

Update with your actual database credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
DIRECT_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
NODE_ENV=production
```

### 3. Using Docker Compose (Recommended)

**Build and start the application:**

```bash
docker-compose up -d
```

**Run database migrations:**

```bash
docker-compose exec app npx prisma migrate deploy
```

**View logs:**

```bash
docker-compose logs -f app
```

**Access the application:**
Open browser to `http://YOUR_VM_IP:3000`

### 4. Alternative: Direct Node.js Deployment

If not using Docker:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Build for production
npm run build

# Start the application
npm start
```

The application will be available at `http://localhost:3000`

## 🔒 Production Configuration

### For Production Environment

Update `.env` for production:

```env
DATABASE_URL="postgresql://username:password@34.70.114.57:6432/gtc?schema=public&sslmode=require"
DIRECT_URL="postgresql://username:password@34.70.114.57:6432/gtc?schema=public&sslmode=require"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://your-vm-ip:3000
```

### Security Recommendations

1. **Use Strong Passwords** - Update default credentials in `docker-compose.yml`
2. **Firewall Rules** - Only allow traffic from your IP to port 3000
3. **HTTPS** - Consider setting up nginx with SSL certificate
4. **Regular Backups** - Set up automated database backups
5. **Environment Variables** - Keep `.env` secure and never commit to git

## 📊 After Deployment

Once deployed on the VM:

1. ✅ Database tables will be created automatically
2. ✅ Application will be accessible at `http://VM_IP:3000`
3. ✅ All features will be functional:
   - Companies management
   - Products catalog
   - Customer accounts with debt tracking
   - Order processing with dynamic pricing
   - Expense tracking
   - Comprehensive reports

## 🐳 Docker Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Access Prisma Studio (database GUI)
docker-compose exec app npx prisma studio
```

## 🔄 Updating the Application

When making changes:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run any new migrations
docker-compose exec app npx prisma migrate deploy
```

## 📞 Troubleshooting

### Database Connection Issues

If you still can't connect:
1. Verify VM is in the same VPC as the database
2. Check GCP firewall rules allow traffic from VM to database
3. Verify database is accepting connections from VM's internal IP
4. Test connection: `docker-compose exec app npx prisma db pull`

### Application Issues

```bash
# Check if app is running
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 app

# Restart the app
docker-compose restart app
```

---

**Ready for deployment on your GCP VM! 🚀**