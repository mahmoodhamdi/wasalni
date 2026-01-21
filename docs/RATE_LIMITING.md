# Rate Limiting Documentation

This document describes the rate limiting configuration for the Wasalni API to protect against abuse and ensure fair usage.

## Overview

Rate limiting is implemented using `express-rate-limit` middleware. When limits are exceeded, the API returns a `429 Too Many Requests` response.

## Global Rate Limits

| Environment | Requests | Window | Description |
|------------|----------|--------|-------------|
| Development | 1000 | 15 minutes | Higher limit for testing |
| Production | 100 | 15 minutes | Standard API limit |

### Response Headers

All responses include rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `Retry-After` | Seconds until rate limit resets (only on 429) |

## Endpoint-Specific Limits

### Authentication Endpoints

#### OTP Sending (`/api/v1/auth/send-otp`)

| Limit | Window | Description |
|-------|--------|-------------|
| 5 | 1 hour | Prevents OTP spam/abuse |

**Rationale**: OTP sending involves SMS/Email costs and potential abuse vector.

#### Login/Verify (`/api/v1/auth/verify-otp`, `/api/v1/auth/login`)

| Limit | Window | Description |
|-------|--------|-------------|
| 10 | 15 minutes | Prevents brute force attacks |

**Rationale**: Protects against credential stuffing and brute force attacks.

#### Admin Login (`/api/v1/auth/admin/login`)

| Limit | Window | Description |
|-------|--------|-------------|
| 10 | 15 minutes | Same as user login |

**Rationale**: Admin accounts are high-value targets.

## Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "messageAr": "طلبات كثيرة جداً، يرجى المحاولة لاحقاً"
}
```

HTTP Status: `429 Too Many Requests`

## Implementation Details

### Storage

Rate limit counters are stored in memory by default. For production with multiple server instances, consider using Redis store:

```typescript
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### Key Generation

By default, rate limits are based on client IP address. For authenticated endpoints, consider using user ID:

```typescript
const userBasedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.userId || req.ip,
});
```

## Best Practices for Clients

1. **Implement exponential backoff**: When receiving 429, wait and retry with increasing delays
2. **Monitor rate limit headers**: Track remaining requests to avoid hitting limits
3. **Cache responses**: Reduce API calls by caching data client-side
4. **Batch requests**: Combine multiple operations when possible

### Example Retry Logic

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}
```

## Monitoring & Alerts

In production, monitor for:

- High 429 response rates (potential attack or misconfigured client)
- Sudden spikes in request volume
- Repeated rate limit violations from same IP

## Configuration

Rate limits can be adjusted via environment variables:

```env
# Disable rate limiting for load testing (NOT for production)
RATE_LIMIT_DISABLED=false

# Custom limits (if implemented)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Considerations

1. **IP Spoofing**: Behind a reverse proxy, configure `trust proxy` correctly
2. **Distributed Attacks**: Use Redis store for consistent limiting across instances
3. **Slowloris**: Combine with request timeout middleware
4. **Account Lockout**: For login endpoints, consider account-based lockout after repeated failures

## Related Documentation

- [API.md](./API.md) - Full API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
