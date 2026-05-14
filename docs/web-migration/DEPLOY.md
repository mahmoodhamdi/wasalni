# Wasalni Web Deployment

This guide brings the two PWAs (and the backend they share with the admin
dashboard) live on a single Docker host.

## Topology

```
                ┌──────────────────────────────────────────────┐
                │  nginx (host:80/443)                          │
                │   ├── wasalni.app          → passenger-web    │
                │   ├── driver.wasalni.app   → driver-web       │
                │   ├── admin.wasalni.app    → admin-dashboard  │
                │   └── api.wasalni.app      → backend          │
                └──────────────────────────────────────────────┘
                            ↑ TLS terminated here
        ┌───────────────────┴───────────────────┐
        │              docker network            │
        │   passenger-web  driver-web  admin     │
        │           ↘    ↓    ↙                  │
        │            backend (3000)              │
        │             ↘   ↓   ↙                  │
        │      mongodb       redis               │
        └────────────────────────────────────────┘
```

## Prerequisites

- A Linux host (Ubuntu 22.04+, Debian 12+, or similar) with **2 vCPU /
  4 GB RAM minimum** for production traffic
- **Docker Engine 24+** and **Docker Compose v2**
- DNS A records pointing all four subdomains at the host
- Inbound 80/443 open to the world (UFW or cloud firewall)

## 1. Clone & configure

```bash
git clone https://github.com/mahmoodhamdi/wasalni.git
cd wasalni
cp .env.example .env
```

Edit `.env` and set, at minimum:

```bash
# Mongo
MONGO_USER=wasalni
MONGO_PASSWORD=$(openssl rand -hex 16)
MONGODB_URI=mongodb://wasalni:${MONGO_PASSWORD}@mongodb:27017/wasalni?authSource=admin

# Redis (default URL works; if you set REDIS_PASSWORD, append @host:port)
REDIS_URL=redis://redis:6379

# Backend
JWT_SECRET=$(openssl rand -hex 64)
CORS_ORIGIN=https://wasalni.app,https://driver.wasalni.app,https://admin.wasalni.app
PAYMOB_API_KEY=...            # from Paymob dashboard
FIREBASE_SERVICE_ACCOUNT=$(cat firebase-admin-sdk.json | base64 -w0)

# Web apps
SESSION_SECRET=$(openssl rand -hex 32)
PASSENGER_API_URL=https://api.wasalni.app/api/v1
PASSENGER_SOCKET_URL=https://api.wasalni.app
PASSENGER_APP_URL=https://wasalni.app
DRIVER_API_URL=https://api.wasalni.app/api/v1
DRIVER_SOCKET_URL=https://api.wasalni.app
DRIVER_APP_URL=https://driver.wasalni.app
BACKEND_INTERNAL_URL=http://backend:3000/api/v1
```

## 2. Bring everything up

```bash
docker compose -f docker-compose.web.yml up -d --build
docker compose -f docker-compose.web.yml ps
```

First boot pulls images and builds the apps — expect 5-10 minutes on
4 vCPU. Subsequent boots reuse the layer cache (~30 s).

## 3. TLS with Let's Encrypt

```bash
sudo apt install -y certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d wasalni.app -d www.wasalni.app \
  -d driver.wasalni.app \
  -d admin.wasalni.app \
  -d api.wasalni.app \
  --email ops@wasalni.app --agree-tos --no-eff-email
```

Copy the resulting certs into `deploy/nginx/certs/` and uncomment the
TLS server blocks in `deploy/nginx/conf.d/wasalni.conf` to terminate
HTTPS at nginx.

## 4. Smoke test

```bash
curl -fsSI https://wasalni.app/api/healthz | head
curl -fsSI https://driver.wasalni.app/api/healthz | head
curl -fsSI https://api.wasalni.app/api/v1/health | head
```

All three should return `200 OK` with `Content-Type: application/json`.

## 5. Observability

- **Logs**: `docker compose -f docker-compose.web.yml logs -f`
  Web-vitals events appear as `{"kind":"metric", ...}` JSON lines —
  point your log shipper (Loki/Vector/Logflare) at the Docker socket or
  forward Docker logs via the JSON driver.
- **Errors**: when you wire Sentry, swap the body of
  `apps/*-web/app/api/metrics/route.ts` to forward to the Sentry HTTP
  ingest. No client changes needed.

## 6. Updating

```bash
git pull
docker compose -f docker-compose.web.yml up -d --build --remove-orphans
```

For a controlled, no-downtime rollout, build images on a CI runner and
push to a registry, then `docker compose pull && up -d`. Both PWAs
register a service worker, so users on the old build keep working from
their cache until the SW update prompt appears (PR 7).

## 7. Backups

```bash
# Mongo
docker compose exec mongodb sh -c \
  'mongodump --uri="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/?authSource=admin" --archive' \
  > backups/mongo-$(date +%F).archive

# Redis (best-effort; treat as cache)
docker compose exec redis redis-cli BGSAVE
```

## Hardening checklist

- [ ] Run `docker compose top` and confirm every container runs as a
      non-root user
- [ ] Verify TLS scores at https://www.ssllabs.com/ssltest/ (target: A+)
- [ ] Verify CSP at https://csp-evaluator.withgoogle.com/
- [ ] Verify headers at https://securityheaders.com/ (target: A)
- [ ] Schedule `mongodump` to S3 via a daily cron
- [ ] Set up `fail2ban` for SSH
- [ ] Configure log retention (default Docker JSON driver keeps logs
      forever — rotate via `daemon.json` `log-opts`)
