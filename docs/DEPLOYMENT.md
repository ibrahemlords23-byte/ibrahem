# Deployment Guide for Ibrahim Accounting System

## Prerequisites
- Docker and Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)

## Quick Start with Docker

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ibrahim-accounting-system
```

2. **Configure environment variables:**
```bash
cp backend/env.production backend/.env
# Edit the .env file with your production values
```

3. **Start the application:**
```bash
docker-compose up -d
```

4. **Initialize the database:**
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

5. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

## Production Deployment

### 1. Server Setup
- Ubuntu 20.04+ or CentOS 8+
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ storage

### 2. Install Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Configure Domain and SSL
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com
```

### 4. Update Docker Compose for Production
```yaml
# Add to docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
```

### 5. Configure Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://frontend:80;
    }
    
    location /api {
        proxy_pass http://backend:3001;
    }
}
```

## Database Management

### Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres ibrahim_accounting > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres ibrahim_accounting < backup.sql
```

### Migration
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Reset database (development only)
docker-compose exec backend npx prisma migrate reset
```

## Monitoring and Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Health Checks
```bash
# Check if services are running
docker-compose ps

# Test API endpoint
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000
```

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall (ports 80, 443 only)
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs for suspicious activity

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Frontend not loading:**
   - Check if backend is running
   - Verify API proxy configuration
   - Check browser console for errors

3. **Authentication issues:**
   - Verify JWT secrets are set
   - Check token expiration settings
   - Ensure CORS is configured correctly

### Performance Optimization

1. **Database:**
   - Add indexes for frequently queried fields
   - Configure connection pooling
   - Regular VACUUM and ANALYZE

2. **Application:**
   - Enable gzip compression
   - Use CDN for static assets
   - Implement caching strategies

3. **Infrastructure:**
   - Use load balancer for high availability
   - Implement horizontal scaling
   - Monitor resource usage

## Support

For technical support:
- Email: support@ibrahim-accounting.com
- Documentation: /docs
- Issues: GitHub Issues

---

**نظام إبراهيم للمحاسبة** - دليل النشر والإنتاج 🚀
