# LoanEase - Ubuntu Server Deployment Guide

This guide explains how to deploy LoanEase on a fresh Ubuntu server.

## Prerequisites

- Ubuntu 20.04 LTS or 22.04 LTS server
- Root or sudo access
- At least 1GB RAM, 10GB disk space
- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## Option 1: Automated Deployment (Recommended)

### Step 1: Download and Run the Script

```bash
# Connect to your server
ssh root@your-server-ip

# Download the deployment script
wget https://raw.githubusercontent.com/your-repo/scripts/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run the script
sudo ./deploy.sh
```

The script will:
1. Update system packages
2. Install Node.js 18, Python 3, MongoDB 6
3. Install Nginx, Supervisor
4. Create application directory structure
5. Configure all services
6. Set up firewall

### Step 2: Copy Your Application Files

After the script completes, copy your source files:

```bash
# Copy backend server.py
scp /app/backend/server.py root@your-server:/var/www/loanease/backend/

# Build and copy frontend
cd /app/frontend
yarn build
scp -r build/* root@your-server:/var/www/loanease/frontend/build/
```

### Step 3: Start Everything

```bash
ssh root@your-server-ip
sudo chown -R www-data:www-data /var/www/loanease
sudo supervisorctl restart all
```

### Step 4: Access Your Application

- Website: `http://your-server-ip`
- Admin: `http://your-server-ip/admin`
- Password: `admin123`

---

## Option 2: Manual Deployment

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Dependencies

```bash
# Install basic packages
sudo apt install -y curl wget git nginx python3 python3-pip python3-venv gnupg ufw supervisor

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Install Yarn and Serve
sudo npm install -g yarn serve
```

### Step 3: Install MongoDB

```bash
# Add MongoDB repository
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 4: Create Application Directory

```bash
sudo mkdir -p /var/www/loanease/{backend,frontend}
cd /var/www/loanease
```

### Step 5: Set Up Backend

```bash
cd /var/www/loanease/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn motor python-dotenv pydantic[email] python-multipart aiofiles

# Create .env file
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="loanease_db"
CORS_ORIGINS="*"
EOF

# Copy your server.py file here
# Create uploads directory
mkdir -p uploads

deactivate
```

### Step 6: Set Up Frontend

```bash
cd /var/www/loanease/frontend

# Copy your frontend build files here
# Or build from source:
# yarn install
# yarn build
```

### Step 7: Configure Supervisor

```bash
sudo mkdir -p /var/log/loanease

sudo cat > /etc/supervisor/conf.d/loanease.conf << 'EOF'
[program:loanease-backend]
command=/var/www/loanease/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
directory=/var/www/loanease/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/loanease/backend.err.log
stdout_logfile=/var/log/loanease/backend.out.log

[program:loanease-frontend]
command=/usr/bin/npx serve -s build -l 3000
directory=/var/www/loanease/frontend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/loanease/frontend.err.log
stdout_logfile=/var/log/loanease/frontend.out.log
EOF

sudo supervisorctl reread
sudo supervisorctl update
```

### Step 8: Configure Nginx

```bash
sudo cat > /etc/nginx/sites-available/loanease << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/loanease /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/loanease
sudo chown -R www-data:www-data /var/log/loanease
```

### Step 10: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 11: Start Services

```bash
sudo supervisorctl restart all
sudo systemctl restart nginx
```

---

## Adding SSL (HTTPS)

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

---

## Management Commands

### View Logs

```bash
# Backend logs
sudo tail -f /var/log/loanease/backend.out.log
sudo tail -f /var/log/loanease/backend.err.log

# Frontend logs
sudo tail -f /var/log/loanease/frontend.out.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Service Management

```bash
# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart loanease-backend
sudo supervisorctl restart loanease-frontend
sudo supervisorctl restart all

# Stop services
sudo supervisorctl stop all

# Restart Nginx
sudo systemctl restart nginx

# Restart MongoDB
sudo systemctl restart mongod
```

### Update Application

```bash
# Stop services
sudo supervisorctl stop all

# Update backend
cd /var/www/loanease/backend
# Copy new server.py

# Update frontend
cd /var/www/loanease/frontend
# Copy new build files

# Restart
sudo supervisorctl start all
```

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
sudo tail -100 /var/log/loanease/backend.err.log

# Test manually
cd /var/www/loanease/backend
source venv/bin/activate
python -c "import server"
```

### MongoDB connection issues

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -50 /var/log/nginx/error.log
```

### Permission issues

```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/loanease
sudo chmod -R 755 /var/www/loanease
```

---

## Backup

### Database Backup

```bash
# Backup MongoDB
mongodump --db loanease_db --out /backup/mongodb/$(date +%Y%m%d)

# Restore
mongorestore --db loanease_db /backup/mongodb/20250105/loanease_db
```

### Application Backup

```bash
# Backup entire application
tar -czvf /backup/loanease-$(date +%Y%m%d).tar.gz /var/www/loanease
```

---

## Security Recommendations

1. **Change admin password** - Edit `server.py` and change `ADMIN_PASSWORD`
2. **Enable HTTPS** - Use Let's Encrypt for free SSL
3. **Restrict MongoDB** - Only allow localhost connections
4. **Regular updates** - Keep system packages updated
5. **Firewall** - Only open necessary ports
6. **Backups** - Set up automated daily backups
