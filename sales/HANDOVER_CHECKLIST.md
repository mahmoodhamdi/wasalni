# Wasalni — Handover Checklist

Run through this with every new client at deployment time. Sign at the end —
warranty begins from sign-off.

---

## Phase 1 — Code & Credentials

- [ ] Source code repository: Client has cloning access to the GitHub mirror with their city config.
- [ ] Git tag for handover: `v1.0.0-<city-slug>-handover-<YYYYMMDD>`.
- [ ] Documentation pack delivered (this folder + `docs/`).
- [ ] Admin dashboard URL + super_admin credentials handed over (in 1Password / encrypted PDF).
- [ ] Backend API base URL.
- [ ] Mobile app store credentials (if we published for them).
- [ ] Email / SMTP credentials.
- [ ] SMS provider credentials (Twilio / Unifonic / VictoryLink).
- [ ] Google Maps API key (if applicable).
- [ ] Paymob merchant credentials.
- [ ] Cloudinary / S3 access keys.
- [ ] Firebase project access + service account JSON.

## Phase 2 — Infrastructure

- [ ] Server access (SSH key authorized, root password rotated).
- [ ] Domain DNS access (the city's domain, e.g. `wasalni-tanta.com`).
- [ ] SSL certificate (Let's Encrypt configured + auto-renewal verified).
- [ ] MongoDB Atlas / self-hosted access.
- [ ] Redis access.
- [ ] Backup destination (S3 bucket or similar) credentials.
- [ ] Monitoring dashboard access (Grafana / Uptime Robot).
- [ ] Alert routing (where do PagerDuty / SMS alerts go?).

## Phase 3 — Functional Smoke Test

Run the following with the client watching:

- [ ] Admin login works.
- [ ] Create a new admin user.
- [ ] View driver list. Approve a pending driver.
- [ ] View trips list. Filter by status.
- [ ] View live map. See online drivers.
- [ ] Open fare settings. Adjust economy base fare from EGP 8 to EGP 9. Save.
- [ ] Open zones. Drag-to-draw a new surge zone. Save.
- [ ] Create a promo code. Test it expires correctly.

- [ ] Passenger app: register a new account via phone OTP.
- [ ] Passenger app: request a ride from point A to point B.
- [ ] Driver app: log in as a test driver, go online, receive the request.
- [ ] Driver app: accept, navigate, arrive, start, complete trip.
- [ ] Passenger app: rate the trip + pay (cash flow).
- [ ] Admin dashboard: see the completed trip + commission accrual.

- [ ] Passenger app: trigger SOS during a trip.
- [ ] Admin dashboard: SOS appears in the emergency queue.
- [ ] SMS sent to emergency contact (check phone).

## Phase 4 — Training

Conduct sessions per tier:

### Session 1 — Admin Dashboard (60-90 min)
- Navigating dashboards, filters, exports.
- Driver KYC review workflow.
- Trip dispute resolution.
- Promo code management.
- Fare settings.

### Session 2 — Driver Onboarding (45 min)
- How to recruit drivers.
- How to verify documents.
- Common rejection reasons and how to explain them.

### Session 3 — Operational Cadence (45 min)
- Daily KPI checks.
- Weekly cash settlement.
- Monthly financial reports.
- Incident response.

### Session 4 — Marketing (City Pro+) (60 min)
- Using the launch playbook.
- FB ads setup.
- Influencer outreach.

## Phase 5 — Documentation Walk-Through

- [ ] `README.md` reviewed.
- [ ] `docs/API.md` reviewed.
- [ ] `docs/REALTIME_EVENTS.md` reviewed.
- [ ] `docs/DEPLOYMENT.md` reviewed.
- [ ] `sales/CITY_LAUNCH_PLAYBOOK.md` reviewed.
- [ ] `sales/SUPPORT_PLANS.md` reviewed (so client knows what's covered).

## Phase 6 — Sign-Off

By signing below, both parties agree:

- The system passes all smoke tests above.
- The 30-day warranty period starts today.
- Support plan tier is: `____________________`.
- First annual support renewal due: `____________________`.

```
Client (printed name):    ____________________
Client signature:         ____________________
Date:                     ____________________

Wasalni representative:   ____________________
Signature:                ____________________
Date:                     ____________________
```

## Post-Handover Touchpoints

- **Day 7**: Check-in call (15 min).
- **Day 14**: Soft launch metrics review.
- **Day 30**: Warranty expiry → switch to support plan.
- **Day 60**: First operational review.
- **Day 90**: Quarterly strategic check-in.
