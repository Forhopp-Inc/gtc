# Quick Docker Installation for Debian 12 (Bookworm)

## ⚡ EASIEST METHOD - Use Docker's Official Installation Script

Run these commands on your VM:

```bash
# 1. Download Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# 2. Run the script (this will install Docker automatically)
sudo sh get-docker.sh

# 3. Verify Docker is installed
sudo docker --version

# 4. Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# 5. Apply group changes (IMPORTANT)
newgrp docker

# 6. Test Docker (should work without sudo now)
docker ps

# 7. Install Docker Compose (standalone)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 8. Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# 9. Verify Docker Compose
docker-compose --version

# 10. Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

---

## ✅ After Docker is Installed - Deploy GTC

```bash
# Navigate to project directory
cd ~/gtc

# Configure environment (update with your database credentials)
cp .env.example .env
nano .env

# Deploy with Docker Compose (Production)
docker-compose -f docker-compose.prod.yml up -d --build

# Initialize Database (if needed)
# See DEPLOYMENT.md for details on running database/schema.sql

# Check if running
docker-compose ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## 🌐 Access Application

Open browser: `http://YOUR_VM_IP:3000`

---

## 🔍 Quick Verification Commands

```bash
# Check Docker is running
docker --version
docker ps

# Check Docker Compose is installed
docker-compose --version

# Check if you're in docker group
groups | grep docker
```

---

## 📝 Note

The convenience script (`get.docker.com`) is the **official and easiest way** to install Docker on any Linux distribution. It automatically detects your OS and installs the correct packages.
