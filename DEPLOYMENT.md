# GTC Management System - Deployment Guide

**GitHub Repository:** https://github.com/Forhopp-Inc/gtc.git

## 🚀 Deploying to GCP VM

Since your PostgreSQL database is on GCP's private network, the application must be deployed on a GCP VM in the same network to access it.

## 📋 Prerequisites

- GCP VM instance (Ubuntu/Debian) in the same network as your PostgreSQL database
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

### Add User to Docker Group (Run Docker without sudo)

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

Update the `.env` file with your actual credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
DIRECT_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@34.70.114.57:6432/gtc?schema=public&sslmode=require"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://YOUR_VM_EXTERNAL_IP:3000
```

Save and exit: Press `Ctrl+X`, then `Y`, then `Enter`

---

## 🐳 STEP 3: Deploy with Docker Compose

### Option A: Using External Database Only (Recommended)

Edit `docker-compose.yml` to use only external database:

```bash
nano docker-compose.yml
```

**Simplified version:**

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

# This process will take 5-10 minutes:
# 1. Build the Next.js application
# 2. Install all dependencies
# 3. Generate Prisma Client
# 4. Start the application
```

### Run Database Migrations

```bash
# Wait for the build to complete, then create database tables
docker-compose exec app npx prisma migrate deploy
```

### Verify Deployment

```bash
# Check if container is running
docker-compose ps

# View application logs (press Ctrl+C to exit)
docker-compose logs -f app

# Test the application locally on VM
curl http://localhost:3000
```

---

## 🌐 STEP 4: Configure GCP Firewall

### Create Firewall Rule for Port 3000

**Option A: Using gcloud CLI** (from your local machine):

```bash
gcloud compute firewall-rules create allow-gtc-app \
    --allow tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --target-tags gtc-app \
    --description "Allow access to GTC Management System"
```

**Option B: Using GCP Console:**

1. Go to **VPC Network → Firewall** in GCP Console
2. Click **Create Firewall Rule**
3. Configure:
   - **Name**: `allow-gtc-app`
   - **Direction**: Ingress
   - **Action**: Allow
   - **Targets**: All instances (or specific with tags)
   - **Source IP ranges**: `0.0.0.0/0` (or your specific IP for security)
   - **Protocols/Ports**: Check `tcp` and enter `3000`
4. Click **Create**

---

## ✅ STEP 5: Access Your Application

Open browser and navigate to:

```
http://YOUR_VM_EXTERNAL_IP:3000
```

You should see the **GTC Management System** homepage! 🎉

---

## 🛠️ Useful Docker Commands

### Managing the Application

```bash
# View running containers
docker-compose ps

# View logs (real-time)
docker-compose logs -f app

# View last 100 log lines
docker-compose logs --tail=100 app

# Restart the application
docker-compose restart app

# Stop the application
docker-compose down

# Start the application
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations

```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Open Prisma Studio (database GUI)
docker-compose exec app npx prisma studio

# Check database connection
docker-compose exec app npx prisma db pull

# Generate Prisma Client
docker-compose exec app npx prisma generate
```

---

## 🔄 Updating the Application

When code changes are pushed to GitHub:

```bash
# SSH into VM
ssh username@YOUR_VM_IP

# Navigate to project
cd ~/gtc

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run any new migrations
docker-compose exec app npx prisma migrate deploy
```

---

## 📞 Troubleshooting

### Database Connection Issues

**Error: Can't reach database server**

1. Verify VM is in the same VPC as the database
2. Check database allows connections from VM's internal IP
3. Verify credentials in `.env` are correct
4. Test from inside container:
   ```bash
   docker-compose exec app npx prisma db pull
   ```

### Application Not Starting

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check container logs for errors
docker-compose logs app

# Rebuild from scratch
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 PID_NUMBER

# Or change port in docker-compose.yml to 8080:3000
```

---

## 🔐 Security Best Practices

### 1. Restrict Firewall Access

Instead of `0.0.0.0/0`, use specific IP ranges:

```bash
gcloud compute firewall-rules update allow-gtc-app \
    --source-ranges YOUR_OFFICE_IP/32
```

### 2. Use Strong Database Credentials

Ensure your PostgreSQL password is strong and not easily guessable.

### 3. Set Up HTTPS (Optional but Recommended)

Install nginx as reverse proxy:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configure nginx for GTC app
sudo nano /etc/nginx/sites-available/gtc
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/gtc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📈 Monitoring

### Check Application Health

```bash
# Check if app is responding
curl http://localhost:3000/api/dashboard/stats

# Monitor resource usage
docker stats

# Check disk space
df -h
```

### Set Up Log Rotation

Create log rotation config:

```bash
sudo nano /etc/logrotate.d/docker-compose
```

Add:

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
```

---

## 🎯 Quick Start Summary

**Complete deployment in 5 commands:**

```bash
# 1. SSH into VM
ssh user@VM_IP

# 2. Clone repository
git clone https://github.com/Forhopp-Inc/gtc.git && cd gtc

# 3. Configure environment
cp .env.example .env && nano .env

# 4. Deploy with Docker
docker-compose up -d --build

# 5. Run migrations
docker-compose exec app npx prisma migrate deploy
```

**Access at:** `http://YOUR_VM_IP:3000`

---

**Your GTC Management System is ready for production! 🎉**### 3. Using Docker Compose (Recommended)
