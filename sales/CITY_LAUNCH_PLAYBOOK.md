# Wasalni — City Launch Playbook

A proven 4-week schedule to take a new city live. Adjust to your tier and team size.

---

## Week 0 — Deployment & Driver Recruitment

### Days 1-2: Infrastructure
- [ ] Apply city config: `./scripts/apply-city-config.sh <slug>`
- [ ] Deploy backend + admin to client infra (Variant A/B/C).
- [ ] Verify mobile apps connect successfully.
- [ ] Seed demo data (`npm run seed:bagour:fresh` adapted to city).
- [ ] Run E2E tests end-to-end.
- [ ] Set up monitoring (Grafana / Uptime Robot).
- [ ] Configure backups.

### Days 3-7: Driver Recruitment Push
**Target**: 30-50 drivers approved by end of week.

Strategy:
1. **Door-to-door at taxi stands**: Visit the 3 biggest local stops. Pitch:
   *"You sit here waiting for customers. Our app sends them to you. 80% commission to you."*
2. **Mosque/market announcements** (with respect): pamphlets and a referral bonus.
3. **WhatsApp groups**: local driver groups exist; ask local fixer to introduce.
4. **Old-school flyer drop**: at every coffee shop in the city center.

KYC workflow:
- Driver downloads app → registers with phone → uploads docs.
- Admin reviews queue → approves within 24h.
- Approved drivers get a personal call to onboard.

**Recruiter compensation** (optional): EGP 150 per approved driver brought in. Pay weekly.

---

## Week 1 — Soft Launch (Invite-Only)

### Goal
Get 200-500 passengers using the app for free trips while you stress-test.

### Tactics
- **Free first ride**: promo code `WELCOME` gives EGP 30 off first ride.
- **Friends + family**: ask the 30 drivers to invite their families.
- **Coffee shop coupons**: distribute QR codes at 10 popular coffee shops; QR opens app store + applies promo.
- **Influencer collaboration**: identify 1-2 local micro-influencers (≤10K followers in the city). Pay EGP 1,000-3,000 for a story + reel.

### Operations
- Watch the admin dashboard. Investigate every cancelled trip and every disputed rating.
- Daily standup (15 min) with driver-recruitment lead.
- Fix any showstopper bugs immediately (rather than queueing them).

---

## Week 2 — Soft Launch (Expansion)

### Goal
500-1,500 passengers active. First paid rides flowing.

### Tactics
- **Facebook ads**: budget EGP 1,500-3,000. Target city + 25km radius + 18-50 yo.
- **Pre-roll YouTube ads**: only if your city has > 200K residents.
- **Tuktuk pricing campaign**: highlight the moat. *"Tuktuk من البيت للسوق ٨ ج.م. فقط"*.
- **Saturday market activation**: have 2-3 drivers + 1 admin onsite at the main market with free water bottles + QR codes.

### Metrics to Watch
- Drivers online during peak hours (5pm-9pm should be ≥ 70%).
- Rider acquisition cost.
- Acceptance rate (target: ≥ 80%).
- Cancellation rate (target: ≤ 12%).

---

## Week 3-4 — Official Launch

### Goal
Press release + public launch event + sustained marketing.

### Press Release Template
Available at [PRESS_RELEASE_TEMPLATE.md](./PRESS_RELEASE_TEMPLATE.md). Send to:
- Governorate news sites (e.g. for Bagour: Menofia Online).
- Local Facebook pages (Tanta Today equivalents).
- Major national papers if you have a budget.

### Launch Event
- Pick a Friday or Saturday afternoon.
- Location: central park or main shopping street.
- Activities:
  - 10 free rides per hour (raffle).
  - Driver of the month award (cash prize).
  - Live music or local entertainer (low budget version: 2-3 musicians).
  - QR code billboards for app install.
- Expected cost: EGP 15,000-40,000 depending on scale.

### Sustained Marketing
- Daily FB / Instagram posts featuring real driver stories.
- Weekly raffles: passengers who complete 5+ rides enter to win EGP 500.
- Referral program: 30 EGP for each new passenger you refer.

---

## Month 2 — Optimize

### Data-Driven Improvements
- Identify peak hours and add surge zones.
- Identify low-demand areas and run targeted ads.
- Identify top 10 drivers and feature them in marketing.
- Identify problem drivers (low rating, many cancellations) → coach or remove.

### Operational Polish
- Establish weekly settlement cadence for cash commissions.
- Hire a customer support agent if rides > 200/day.
- Set up a small office (often: 1 room rental + 1 desk + 1 phone).

### KPIs at Month 2
| Metric | Town Starter | City Pro | Major City |
|---|---|---|---|
| Daily trips | 80-150 | 400-800 | 1500-3000 |
| Active drivers (last 7 days) | 25-40 | 80-150 | 300-500 |
| Monthly GMV (EGP) | 50K-100K | 250K-500K | 800K-1.5M |
| Monthly commission (EGP) | 10K-20K | 50K-100K | 160K-300K |
| Driver retention (90-day) | ≥ 60% | ≥ 70% | ≥ 75% |

---

## Month 3+ — Scale

### Expand Geography
- Onboard drivers in neighboring villages / small towns.
- Update `config/cities/<slug>.yaml` `villages:` list and `service_area.polygon`.
- Run targeted recruitment in each new village (1-week sprint).

### Vertical Expansions
- **Corporate accounts**: pitch to local companies (factories, schools, hospitals). 
  Bill monthly with consolidated invoices.
- **Scheduled rides**: market the "تحجز رحلتك صباحاً" angle for commuters.
- **Long-distance / intercity**: enable `tuktuk: false` for long routes, charge premium.

---

## Marketing Budget Reference

| Tier | Soft launch | Public launch | Monthly sustained (Months 2-12) |
|---|---|---|---|
| Town Starter | EGP 5K | EGP 15K | EGP 3-5K |
| City Pro | EGP 20K | EGP 60K | EGP 10-15K |
| Major City | EGP 50K | EGP 150K | EGP 25-50K |
| Regional Hub | EGP 100K | EGP 300K | EGP 50-100K |

(Bundle the launch budget into your tier add-on for predictability.)

---

## KPIs You Must Track Daily

Set up these dashboards on day one:

1. **Trips Created / Completed / Cancelled** (today, week-to-date).
2. **Active Drivers Online** (now, peak today).
3. **Average Wait Time** (request → driver assigned).
4. **GMV** (gross merchandise value).
5. **Commission earned**.
6. **SOS triggered count** (must be 0 most days; investigate any).
7. **Top 5 cancelation reasons**.
8. **Top 5 ride origins** (where demand lives).

The admin dashboard ships with all of these out of the box.

---

## Common Pitfalls (from operating Bagour)

1. **Recruiting drivers without enough passengers** → drivers go offline + leave.
   *Fix: do passenger marketing in parallel with driver recruitment.*

2. **Cash commission becomes unmanageable** → drivers accumulate debt.
   *Fix: enforce weekly settlement. Block drivers > EGP 500 debt.*

3. **Surge pricing perceived as gouging** → bad press.
   *Fix: cap surge at 1.5x; communicate clearly in-app.*

4. **Cancellation penalties hated by drivers** → low retention.
   *Fix: 3-strike system before any penalty.*

5. **Local politicians or large taxi cooperatives push back** → regulatory risk.
   *Fix: engage them early; offer them a stake or co-branded driver group.*

6. **Religious/cultural concerns about female passengers** → low female adoption.
   *Fix: enable female-driver-only mode (we have it) + market it.*
