# Wasalni — Demo Accounts (Bagour Reference Deployment)

Use these accounts to walk through the full passenger / driver / admin journey
in a sales demo. All accounts created by `npm run seed:bagour:fresh`.

OTP for all accounts in mock mode: **1234** (configurable via env).
Password where applicable: **Demo123!@#**

---

## Admin Accounts

| Email | Password | Role | Use case |
|---|---|---|---|
| admin@wasalni.demo | Demo123!@# | Super admin | Full access — KYC review, fare config, financial reports |
| ops@wasalni.demo | Demo123!@# | Ops manager | Daily operations, dispute resolution |
| support@wasalni.demo | Demo123!@# | Support agent | Customer chat, ticket triage |

---

## Driver Accounts (40 total — sample shown)

### Verified — Economy (15 drivers, sample 3)

| Email | Phone | Name | Vehicle | Status |
|---|---|---|---|---|
| driver1@wasalni.demo | +201200000100 | محمد عبدالله | Toyota Corolla 2020 | Online |
| driver2@wasalni.demo | +201200000101 | أحمد إبراهيم | Hyundai Verna 2018 | Online |
| driver3@wasalni.demo | +201200000102 | علي السيد | Chevrolet Lanos 2015 | Offline |

### Verified — Comfort (8 drivers, sample 2)

| Email | Phone | Name | Vehicle | Status |
|---|---|---|---|---|
| driver16@wasalni.demo | +201200000115 | حسن طاهر | Toyota Yaris 2022 | Online |
| driver17@wasalni.demo | +201200000116 | حسين متولي | Hyundai Elantra 2023 | Online |

### Verified — Family (5 drivers, sample 2)

| Email | Phone | Name | Vehicle | Status |
|---|---|---|---|---|
| driver24@wasalni.demo | +201200000123 | إبراهيم الباجوري | Toyota Avanza 2020 | Online |
| driver25@wasalni.demo | +201200000124 | يوسف المنوفي | Hyundai Tucson 2022 | Offline |

### ★ Verified — Tuk-Tuk (10 drivers — THE MOAT) — sample 3

| Email | Phone | Name | Vehicle | Status |
|---|---|---|---|---|
| driver29@wasalni.demo | +201200000128 | كريم سلامة | Bajaj RE Tuk-Tuk 2020 | Online |
| driver30@wasalni.demo | +201200000129 | طارق البنا | Bajaj RE Tuk-Tuk 2019 | Online |
| driver35@wasalni.demo | +201200000134 | رمضان فهمي | Bajaj RE Tuk-Tuk 2022 | Offline |

### ★ Verified — Motorcycle (5 drivers — THE MOAT) — sample 2

| Email | Phone | Name | Vehicle | Status |
|---|---|---|---|---|
| driver39@wasalni.demo | +201200000138 | شعبان الشاذلي | TVS Apache 2023 | Online |
| driver40@wasalni.demo | +201200000139 | عمرو حسن | TVS Apache 2022 | Offline |

---

## Passenger Accounts (80 total — sample shown)

| Email | Phone | Name | Gender | Wallet | Notes |
|---|---|---|---|---|---|
| passenger1@wasalni.demo | +201200000200 | محمد إبراهيم | Male | EGP 250 | Regular user, 30+ trips |
| passenger2@wasalni.demo | +201200000201 | أحمد السيد | Male | EGP 0 | Cash-only preference |
| passenger3@wasalni.demo | +201200000202 | فاطمة عبدالله | Female | EGP 500 | Uses female-driver-only mode |
| passenger4@wasalni.demo | +201200000203 | مريم محمد | Female | EGP 100 | Corporate account (Bagour Schools) |
| passenger5@wasalni.demo | +201200000204 | علي طاهر | Male | EGP 50 | New user, 1 trip |

---

## Suggested Demo Flow (10-minute live demo)

### 1. Passenger journey (3 min)
- Log in as `passenger3@wasalni.demo`.
- Open the app, point at the live map showing Bagour drivers.
- Tap "Where to?" and select "سوق الباجور المركزي".
- Show the ride type selector — **highlight Tuk-Tuk and Motorcycle**.
- Toggle "Female driver only".
- Confirm. Show real-time matching.

### 2. Driver journey (3 min)
- Log in as `driver29@wasalni.demo` (the Tuk-Tuk driver).
- Go online. Show the ride request appear with the 10s timer.
- Accept. Show the pickup nav.
- Mark arrived → start trip → complete trip.
- Show the earnings update on the driver dashboard.

### 3. Admin overview (3 min)
- Log in as `admin@wasalni.demo`.
- Show the live map with 20+ online drivers across all 5 vehicle types.
- Show "Today's Stats": trips, GMV, commission earned.
- Show driver KYC pending queue.
- Show financial reports → commission by ride type → **Tuk-Tuk represents 17% of revenue** (talking point: this is revenue Uber/Careem would miss entirely).

### 4. Real-time event (1 min)
- Trigger an SOS from the passenger app.
- Show it land in the admin emergency queue within 2 seconds.

---

## Resetting the Demo

```bash
cd backend
WASALNI_CITY=bagour npm run seed:bagour:fresh
```

This drops and re-seeds the database in ~30 seconds.

---

## Notes

- All phone numbers are in the +20120000XXXX range (fake but well-formed Egyptian mobile prefix).
- All photos use placeholder.co — no real PII.
- The seed script is idempotent unless `--fresh` is passed.
- Demo accounts skip phone OTP verification (OTP `1234` always works in mock mode).
