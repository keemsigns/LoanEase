#!/bin/bash

#####################################################################
# LoanEase - COMPLETE Ubuntu Server Deployment Script
# 
# This script contains ALL source files and will:
# 1. Install all system dependencies (Node.js, Python, MongoDB, Nginx)
# 2. Extract and set up complete backend (FastAPI + all endpoints)
# 3. Extract and set up complete frontend (React + all components)
# 4. Build the frontend
# 5. Configure Nginx, Supervisor, Firewall
# 6. Start all services
#
# Tested on: Ubuntu 20.04 LTS, Ubuntu 22.04 LTS
#
# Usage: 
#   chmod +x install.sh
#   sudo ./install.sh
#
# After completion:
#   Website: http://YOUR_SERVER_IP
#   Admin: http://YOUR_SERVER_IP/admin (password: admin123)
#####################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/loanease"
BACKEND_PORT=8001
FRONTEND_PORT=3000

print_step() { echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"; }
print_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_ok() { echo -e "${GREEN}[✓]${NC} $1"; }

# Check root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo ./install.sh"
    exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         LoanEase Complete Installation Script             ║${NC}"
echo -e "${GREEN}║         All source files included                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

#####################################################################
print_step "Step 1/10: Updating system packages..."
#####################################################################
apt update && apt upgrade -y
print_ok "System updated"

#####################################################################
print_step "Step 2/10: Installing system dependencies..."
#####################################################################
apt install -y curl wget git nginx python3 python3-pip python3-venv gnupg software-properties-common ufw supervisor
print_ok "Dependencies installed"

#####################################################################
print_step "Step 3/10: Installing Node.js 18..."
#####################################################################
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
npm install -g yarn serve
print_ok "Node.js $(node -v) installed"

#####################################################################
print_step "Step 4/10: Installing MongoDB 6..."
#####################################################################
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
    
    # Detect Ubuntu version
    UBUNTU_CODENAME=$(lsb_release -cs)
    if [[ "$UBUNTU_CODENAME" == "noble" ]]; then
        UBUNTU_CODENAME="jammy"  # Use jammy for Ubuntu 24.04
    fi
    
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt update
    apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod
print_ok "MongoDB installed and running"

#####################################################################
print_step "Step 5/10: Creating application directory..."
#####################################################################
rm -rf $APP_DIR
mkdir -p $APP_DIR/{backend,frontend}
mkdir -p /var/log/loanease
print_ok "Directory structure created"

#####################################################################
print_step "Step 6/10: Extracting source files..."
#####################################################################

# The source archive is embedded below as base64
# Decode and extract it
cd $APP_DIR

# Create the base64 encoded source
cat << 'ARCHIVE_END' | base64 -d | tar -xzf -
