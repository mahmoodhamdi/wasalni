# Wasalni — Deployment Variants

Three standardized deployment paths. Pick based on the client's appetite for
ops vs. budget.

---

## Variant A — Client-Hosted (DIY)

**The client provides infrastructure; we deploy and hand over the keys.**

### Requirements
- 1 × Ubuntu 22.04 LTS VPS, **8 vCPU / 16 GB RAM / 200 GB SSD** (DigitalOcean droplet "g-8vcpu-16gb-amd" or equivalent — ~$96/mo).
- Public IPv4 with ports 80/443 reachable.
- A domain name + DNS access (e.g. `wasalni-tanta.com`).
- An SMTP relay account for OTP emails (or Resend / SendGrid).
- One of: Twilio / Unifonic / VictoryLink account for SMS OTP (~$30/mo).
- One of: Google Maps API key or Mapbox key (start with OSM, free).
- Paymob merchant account (free signup, transaction fees apply).
- Optional: a Cloudinary / S3 bucket for media (~$10/mo).
- Optional: MongoDB Atlas M10+ ($60/mo) or self-host on the same VPS.
- Optional: Redis Cloud (free tier 30MB) or self-host.

### Stack
- Docker Compose (production profile in `docker-compose.yml`).
- Nginx reverse proxy with Let's Encrypt.
- Backend at `:5000`, Admin at `:3000`, both proxied to subdomains.

### Tradeoffs
| Pro | Con |
|---|---|
| Lowest ongoing cost | Client owns ops (alerts, backups, scaling) |
| Full control of data and code | Need a sysadmin or pay us for monthly support |
| Easy to start | Single point of failure unless we add HA |

### What we do
1. Provision VPS (or guide client).
2. Run `scripts/deploy-variant-a.sh <hostname>` (provided).
3. Apply city YAML via `scripts/apply-city-config.sh <slug>`.
4. Seed demo data and verify all flows.
5. Hand over admin credentials + runbook.

**Best for**: Town Starter, City Pro tiers.

---

## Variant B — Wasalni Managed

**We host on our infrastructure. Client pays a monthly fee on top of license.**

### Hosting Setup
- DigitalOcean or Hetzner Cloud.
- App Platform / Kubernetes cluster shared across multiple cities (multi-tenant).
- Managed MongoDB Atlas Replica Set.
- Managed Redis Cluster.
- Cloudflare in front (DDoS + caching + edge SSL).

### Monthly Fee (per city)
- City Pro tier: EGP 5,000 / mo
- Major City tier: EGP 9,000 / mo
- Includes: backups, monitoring, security patches, uptime SLA 99.5%, 4h support response.

### Pros
| Pro | Con |
|---|---|
| Zero ops burden on client | Monthly fee on top of license |
| HA + automated backups + monitoring | Less customization freedom |
| Easy to scale up | Data resides on our infra |

### What we do (ongoing)
- Apply OS patches monthly.
- Run nightly mongodump backups (retained 30 days).
- Monitor health endpoints; on-call rotation responds to alerts.
- Apply Wasalni platform updates when released.
- Provide a status page (e.g. status.wasalni.app).

**Best for**: Major City tier, clients who don't have technical staff.

---

## Variant C — Multi-City Cluster

**Kubernetes deployment serving multiple cities under one operator.**

### Stack
- 3-node Kubernetes cluster (DOKS, GKE, or EKS).
- Tenant isolation via separate Mongo databases per city.
- Shared Redis with namespace prefixing.
- ArgoCD for GitOps deployment.
- Prometheus + Grafana + Loki for observability.
- Cloudflare in front; per-city subdomains routed by Ingress.

### Sizing Guide
| # of cities | Cluster size | Mongo plan | Redis plan | Estimated monthly infra |
|---|---|---|---|---|
| 3-5 cities | 3 × medium nodes | Atlas M20 | Redis Cloud 250MB | $400-600 |
| 6-10 cities | 5 × medium nodes | Atlas M30 | Redis Cloud 1GB | $800-1,200 |
| 11+ cities | Dedicated cluster + sharded | Atlas M40 sharded | Self-hosted cluster | $2,000-4,000 |

### Pros
| Pro | Con |
|---|---|
| Massive economies of scale | Operational complexity |
| One Slack/PagerDuty across all cities | Requires DevOps team or our Platinum support |
| Centralized analytics across the network | More expensive infra than Variant A per city |

**Best for**: Regional Hub, Governorate Master tiers.

---

## Choosing the Right Variant

```
Question: Do you have a sysadmin or technical co-founder?
├── Yes → Variant A
└── No
    ├── How many cities are you launching?
    │   ├── 1 → Variant B
    │   ├── 2-5 → Variant B (multi-tenant)
    │   └── 6+ → Variant C
```

---

## Migration Paths

- **A → B**: Possible. Allow 2-3 days for data migration. Fee: EGP 25,000.
- **B → C**: Free as part of scaling up. Allow 1 week.
- **A → C**: Allow 1-2 weeks. Fee: EGP 50,000.

---

## Deployment Checklist

Run through this with the client at handover:

- [ ] Domain DNS propagation verified
- [ ] SSL cert issued (Let's Encrypt or paid)
- [ ] Backend health endpoint returns 200
- [ ] Admin dashboard logs in successfully
- [ ] Mobile apps connect to backend (test passenger flow)
- [ ] Mobile apps connect to backend (test driver flow)
- [ ] Socket.io real-time events working
- [ ] Demo data seeded
- [ ] City config applied (`scripts/apply-city-config.sh <slug>`)
- [ ] SMS OTP delivers to a real phone
- [ ] Paymob test transaction completes
- [ ] FCM push notifications delivered
- [ ] Backup cron configured
- [ ] Monitoring dashboard accessible to client
- [ ] Runbook handed over (incident playbook, contacts, etc.)
- [ ] Admin training session 1 completed
- [ ] Admin training session 2 completed
- [ ] Sign-off form signed (warranty starts from this date)
