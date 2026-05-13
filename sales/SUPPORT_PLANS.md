# Wasalni — Support Plans

Bundled with every license. Renewable annually. Tiers can be upgraded mid-contract.

| Plan | Bundled with | Duration | Response SLA | Includes | Renewal price |
|---|---|---|---|---|---|
| **Bronze** | Town Starter | 3 months | 48h | Bug fixes for issues caused by Wasalni code | EGP 25,000/yr |
| **Silver** | City Pro | 6 months | 24h | Bronze + minor enhancements | EGP 60,000/yr |
| **Gold** | Major City | 12 months | 4h | Silver + 1 major feature per quarter + 99.5% uptime SLA | EGP 120,000/yr |
| **Platinum** | Regional Hub, Governorate Master | 12-24 months | 1h business / 4h after-hours | Gold + dedicated engineer 25% time + on-call rotation | EGP 300,000/yr |

## What's a "Bug Fix"

A defect introduced by Wasalni code that causes:
- A documented feature to fail under standard usage.
- A security vulnerability.
- A regression after a Wasalni-released update.

**Not covered**: bugs introduced by the client's customizations, third-party
API outages (Google Maps quota exhaustion, Paymob downtime), or hosting issues
caused by client infra changes.

## What's a "Minor Enhancement"

Estimated ≤ 3 engineering days:
- Add a new field to a screen.
- Adjust a fare calculation rule.
- Add a column to an admin table.
- New report.
- New cron task.

## What's a "Major Feature"

Estimated 1-4 engineering weeks (only Gold+ plans):
- New screen flow.
- New integration (provider).
- Complex business logic.
- New analytics module.

Examples we've shipped: gap-features module (female-only mode, doc expiry, trip sharing tokens, corporate accounts), city configuration system, payment provider abstraction.

## Channels

- **Bronze**: Email (support@wasalni.app), 48h response.
- **Silver**: Email + WhatsApp business, 24h response.
- **Gold**: Email + WhatsApp + dedicated Slack channel, 4h response.
- **Platinum**: All channels + on-call phone, 1h response in business hours.

## Escalation Path

1. Open ticket via channel above.
2. Acknowledged within SLA.
3. Triaged: P0 (down) → P1 (broken feature) → P2 (degraded) → P3 (cosmetic / enhancement).
4. P0/P1 worked on continuously until resolved.
5. RCA (root cause analysis) sent to client within 5 business days of resolution.

## Off-SLA Hours
- Bronze: business hours only (Sun-Thu, 10:00-18:00 EET).
- Silver: business hours, weekend response next business day.
- Gold: 24/7 for P0/P1, business hours for P2/P3.
- Platinum: 24/7 for all severities, with a guarantee of a human acknowledgment.

## Things We Don't Do (Even at Platinum)
- Operate your business: customer support to your end users, driver-rider disputes, etc.
- Maintain hardware: VPS administration unless explicitly contracted (Variant B/C only).
- Develop new business modules outside the agreed scope without a change order.
- Provide legal / regulatory consulting beyond what's in [REGULATORY_GUIDE.md](./REGULATORY_GUIDE.md).
