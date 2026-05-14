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
- `apps/passenger-web/.env.local.city`
- `apps/driver-web/.env.local.city`

Run:

```bash
./scripts/apply-city-config.sh tanta
```

Then restart the backend and rebuild the web apps.

The YAML structure is documented in `config/cities/bagour.yaml` (the reference).

---

## 4. Asset Replacement Workflow

### Step 1: Prepare Brand Assets
Place your files in `branding/<your-city>/`:

```
branding/tanta/
  logo.svg               # primary logo, 1024×1024
  logo-icon.svg          # square icon variant
  logo-icon-1024.png     # required for PWA install icons
  splash.png             # 1080×1920
  app-icon-512.png       # PWA maskable icon
  app-icon-1024.png      # PWA install icon
  favicon.ico            # admin dashboard
  fonts/                 # optional custom Arabic font
```

### Step 2: Run the Brand-Swap Script

```bash
./scripts/swap-brand-assets.sh tanta
```

This copies your assets to:
- `apps/passenger-web/public/branding/`
- `apps/driver-web/public/branding/`
- `admin-dashboard/public/branding/`
- `admin-dashboard/app/favicon.ico`

### Step 3: Rebuild

```bash
pnpm --filter=@wasalni/passenger-web build
pnpm --filter=@wasalni/driver-web build
cd admin-dashboard && pnpm build
cd ../backend && pnpm build
```

### Step 4: Verify
- Open each PWA in a browser and confirm icons + splash + colors are correct.
- Open admin dashboard and verify favicon + login banner.
- Send a test OTP and check brand name in the SMS body.

---

## 5. PWA / Web Listing

The web apps install via "Add to Home Screen" — no store review needed.
Make sure the PWA manifest is filled in for each app:

- `name`: "Wasalni Tanta - Tanta Rides"
- `short_name`: "Wasalni Tanta"
- `description`: A clear one-line value prop (≤ 80 chars).
- `theme_color`, `background_color`: from the brand kit.
- `icons[]`: includes 192/512 standard and 512 maskable.
- Open Graph / Twitter metadata for shared links.

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
2. Translate `packages/i18n/messages/` files (shared by passenger-web + driver-web).
3. Translate backend bilingual response strings.
4. Translate admin dashboard `lib/i18n/` JSON files.

Estimated effort: 2-3 days per additional language. Add-on price: EGP 25,000.
