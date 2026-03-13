# X-Clone API Deployment Guide

**Target Environment**: Production  
**Deployment Method**: Docker + Nginx  
**SSL/TLS**: Required

---

## 🚀 Quick Deployment

### **Prerequisites**
- Docker & Docker Compose installed
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- Minimum 4GB RAM, 2 CPU cores

### **1. Clone Repository**
```bash
git clone https://github.com/your-org/x-clone-api.git
cd x-clone-api
```

### **2. Configure Environment**
```bash
cp .env.example .env
nano .env
```

**Required Variables**:
```bash
# Change these!
JWT_SECRET=your-production-secret-key-min-32-chars
DATABASE_URL=postgresql://user:password@db-host:5432/xclone_prod
ALLOWED_ORIGINS=https://your-frontend-domain.com
NODE_ENV=production
```

### **3. Start Services**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### **4. Verify Deployment**
```bash
curl https://your-domain.com/api/health
```

---

## 🌐 Domain & SSL Setup

### **Option A: Using Nginx + Let's Encrypt**

**1. Install Certbot**:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

**2. Obtain SSL Certificate**:
```bash
sudo certbot --nginx -d api.your-domain.com
```

**3. Configure Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Option B: Using Cloudflare**

1. Add domain to Cloudflare
2. Point A record to your server IP
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

---

## 🔒 Security Hardening

### **1. Environment Variables**
```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

### **2. Database Security**
```bash
# Create production database user
CREATE USER xclone_prod WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE xclone_prod TO xclone_prod;

# Enable SSL connections
ALTER SYSTEM SET ssl = on;
```

### **3. Firewall Configuration**
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### **4. Rate Limiting**
Add to Nginx config:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}
```

---

## 📊 Monitoring Setup

### **Health Checks**
```bash
# Add to docker-compose.prod.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### **Logging**
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/xclone-api

/var/log/xclone/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## 🔄 CI/CD Pipeline

### **GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/x-clone-api
            git pull
            docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🗄️ Database Migration

### **Run Migrations**
```bash
# Inside backend container
docker exec -it xclone-backend npx prisma migrate deploy

# Or using docker-compose
docker-compose exec backend npx prisma migrate deploy
```

### **Backup Database**
```bash
# Automated daily backups
0 2 * * * docker exec xclone-postgres pg_dump -U xclone xclone_prod > /backups/xclone_$(date +\%Y\%m\%d).sql
```

---

## 📈 Scaling

### **Horizontal Scaling**
```yaml
# docker-compose.prod.yml
services:
  content-service:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### **Load Balancer**
```nginx
upstream content_service {
    least_conn;
    server content-service-1:3003;
    server content-service-2:3003;
    server content-service-3:3003;
}
```

---

## 🔍 Troubleshooting

### **Check Service Status**
```bash
docker-compose ps
docker-compose logs -f gateway
docker-compose logs -f backend
```

### **Common Issues**

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check backend service is running |
| CORS errors | Verify ALLOWED_ORIGINS in .env |
| Database connection failed | Check DATABASE_URL |
| SSL certificate error | Renew with `certbot renew` |

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Database migrations run
- [ ] Firewall rules configured
- [ ] CORS origins whitelisted
- [ ] Rate limiting enabled
- [ ] Health checks passing
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Logs rotation configured
- [ ] CI/CD pipeline tested
- [ ] Documentation updated

---

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs`
- Verify health: `curl https://your-domain.com/api/health`
- Review configuration: `docker-compose config`
