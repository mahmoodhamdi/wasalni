# Wasalni Deployment Guide

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB Atlas account or self-hosted MongoDB
- Redis (Upstash or self-hosted)
- Firebase project for push notifications
- Google Cloud account for Maps API
- Domain name with SSL certificate

---

## Environment Setup

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Environment Variables
```bash
# Server
NODE_ENV=production
PORT=3001
API_VERSION=v1

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wasalni?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:password@redis-host:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=wasalni-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@wasalni-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Admin Dashboard
NEXT_PUBLIC_API_URL=https://api.wasalni.app/api/v1
```

---

## Docker Deployment

### 1. Build Images
```bash
# Backend
docker build -t wasalni-backend ./backend

# Admin Dashboard
docker build -t wasalni-admin ./admin-dashboard
```

### 2. Run with Docker Compose
```bash
# Production
docker compose up -d

# Development (with MongoDB & Redis)
docker compose -f docker-compose.dev.yml up -d
```

### 3. Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    image: wasalni-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
    restart: unless-stopped

  admin:
    image: wasalni-admin
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    restart: unless-stopped
```

---

## Cloud Deployment Options

### Option A: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Deploy admin
cd ../admin-dashboard
railway init
railway up
```

### Option B: DigitalOcean App Platform
1. Create new App from GitHub repo
2. Configure environment variables
3. Set build command: `npm run build`
4. Set run command: `npm start`

### Option C: AWS ECS
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
docker push $ECR_REGISTRY/wasalni-backend
docker push $ECR_REGISTRY/wasalni-admin

# Deploy with ECS
aws ecs update-service --cluster wasalni --service backend --force-new-deployment
```

### Option D: Google Cloud Run
```bash
# Backend
gcloud run deploy wasalni-backend \
  --source ./backend \
  --region me-central1 \
  --allow-unauthenticated

# Admin
gcloud run deploy wasalni-admin \
  --source ./admin-dashboard \
  --region me-central1 \
  --allow-unauthenticated
```

---

## Mobile App Deployment

### Android (Passenger App)
```bash
cd passenger-app

# Generate keystore (first time only)
keytool -genkey -v -keystore android/app/wasalni.keystore \
  -alias wasalni -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
flutter build apk --release

# Build App Bundle for Play Store
flutter build appbundle --release
```

### Android (Driver App)
```bash
cd driver-app

# Build release APK
flutter build apk --release

# Build App Bundle
flutter build appbundle --release
```

### iOS
```bash
cd passenger-app

# Build for iOS
flutter build ios --release

# Archive in Xcode for App Store submission
open ios/Runner.xcworkspace
```

---

## Database Setup

### MongoDB Indexes
```javascript
// Users
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });

// Trips
db.trips.createIndex({ status: 1 });
db.trips.createIndex({ passenger: 1, createdAt: -1 });
db.trips.createIndex({ driver: 1, createdAt: -1 });
db.trips.createIndex({ "pickup.coordinates": "2dsphere" });

// Driver Locations
db.driverlocations.createIndex({ coordinates: "2dsphere" });
db.driverlocations.createIndex({ driver: 1 }, { unique: true });
```

### Initial Admin User
```javascript
db.users.insertOne({
  phone: "+201000000000",
  name: "Admin",
  email: "admin@wasalni.app",
  password: "$2b$10$...", // hashed password
  role: "admin",
  isActive: true,
  createdAt: new Date()
});
```

---

## Firebase Setup

### 1. Create Firebase Project
1. Go to console.firebase.google.com
2. Create new project: "wasalni-app"
3. Enable Cloud Messaging

### 2. Download Service Account Key
1. Project Settings > Service Accounts
2. Generate new private key
3. Save as `firebase-service-account.json`

### 3. Configure Android Apps
1. Add Android apps for both passenger and driver
2. Download `google-services.json`
3. Place in `android/app/` directory

### 4. Configure iOS Apps
1. Add iOS apps
2. Download `GoogleService-Info.plist`
3. Place in `ios/Runner/` directory

---

## SSL/TLS Setup

### Using Let's Encrypt with Nginx
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.wasalni.app -d admin.wasalni.app

# Auto-renewal
certbot renew --dry-run
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name api.wasalni.app;

    ssl_certificate /etc/letsencrypt/live/api.wasalni.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.wasalni.app/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name admin.wasalni.app;

    ssl_certificate /etc/letsencrypt/live/admin.wasalni.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.wasalni.app/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## Monitoring & Logging

### PM2 Process Manager
```bash
# Install PM2
npm i -g pm2

# Start backend
pm2 start dist/index.js --name wasalni-backend

# Start admin
pm2 start npm --name wasalni-admin -- start

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

### Log Management
```bash
# View logs
pm2 logs wasalni-backend

# Monitor
pm2 monit
```

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy, or cloud LB)
- Enable sticky sessions for Socket.io
- Use Redis for session storage

### Socket.io Scaling
```javascript
// Use Redis adapter
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Database Scaling
- MongoDB replica set for high availability
- Read replicas for analytics queries
- Consider sharding for large datasets

---

## Health Checks

### Backend Health Endpoint
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "mongodb": "connected",
  "redis": "connected"
}
```

### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
```

---

## Rollback Procedure

### Docker Rollback
```bash
# List previous images
docker images wasalni-backend

# Rollback to previous version
docker stop wasalni-backend
docker run -d --name wasalni-backend wasalni-backend:previous-tag
```

### Database Rollback
```bash
# Restore from backup
mongorestore --uri="$MONGODB_URI" --archive=backup.gz --gzip
```

---

## Support

For deployment issues, contact:
- Technical Support: tech@wasalni.app
- GitHub Issues: github.com/wasalni/wasalni/issues
