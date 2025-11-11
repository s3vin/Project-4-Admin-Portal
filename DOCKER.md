# Docker Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Install Docker on Ubuntu/WSL

```bash
# Update packages
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Quick Start

### 1. Using the Helper Script (Recommended)

```bash
# Make the script executable
chmod +x docker.sh

# Build and start services
./docker.sh build
./docker.sh start

# Or start in development mode
./docker.sh dev
```

### 2. Manual Docker Compose Commands

```bash
# Build containers
docker-compose build

# Start in production mode
docker-compose up -d

# Start in development mode (with hot reload)
docker-compose --profile dev up -d
```

## Available Services

| Service | Port | Description |
|---------|------|-------------|
| app | 5000 | Production app |
| app-dev | 5001 | Development app with hot reload |
| mongodb | 27017 | MongoDB database |

## Helper Script Commands

```bash
./docker.sh build      # Build Docker containers
./docker.sh start      # Start production services
./docker.sh dev        # Start development services
./docker.sh stop       # Stop all services
./docker.sh restart    # Restart services
./docker.sh logs       # View logs (all services)
./docker.sh logs app   # View logs (specific service)
./docker.sh seed       # Seed database with sample data
./docker.sh shell      # Open shell in app container
./docker.sh status     # Show container status
./docker.sh clean      # Remove containers and volumes
./docker.sh help       # Show help
```

## Environment Configuration

1. **Copy the example environment file:**
```bash
cp .env.docker.example .env.docker
```

2. **Edit `.env.docker` with your settings:**
```env
JWT_SECRET=your-production-secret-min-32-chars
MONGO_INITDB_ROOT_USERNAME=your_db_user
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
```

## Accessing the Application

**Production Mode:**
- Application: http://localhost:5000
- MongoDB: localhost:27017

**Development Mode:**
- Application: http://localhost:5001 (with hot reload)
- MongoDB: localhost:27017

## Seeding the Database

After starting the containers:

```bash
# Using helper script
./docker.sh seed

# Or manually
docker-compose exec app node seed.js
```

This creates:
- Admin user: `admin@admin.com` / `admin123`
- 5 sample roles
- 3 test users

## Common Operations

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongodb
```

### Execute Commands in Container
```bash
# Open shell
docker-compose exec app sh

# Run npm commands
docker-compose exec app npm install package-name

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p adminpassword
```

### Rebuild After Code Changes
```bash
# Production
docker-compose up -d --build

# Development (uses volumes, no rebuild needed)
docker-compose --profile dev up -d
```

### Stop Services
```bash
# Stop containers
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Development vs Production

**Development Mode:**
- Uses `Dockerfile.dev`
- Includes nodemon for hot reload
- Mounts source code as volume
- Installs dev dependencies
- Accessible on port 5001

**Production Mode:**
- Uses `Dockerfile`
- Optimized build
- Only production dependencies
- No source code mounting
- Accessible on port 5000

## Data Persistence

MongoDB data is persisted in Docker volumes:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration files

To backup:
```bash
docker run --rm -v adminportal_mongodb_data:/data -v $(pwd):/backup ubuntu tar czf /backup/mongodb-backup.tar.gz /data
```

To restore:
```bash
docker run --rm -v adminportal_mongodb_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/mongodb-backup.tar.gz -C /
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :5000
sudo lsof -i :27017

# Change port in docker-compose.yml
# Edit ports section: "5001:5000"
```

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check container status
docker-compose ps

# Restart services
docker-compose restart
```

### MongoDB Connection Issues
```bash
# Check MongoDB is healthy
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Connect to MongoDB directly
docker-compose exec mongodb mongosh -u admin -p adminpassword
```

### Clear Everything and Start Fresh
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose rm -f

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### Security Checklist

1. ✅ Change JWT_SECRET to a strong random string (min 32 chars)
2. ✅ Update MongoDB credentials
3. ✅ Use environment-specific .env files
4. ✅ Enable firewall rules
5. ✅ Use HTTPS with reverse proxy (nginx/traefik)
6. ✅ Regular backups of MongoDB volumes
7. ✅ Monitor container health
8. ✅ Set up log aggregation

### Using with Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Health Checks

The MongoDB service includes a health check. The app waits for MongoDB to be healthy before starting.

## Monitoring

### Check Container Resources
```bash
docker stats
```

### View Container Details
```bash
docker inspect adminportal-app
docker inspect adminportal-mongodb
```

## Scaling (Future)

To scale the app horizontally:

```yaml
# In docker-compose.yml, use replicas
services:
  app:
    deploy:
      replicas: 3
```

Add a load balancer (nginx, HAProxy) in front.

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t adminportal .
      - name: Run tests
        run: docker run adminportal npm test
```

## Support

For issues:
1. Check logs: `./docker.sh logs`
2. Verify services: `./docker.sh status`
3. Review this guide
4. Check Docker documentation

Happy deploying! 🐳
