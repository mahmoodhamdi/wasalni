# Wasalni — City License Tiers (تير التراخيص)

Updated: 2026-05-13. Prices in EGP / USD (1 USD ≈ 33 EGP). All licenses are
**perpetual** for the named territory unless otherwise noted. Annual support
plans are sold separately ([SUPPORT_PLANS.md](./SUPPORT_PLANS.md)).

---

## Tier 1 — Town Starter

**Target**: Towns and rural centers under 100,000 residents (e.g. Bagour, Quesna, Birket El Sab).

| Item | Detail |
|---|---|
| **Price** | EGP 150,000 / USD 4,500 |
| **Territory** | One named town + immediate villages (≤ 25 km radius) |
| **Deployment** | Standard Wasalni stack on client-provided VPS (Variant A) |
| **Branding** | Color + logo customization only (white-label) |
| **Custom Features** | None |
| **Driver Onboarding** | Self-service docs + admin queue |
| **Training** | 2 days remote (Arabic) |
| **Support** | 3 months Bronze (bug fixes only, 48h response) |
| **App Store Listing** | Client publishes under own developer account |
| **Marketing Assets** | Standard kit (logo PSD, social templates) |

**Best for**: First-time operators, family-run transport businesses in small towns.

---

## Tier 2 — City Pro ★ Most Popular

**Target**: Mid-size cities 100,000-500,000 residents (e.g. Tanta, Damanhour, Banha).

| Item | Detail |
|---|---|
| **Price** | EGP 350,000 / USD 10,500 |
| **Territory** | One named city + 50 km radius |
| **Deployment** | Variant A or B (we host on managed infra) |
| **Branding** | Full white-label: name, logo, colors, splash, app names |
| **Custom Features** | 3 minor customizations included |
| **Driver Onboarding** | Self-service + 100 pre-recruited drivers (optional add-on) |
| **Training** | 4 days remote + 1 in-person day |
| **Support** | 6 months Silver (bug fixes + minor enhancements, 24h response) |
| **App Store Listing** | We publish for you under our agency account, or yours |
| **Marketing Assets** | Standard kit + 2 launch video templates + FB ad templates |
| **Data Migration** | One-time import of existing driver/customer data |

**Includes**:
- White-label config system (`config/cities/<your-city>.yaml`)
- Choice of SMS provider: VictoryLink, Unifonic, or Twilio
- Choice of maps provider: OSM (free), Google, or Mapbox
- Choice of payment providers: any combination of Cash / Paymob / Vodafone Cash / InstaPay / Fawry

**Best for**: Most secondary-city operators. Sweet-spot pricing.

---

## Tier 3 — Major City

**Target**: 500,000 - 2,000,000 residents (e.g. Mansoura, Asyut, Suez, Ismailia).

| Item | Detail |
|---|---|
| **Price** | EGP 700,000 / USD 21,000 |
| **Territory** | Major city + nearby smaller towns |
| **Deployment** | Variant B (managed by us) or C (dedicated infra) |
| **Branding** | Full white-label + custom illustrations + landing page |
| **Custom Features** | 8 custom features included |
| **Driver Onboarding** | 250 pre-recruited drivers + admin training |
| **Training** | 1 week on-site (2 trainers) |
| **Support** | 12 months Gold (4h response, 99.5% SLA, quarterly major features) |
| **App Store Listing** | Full setup including ASO optimization |
| **Marketing Assets** | Full launch kit: videos, posters, social ads, influencer scripts |

**Best for**: Established business groups, governorate-level operators.

---

## Tier 4 — Regional Hub

**Target**: Operators running 3-10 cities in one region.

| Item | Detail |
|---|---|
| **Price** | EGP 1,500,000 / USD 45,000 |
| **Territory** | 3-10 cities (named in contract) |
| **Deployment** | Variant C (multi-tenant Kubernetes cluster) |
| **Branding** | Same brand across all cities |
| **Custom Features** | 15 custom features + sub-licensing rights |
| **Driver Onboarding** | Up to 500 pre-recruited drivers across the cities |
| **Training** | 2 weeks on-site (2 trainers) |
| **Support** | 12 months Gold + dedicated Slack channel |
| **App Store Listing** | One app, multiple cities switchable in-app |
| **Marketing Assets** | Full launch kit + custom video per city |

**Best for**: Operators who already own transport businesses in multiple cities.

---

## Tier 5 — Governorate Master

**Target**: Operators who want a whole governorate's exclusivity.

| Item | Detail |
|---|---|
| **Price** | EGP 3,500,000 / USD 105,000 |
| **Territory** | Entire governorate (any city, unlimited expansion) |
| **Deployment** | Variant C (your own multi-region Kubernetes setup) |
| **Branding** | Full IP transfer for territory + sub-license rights to franchise |
| **Custom Features** | Unlimited custom features (within reason) |
| **Driver Onboarding** | 1,000+ pre-recruited drivers; ongoing recruitment partnership |
| **Training** | 1 month on-site, multiple trainers, train-the-trainer |
| **Support** | 24 months Platinum + 25% dedicated engineer time |
| **App Store Listing** | Full enterprise treatment |
| **Marketing Assets** | Full launch kit + agency partnership for launch year |
| **Bonus** | Right of first refusal on the next governorate at -10% discount |

**Best for**: Major investment groups, governorate-level partnerships.

---

## Optional Add-Ons (Available at All Tiers)

| Add-On | Price (EGP) | Notes |
|---|---|---|
| Pre-loaded driver recruitment (100 verified drivers) | 75,000 | We hire on the ground |
| Mobile app listing on Play/App Store (under your brand) | 50,000 | Includes 1 year hosting |
| Marketing launch kit (FB ads, influencers, posters, social) | 40,000 | 2-month campaign |
| Vehicle inspection integration with local authority | 30,000 | Per governorate |
| Custom feature (each) | 5,000-15,000 | Quote on scope |
| Multi-language UI (beyond AR/EN) | 25,000 | Per language |
| Corporate accounts module advanced | 40,000 | B2B sales tool |
| Driver training videos (custom recorded in your city) | 35,000 | 5 videos |
| Cloud infrastructure setup (DigitalOcean / Hetzner) | 15,000 | One-time |
| Disaster recovery setup (multi-region replicas) | 60,000 | One-time + monthly fee |

---

## What's Included in All Tiers

- Full source code with perpetual license for the named territory.
- Initial deployment + smoke testing.
- White-label configuration system documentation.
- All 4 components: Backend, Admin Dashboard, Passenger App, Driver App.
- Tuk-Tuk + Motorcycle support (the moat).
- Egyptian payment provider integrations (Cash, Paymob, Vodafone Cash, etc.).
- 30-day warranty on deployment bugs.

## What's NOT Included

- Domain registration and DNS (client buys).
- Google Maps / Mapbox / SMS provider account fees (client pays direct).
- Cloud infrastructure costs (~$30-150/month per city depending on volume).
- App Store / Play Store developer fees ($99/yr + $25 one-time).
- Marketing media spend.

---

## Payment Terms

- 50% on contract signing.
- 50% on production deployment.
- USD prices payable in EGP at exchange rate on contract date.
- Tax invoices issued in Egypt (15% VAT applies).
- For governorate / regional hub tiers: 30/40/30 payment schedule available.
