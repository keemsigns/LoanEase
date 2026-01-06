#!/bin/bash

#####################################################################
# LoanEase - Quick Deploy Script for Ubuntu Server
# 
# This is a simplified deployment script that:
# 1. Installs all dependencies
# 2. Sets up MongoDB, Node.js, Python
# 3. Configures and starts the application
#
# Usage: 
#   wget -O deploy.sh https://your-url/deploy.sh
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#####################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  LoanEase Quick Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

APP_DIR="/var/www/loanease"

echo -e "\n${YELLOW}[1/8] Updating system...${NC}"
apt update && apt upgrade -y

echo -e "\n${YELLOW}[2/8] Installing dependencies...${NC}"
apt install -y curl wget git nginx python3 python3-pip python3-venv gnupg ufw supervisor

echo -e "\n${YELLOW}[3/8] Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn serve

echo -e "\n${YELLOW}[4/8] Installing MongoDB...${NC}"
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

echo -e "\n${YELLOW}[5/8] Creating application...${NC}"
mkdir -p $APP_DIR/{backend,frontend}

# Backend setup
cd $APP_DIR/backend
python3 -m venv venv

cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
motor==3.3.2
python-dotenv==1.0.0
pydantic[email]==2.5.2
python-multipart==0.0.6
aiofiles==23.2.1
EOF

cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="loanease_db"
CORS_ORIGINS="*"
EOF

source venv/bin/activate && pip install -r requirements.txt && deactivate

mkdir -p uploads

echo -e "\n${YELLOW}[6/8] Configuring services...${NC}"

# Supervisor
mkdir -p /var/log/loanease
cat > /etc/supervisor/conf.d/loanease.conf << 'EOF'
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

# Nginx
cat > /etc/nginx/sites-available/loanease << 'EOF'
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

ln -sf /etc/nginx/sites-available/loanease /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo -e "\n${YELLOW}[7/8] Setting permissions...${NC}"
chown -R www-data:www-data $APP_DIR /var/log/loanease

echo -e "\n${YELLOW}[8/8] Starting services...${NC}"
ufw allow 22,80,443/tcp && ufw --force enable
nginx -t && systemctl restart nginx
supervisorctl reread && supervisorctl update

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nNext steps:"
echo -e "1. Copy server.py to: $APP_DIR/backend/"
echo -e "2. Copy frontend build to: $APP_DIR/frontend/"
echo -e "3. Run: sudo supervisorctl restart all"
echo -e "\nAccess: http://YOUR_SERVER_IP"
echo -e "Admin: http://YOUR_SERVER_IP/admin (password: admin123)"
