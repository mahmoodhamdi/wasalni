# Wasalni — Competitive Positioning

How we stack up against the alternatives a city operator might consider.

---

## vs. Building From Scratch

| Factor | Build it yourself | License Wasalni |
|---|---|---|
| Timeline | 12-18 months | 7-14 days |
| Cost | EGP 1.5M-3M (team of 5 for 12 months) | EGP 150K-3.5M (one-time, tier-dependent) |
| Risk | High: ride-hailing has 100+ edge cases | Low: production-tested in Bagour |
| Tuk-Tuk + Motorcycle support | Build yourself | Already shipped |
| Egyptian payment integrations | 3-4 weeks each | Pre-integrated |
| Real-time driver matching | Tricky to get right | Battle-tested |
| Safety features (SOS, trip sharing) | Months of work | Available day one |
| Apps on Play / App Store | Submit, get rejected, iterate | We've handled all gotchas |
| White-label / multi-tenant | Re-architecture later | Built in |

**Verdict**: Build only if you already have a 5+ engineer team and 18 months runway. Otherwise license.

---

## vs. Uber / Careem Franchise

Uber and Careem **do not offer franchises** in secondary Egyptian cities.
Their operations only cover Cairo, Alexandria, and a few major hubs.

| Factor | Wait for Uber | License Wasalni |
|---|---|---|
| Availability in your city | Unlikely in next 3-5 years | Available now |
| Ownership | None — you're a passenger / driver | You own the platform |
| Commission | Uber takes 25-30% from driver | You take 18-20% |
| Brand recognition | Strong | You build it locally |
| Local relationships | Doesn't matter to them | You can leverage |
| Tuk-Tuk support | None planned | Core feature |

**Verdict**: This isn't a real choice. Uber isn't coming. License Wasalni.

---

## vs. Generic Ride-Hailing SaaS

There are SaaS providers (Jugnoo, Cabily, FleetX) that license ride-hailing
software internationally. How we compare:

| Factor | Generic SaaS | Wasalni |
|---|---|---|
| Pricing model | Per-trip / per-driver SaaS fee | One-time license |
| Vertical fit | Generic (city taxi focus) | Egyptian secondary cities |
| Tuk-Tuk + motorcycle | Usually missing | Core |
| Arabic UI + RTL | Often poorly localized | Native Arabic |
| Egyptian payment providers | Often missing | Pre-integrated |
| Cash workflow | Often clunky | First-class |
| Maps provider | Vendor-locked to Google | Pluggable (OSM/Google/Mapbox) |
| Source code | Not provided | Provided |
| White-label | Limited | Full |
| Support in Arabic | Often English-only | Native |
| Egyptian regulatory awareness | None | NTC, tax, e-invoicing |

**Verdict**: SaaS can work for English-speaking clients in metro cities. For secondary Egypt / MENA, Wasalni is far better positioned.

---

## vs. In-Drive / Indrive

Indrive operates in some MENA markets but is primarily passenger-driven
(passenger names their price). It works in metros but struggles in cities
where the driver-passenger relationship is more personal.

| Factor | Indrive | Wasalni |
|---|---|---|
| Pricing model | Passenger-quoted | Algorithmic + surge |
| Ownership | Indrive HQ | Local operator |
| Customization | None | Full |
| Tuk-Tuk + motorcycle | No | Yes |

**Verdict**: Not a real licensing competitor. They operate end-to-end.

---

## vs. Local Informal Taxi Cooperatives

Most Egyptian secondary cities have informal "موقف تاكسي" (taxi stations).
This is what you'll actually compete with day-to-day.

| Factor | Informal stations | Wasalni |
|---|---|---|
| Wait time for passenger | 5-30 min unpredictable | 3-8 min predictable |
| Price transparency | Negotiated case-by-case | Fixed up-front |
| Safety | Variable | SOS button, trip sharing, KYC |
| Female passenger comfort | Often poor | Female-driver-only mode |
| Payment | Cash only | Cash + digital |
| Receipts | Rare | Automatic |
| Lost-and-found | Difficult | App-based |

**Strategy**:
- Don't try to kill the stations — partner with them.
- Onboard the existing station drivers (they become both station drivers AND Wasalni drivers).
- Position as **"the digital layer over the local economy"** — non-threatening.

---

## What You Should Say in Sales Calls

> "Wasalni is the only ride-hailing platform built specifically for cities that
> Uber and Careem will never serve. We support Tuk-Tuks and motorcycles, which
> are 60-80% of trips in secondary cities. You buy the platform once. You own
> your city. You keep 80% of every fare. We deploy in 7 days. Our reference
> deployment in Bagour is processing 1,200+ trips per day with 95% rider
> satisfaction. Pick your tier and we start tomorrow."

---

## Common Objections + Responses

### "What if Uber comes to my city later?"
> "If they do, they'll take 5-7 years. By then you have:
>  - 50,000+ active users locked in with referral programs.
>  - 500+ drivers loyal to your brand.
>  - Deep local relationships with mosques, markets, schools.
>  - The data to optimize that Uber won't have.
>  Most local operators that lose to Uber are ones with no head start.
>  You'll have a 5-year head start."

### "What if Wasalni stops supporting the platform?"
> "You own the source code perpetually. Worst case: hire any Node.js + React
>  developer to maintain. No vendor lock-in. The maps, SMS, and payment
>  providers are all pluggable so you're not dependent on us either."

### "How do I know it actually works?"
> "We can demo the Bagour deployment live. You see real trips happening.
>  We can show admin dashboard analytics. We can connect you with the Bagour
>  operator. Trial period: 30-day money-back if pilot deployment fails to launch."

### "What about regulatory licensing?"
> "Egyptian NTC licensing is on the operator (you), not the platform. See our
>  [REGULATORY_GUIDE.md]. We help with the technical compliance pieces —
>  driver KYC workflow, vehicle inspection records, audit trails, e-invoicing
>  integration. The license itself is your interface with the government."

### "Can I customize freely?"
> "Yes within your license tier. Town Starter: branding only. City Pro: 3
>  custom features. Major City: 8 features. Higher tiers: unlimited (within
>  reason). The source code is yours; nothing stops you from doing more,
>  but you'd lose support eligibility for what you change."
