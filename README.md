# LoanEase - Loan Application Platform

A modern, full-stack loan application website built with React, FastAPI, and MongoDB.

## 🌟 Features

- **Loan Calculator** - Interactive calculator with $100-$5,000 range
- **Multi-step Application Form** - User-friendly 3-step application process
- **Admin Dashboard** - Manage applications, update statuses, view banking info
- **Document Upload** - Secure document submission for borrowers
- **In-App Notifications** - Real-time status updates for applicants
- **Secure Banking Info** - Password-protected sensitive data viewing

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Running Locally](#running-locally)
6. [API Documentation](#api-documentation)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | 18.x or higher | [nodejs.org](https://nodejs.org/) |
| Python | 3.9 or higher | [python.org](https://python.org/) |
| MongoDB | 6.0 or higher | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### Verify Installation

```bash
# Check Node.js
node --version  # Should show v18.x.x or higher

# Check Python
python3 --version  # Should show 3.9.x or higher

# Check MongoDB
mongod --version  # Should show v6.x or higher

# Check Git
git --version
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd loan-application
```

### 2. Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up Frontend

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
yarn install
# OR if you don't have yarn:
npm install -g yarn && yarn install
```

### 4. Configure Environment Variables

```bash
# Backend (.env file in /backend directory)
cp backend/.env.example backend/.env

# Frontend (.env file in /frontend directory)
cp frontend/.env.example frontend/.env
```

### 5. Start MongoDB

```bash
# On macOS (with Homebrew)
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 6. Run the Application

```bash
# Terminal 1 - Start Backend
cd backend
source venv/bin/activate  # Activate virtual environment
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Start Frontend
cd frontend
yarn start
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Admin Dashboard**: http://localhost:3000/admin (password: `admin123`)

---

## Project Structure

```
loan-application/
├── backend/                    # FastAPI Backend
│   ├── server.py              # Main application file
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── uploads/               # Uploaded documents storage
│
├── frontend/                   # React Frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   └── ui/           # Shadcn UI components
│   │   ├── pages/            # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── ApplicationForm.jsx
│   │   │   ├── SuccessPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── TrackApplication.jsx
│   │   │   └── AcceptLoan.jsx
│   │   ├── App.js            # Main App component
│   │   ├── App.css           # App styles
│   │   └── index.css         # Global styles
│   ├── package.json          # Node dependencies
│   └── .env                  # Environment variables
│
├── memory/                    # Project documentation
│   └── PRD.md                # Product Requirements Document
│
└── README.md                  # This file
```

---

## Environment Variables

### Backend (`/backend/.env`)

```env
# MongoDB Connection
MONGO_URL="mongodb://localhost:27017"
DB_NAME="loanease_db"

# CORS Settings
CORS_ORIGINS="*"

# Admin Password
ADMIN_PASSWORD="admin123"
```

### Frontend (`/frontend/.env`)

```env
# Backend API URL
REACT_APP_BACKEND_URL="http://localhost:8001"
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `loanease_db` |
| `CORS_ORIGINS` | Allowed origins for CORS | `*` or `http://localhost:3000` |
| `ADMIN_PASSWORD` | Password for admin dashboard | `admin123` |
| `REACT_APP_BACKEND_URL` | Backend API URL for frontend | `http://localhost:8001` |

---

## Running Locally

### Development Mode (with hot reload)

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd frontend
yarn start
```

### Production Mode

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

**Frontend:**
```bash
cd frontend
yarn build
# Serve the build folder with a static server
npx serve -s build -l 3000
```

---

## API Documentation

### Base URL
```
http://localhost:8001/api
```

### Endpoints

#### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/applications` | Submit new loan application |
| `GET` | `/applications` | Get all applications |
| `GET` | `/applications/{id}` | Get application by ID |
| `PATCH` | `/applications/{id}/status` | Update application status |

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/login` | Admin login |

#### Banking Information

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/applications/{id}/banking-info` | Get banking info (masked) |
| `GET` | `/applications/{id}/banking-info?full=true&password=xxx` | Get full banking info |
| `POST` | `/applications/accept-loan` | Accept loan & submit banking info |

#### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/applications/{id}/upload-document` | Upload document |
| `GET` | `/applications/{id}/documents/{doc_id}` | Download document |

#### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Get all notifications |
| `GET` | `/notifications/applicant/{email}` | Get applicant notifications |
| `PATCH` | `/notifications/{id}/read` | Mark notification as read |

#### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/calculator?amount=2500&rate=8.5&term=12` | Calculate loan payments |
| `GET` | `/stats` | Get dashboard statistics |

### Example API Calls

**Submit Application:**
```bash
curl -X POST http://localhost:8001/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "5551234567",
    "date_of_birth": "1990-01-15",
    "street_address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "annual_income": 75000,
    "employment_status": "employed",
    "loan_amount_requested": 2500,
    "ssn_last_four": "1234"
  }'
```

**Calculate Loan:**
```bash
curl "http://localhost:8001/api/calculator?amount=2500&rate=8.5&term=12"
```

**Admin Login:**
```bash
curl -X POST http://localhost:8001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}'
```

---

## Deployment Guide

### Option 1: Deploy with Docker

#### 1. Create Dockerfile for Backend

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### 2. Create Dockerfile for Frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Create docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=loanease_db
      - ADMIN_PASSWORD=admin123
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongo_data:
```

#### 4. Deploy

```bash
docker-compose up -d
```

### Option 2: Deploy to Cloud Platforms

#### Heroku

**Backend:**
```bash
# Create Procfile in backend/
echo "web: uvicorn server:app --host 0.0.0.0 --port \$PORT" > backend/Procfile

# Deploy
cd backend
heroku create loanease-api
heroku config:set MONGO_URL="your-mongodb-atlas-url"
heroku config:set DB_NAME="loanease_db"
heroku config:set ADMIN_PASSWORD="your-secure-password"
git push heroku main
```

**Frontend:**
```bash
cd frontend
# Update .env with production backend URL
echo "REACT_APP_BACKEND_URL=https://loanease-api.herokuapp.com" > .env.production

yarn build
# Deploy build folder to Heroku, Netlify, or Vercel
```

#### Vercel (Frontend)

```bash
cd frontend
vercel deploy --prod
```

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 3: VPS Deployment (Ubuntu)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx

# 3. Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Clone and setup project
git clone <your-repo> /var/www/loanease
cd /var/www/loanease

# 5. Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Setup frontend
cd ../frontend
npm install -g yarn
yarn install
yarn build

# 7. Configure Nginx
sudo nano /etc/nginx/sites-available/loanease
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/loanease/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 8. Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/loanease /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 9. Setup systemd service for backend
sudo nano /etc/systemd/system/loanease-backend.service
```

**Systemd Service:**
```ini
[Unit]
Description=LoanEase Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/loanease/backend
Environment="PATH=/var/www/loanease/backend/venv/bin"
ExecStart=/var/www/loanease/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 10. Start backend service
sudo systemctl daemon-reload
sudo systemctl start loanease-backend
sudo systemctl enable loanease-backend
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error:** `ServerSelectionTimeoutError: No servers found`

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### 2. CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
- Ensure `CORS_ORIGINS` in backend `.env` includes your frontend URL
- For development, set `CORS_ORIGINS="*"`
- For production, set specific origins: `CORS_ORIGINS="https://your-domain.com"`

#### 3. Module Not Found (Backend)

**Error:** `ModuleNotFoundError: No module named 'xxx'`

**Solution:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Node Modules Issues (Frontend)

**Error:** `Module not found` or dependency errors

**Solution:**
```bash
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

#### 5. Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port
lsof -i :8001  # or :3000

# Kill the process
kill -9 <PID>
```

#### 6. File Upload Fails

**Error:** `413 Request Entity Too Large`

**Solution:**
- Check file size (max 10MB)
- For Nginx, add to config:
```nginx
client_max_body_size 10M;
```

### Getting Help

- Check the logs: `tail -f /var/log/supervisor/backend.err.log`
- Review API responses in browser DevTools → Network tab
- Ensure all environment variables are set correctly

---

## Security Recommendations for Production

1. **Change Default Password**
   ```bash
   # In backend/.env
   ADMIN_PASSWORD="use-a-strong-password-here"
   ```

2. **Use HTTPS**
   - Set up SSL certificates with Let's Encrypt
   - Force HTTPS redirects

3. **Restrict CORS**
   ```bash
   CORS_ORIGINS="https://your-production-domain.com"
   ```

4. **Secure MongoDB**
   - Enable authentication
   - Use a strong password
   - Restrict network access

5. **Environment Variables**
   - Never commit `.env` files
   - Use secrets management in production

---

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues or questions, please open a GitHub issue or contact the development team.
