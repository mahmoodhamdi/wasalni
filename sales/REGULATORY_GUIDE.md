# Wasalni — Regulatory & Compliance Guide

Quick reference for operators across MENA. **Not legal advice** — engage a
local lawyer before launch.

---

## Egypt (Primary Market)

### NTC License (National Transport Council)
- Required for ride-hailing operations.
- Application via Ministry of Transport portal.
- Cost: EGP 10,000-50,000 (varies by governorate and fleet size).
- Timeline: 30-90 days.
- Tip: Apply 60 days before public launch.

### Driver Requirements
- Egyptian National ID.
- Driving license (valid, appropriate class).
- Vehicle registration in driver's name OR signed authorization.
- Vehicle insurance (3rd-party minimum; comprehensive recommended).
- Annual vehicle inspection certificate.
- Criminal record (no record within last 5 years).
- Age 21-65.

### Vehicle Requirements
- Year 2010 or newer for "Economy" tier.
- Year 2018 or newer for "Comfort" tier.
- Year 2020 or newer for "Family" tier.
- Tuk-Tuk and motorcycle: same year requirements + governorate-specific rules.
- Color and plate must be readable.
- Fire extinguisher and first aid kit in car.

### Insurance
- 3rd-party liability minimum (legal requirement).
- Recommended: comprehensive + ride-hailing rider.
- Egyptian providers offering ride-hailing-specific products: Misr Insurance,
  Allianz Egypt, GIG (Gulf Insurance Group).

### Tax & E-Invoicing
- VAT 14% applies to platform commission (not to driver fares).
- ETA (Egyptian Tax Authority) e-invoicing mandatory since 2023 for B2B.
- Drivers operate as freelancers; platform must report annual earnings per driver.
- Annual tax filing required.

### Data Residency
- Egyptian PDPL (Personal Data Protection Law, 2020) requires:
  - User consent for data collection.
  - Right to delete on request.
  - Data residency in Egypt for sensitive data (preferred, not strict).
  - Breach notification within 72 hours.

### Anti-Trust
- Be careful about "exclusive territory" claims if you start dominating.
- Avoid colluding with informal taxi cooperatives on pricing.

---

## Saudi Arabia

### Wasel (Ride-Hailing Authority)
- Established 2017; mandates licensing for all ride-hailing platforms.
- Required: Saudi commercial registration, Wasel platform license, GAZT registration.
- Cost: SAR 50,000 platform license + per-driver SAR 600/yr.

### Saudization (Nitaqat)
- Drivers must be Saudi citizens (varies by category).
- Female-driver-only is enabled by law since 2019.
- Heavy investment required for compliance team.

### Tip
- For Saudi expansion, partner with a local Saudi entity. Direct operation by
  non-Saudi entity is restricted.

---

## United Arab Emirates

### Per-Emirate Rules
- **Dubai**: RTA approval required. Existing local players (Careem, Hala) dominate.
- **Abu Dhabi**: Department of Transport oversight.
- **Sharjah**: Sharjah Roads Authority.

### Local Partner
- 51% local ownership traditionally required (relaxed post-2021 but still complex).

### Recommended
- Don't enter UAE unless you have a strategic local partner. Pricing pressure
  from Careem and Hala is intense.

---

## Morocco

### Transport Ministry
- Ride-hailing existed in legal gray zone until 2024 reforms.
- Taxi unions historically resist; engage with cooperatives instead of fighting.
- Lower operational complexity than Egypt but smaller secondary-city budgets.

### Languages
- French and Arabic both important.
- Berber languages relevant in rural areas (Tachelhit, Tamazight).

---

## Algeria

### Status
- Ride-hailing legalization in progress as of 2025.
- Highly informal taxi sector.
- Cash-only economy in most secondary cities.

---

## Tunisia

### Status
- Bolt operates in Tunis since 2019.
- Smaller cities open for entry.
- Tax authority strict about platform commission reporting.

---

## Universal Compliance Checklist (for any deployment)

- [ ] Local commercial registration of operator entity.
- [ ] Ride-hailing-specific permit (where required).
- [ ] Tax registration + e-invoicing integration.
- [ ] Privacy policy reviewed by local lawyer.
- [ ] Terms of service reviewed by local lawyer.
- [ ] Data residency choice documented.
- [ ] Insurance partner identified.
- [ ] Driver KYC workflow validated against local norms.
- [ ] Vehicle inspection partner identified.
- [ ] Local emergency services integration (122 for Egypt, 999 for KSA, etc.).
- [ ] Local Arabic-speaking customer support trained.

---

## What Wasalni Handles

The platform technically supports:
- Driver document expiry tracking (`services/gap-features.service.ts`).
- Vehicle inspection cadence (annually configurable).
- Audit log of every admin action.
- Immutable trip record for tax / dispute proofs.
- E-invoicing API hooks (Egypt-specific integration available as add-on).

## What Wasalni Does NOT Handle

- Negotiating with regulators.
- Choosing your local insurance provider.
- Defending lawsuits.
- Banking relationships.
- Hiring compliance staff.

For any tier above Town Starter, we connect you with a network of local lawyers
and compliance consultants who specialize in transport.
