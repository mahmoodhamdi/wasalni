# Wasalni Sales Package

This folder contains everything you need to sell Wasalni as a white-label
ride-hailing platform.

## Quick Tour

| Doc | Audience | When to use |
|---|---|---|
| [SALES_PITCH.md](./SALES_PITCH.md) | First contact (AR + EN) | Lead-gen, cold outreach |
| [CITY_LICENSE_TIERS.md](./CITY_LICENSE_TIERS.md) | Operator prospects | Pricing conversation |
| [DEPLOYMENT_VARIANTS.md](./DEPLOYMENT_VARIANTS.md) | Operator's technical lead | Pre-sales technical |
| [BRANDING_KIT_GUIDE.md](./BRANDING_KIT_GUIDE.md) | Operator's marketing lead | Pre-launch customization |
| [CITY_LAUNCH_PLAYBOOK.md](./CITY_LAUNCH_PLAYBOOK.md) | Operator's project manager | Launch planning |
| [SUPPORT_PLANS.md](./SUPPORT_PLANS.md) | Operator decision-maker | Contract negotiation |
| [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md) | Both sides | Deployment day |
| [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md) | Sales rep | Objection handling |
| [REGULATORY_GUIDE.md](./REGULATORY_GUIDE.md) | Operator's legal team | Compliance prep |
| [DEMO_ACCOUNTS.md](./DEMO_ACCOUNTS.md) | Sales rep | Live demo |
| [INVESTOR_DECK_OUTLINE.md](./INVESTOR_DECK_OUTLINE.md) | Investors (not operators) | Fundraising |

## Sales Call Sequence

1. **Discovery call** (30 min)
   - Open with SALES_PITCH.md narrative.
   - Identify city, population, budget, tech team.
   - End with: "Want to see the Bagour reference deployment live?"

2. **Demo call** (45 min)
   - Use DEMO_ACCOUNTS.md flow.
   - Show all three apps.
   - Highlight Tuk-Tuk + Motorcycle in passenger flow.
   - Show admin financial reports.

3. **Technical fit call** (45 min)
   - Walk through DEPLOYMENT_VARIANTS.md.
   - Discuss hosting choice.
   - Review REGULATORY_GUIDE.md for their country.

4. **Pricing call** (30 min)
   - Walk through CITY_LICENSE_TIERS.md.
   - Pick a tier together based on city profile.
   - Discuss add-ons.
   - Send proposal within 24h.

5. **Contract & handover**
   - Contract signed → 50% deposit.
   - Apply HANDOVER_CHECKLIST.md.
   - Launch in 7-14 days per tier.

## Key Talking Points (Always Lead With These)

1. **"Uber will never come to your city. Wasalni is built for the cities Uber forgot."**
2. **"We support Tuk-Tuks and motorcycles. They're 60-80% of trips in your market."**
3. **"You own the platform forever. No SaaS fees. Pay once."**
4. **"Bagour reference deployment processes 1,200+ trips per day. You can talk to that operator."**
5. **"7 days from contract to launch."**

## Common Discovery Questions

- "How many people live in your city?" (Tier selection)
- "Do you have a technical team or co-founder?" (Variant selection)
- "What's your driver recruitment plan?" (Launch playbook fit)
- "How important is digital payments vs cash?" (Provider config)
- "Have you tried to start this with another platform?" (Competitive understanding)

## What's NOT in This Folder

- The technical product docs (see `docs/`).
- The platform source code (the repo itself).
- Marketing media files (logos, videos — separate `marketing/` folder, gitignored if large).

## Maintenance

When the platform gains new features, update:
- CITY_LICENSE_TIERS.md (if pricing changes).
- DEPLOYMENT_VARIANTS.md (if infra changes).
- COMPETITIVE_POSITIONING.md (if a new competitor emerges).
- DEMO_ACCOUNTS.md (whenever the seed script changes).

When the platform loses a feature: archive, don't delete — sales materials are sticky.
