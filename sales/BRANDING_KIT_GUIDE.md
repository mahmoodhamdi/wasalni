# Wasalni — Branding Kit Guide

This guide explains how a city operator customizes the Wasalni stack with
their own brand. It covers what's configurable, what tools to use, and
how the white-label pipeline ties it all together.

---

## 1. Brand Identity Decisions

Before customizing, decide:

- **Brand name** (EN + AR). Examples:
  - "وصّلني طنطا" / "Wasalni Tanta"
  - "أوصلني" / "Awsalni"
  - "ركّاب" / "Rakkab"
- **Tagline** (EN + AR). Keep it short (≤6 words). Examples:
  - "Your city. Your ride."
  - "مدينتك أقرب لك"
- **Primary color**: Used for buttons, headers, branded surfaces.
- **Accent color**: Used for highlights, badges.
- **Logo**: Square SVG, 1024×1024 PNG (Play Store), 512×512 (icon).
- **Splash image**: 1080×1920 PNG (mobile).
- **Support phone & email**: For the in-app help link.

---

## 2. Customizable Surfaces

Everything below is changeable per deployment:

### Backend
- Brand name in API responses (`message` / `messageAr` fields).
- Support phone / email in OTP messages, password resets, ride share SMS.
- Email templates (Resend or SMTP) — HTML and plain text.

### Admin Dashboard
- Logo in sidebar (`public/logo.svg`).
- Color scheme via Tailwind theme + CSS variables.
- Favicon.
- Browser tab title.
- Login page banner.

### Passenger App
- App icon + name on home screen.
- Splash screen.
- Theme colors (`lib/config/theme.dart`).
- About / Help / Terms screens.

### Driver App
- App icon + name.
- Splash screen.
- Theme colors.
- About / Help / Onboarding videos (replaceable).

---

## 3. The White-Label Pipeline

The repo includes `scripts/apply-city-config.sh` which reads
`config/cities/<your-city>.yaml` and writes generated artifacts to:

- `backend/.env.local.city`
- `admin-dashboard/.env.local.city`
- `passenger-app/lib/config/city.local.dart`
- `driver-app/lib/config/city.local.dart`

Run:

```bash
./scripts/apply-city-config.sh tanta
```

Then restart the backend and rebuild the apps.

The YAML structure is documented in `config/cities/bagour.yaml` (the reference).

---

## 4. Asset Replacement Workflow

### Step 1: Prepare Brand Assets
Place your files in `branding/<your-city>/`:

```
branding/tanta/
  logo.svg               # primary logo, 1024×1024
  logo-icon.svg          # square icon variant
  logo-icon-1024.png     # required for stores
  splash.png             # 1080×1920
  app-icon-512.png       # Android adaptive icon
  app-icon-1024.png      # iOS app icon
  favicon.ico            # admin dashboard
  fonts/                 # optional custom Arabic font
```

### Step 2: Run the Brand-Swap Script

```bash
./scripts/swap-brand-assets.sh tanta
```

This copies your assets to:
- `passenger-app/assets/branding/` + updates `pubspec.yaml`
- `driver-app/assets/branding/` + updates `pubspec.yaml`
- `admin-dashboard/public/branding/`
- `admin-dashboard/app/favicon.ico`

### Step 3: Rebuild

```bash
cd passenger-app && flutter clean && flutter build apk --release
cd ../driver-app && flutter clean && flutter build apk --release
cd ../admin-dashboard && npm run build
cd ../backend && npm run build
```

### Step 4: Verify
- Run the apps in a simulator and confirm icons + splash + colors are correct.
- Open admin dashboard and verify favicon + login banner.
- Send a test OTP and check brand name in the SMS body.

---

## 5. App Store Listings

Each app needs separate metadata per platform:

### Google Play Store
- Title (50 chars): "Wasalni Tanta - Tanta Rides"
- Short description (80 chars): A clear one-line value prop.
- Long description (4000 chars): Use [PLAY_STORE_TEMPLATE.md](./PLAY_STORE_TEMPLATE.md).
- Screenshots: 8 per app per language (16 total per app).
- Feature graphic: 1024×500 banner.

### App Store (iOS)
- Title (30 chars): "Wasalni Tanta"
- Subtitle (30 chars): "City rides made easy"
- Description: Same content as Play, formatted.
- Screenshots: 5-10 per device size.
- Promo text: 170 chars.

---

## 6. Brand Compliance Rules

When operating under license:

- **DO** mention "Powered by Wasalni" in the app footer or about screen (small text is fine).
- **DO NOT** modify the underlying API contracts in ways that break SDK compatibility — you'll lose support eligibility.
- **DO NOT** use the original Wasalni logo without permission.
- **DO** report security issues to security@wasalni.app.
- **DO NOT** sub-license to third parties (unless you're on Regional Hub+ tier).

---

## 7. Multi-Language Beyond Arabic + English

For Berber, French, or other languages (e.g. Morocco, Algeria, Tunisia):

1. Add the language code to `config/cities/<city>.yaml` under `locale.supported`.
2. Translate `passenger-app/lib/l10n/` and `driver-app/lib/l10n/` ARB files.
3. Translate backend bilingual response strings.
4. Translate admin dashboard `lib/i18n/` JSON files.

Estimated effort: 2-3 days per additional language. Add-on price: EGP 25,000.
