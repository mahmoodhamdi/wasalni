# Wasalni Real-Time Events Catalog

Authoritative list of every Socket.io event flowing through the platform.
Source of truth for backend handlers, the passenger app, the driver app, and
the admin dashboard. Source code: `backend/src/sockets/trip.socket.ts`.

## Connection Model

| Concept | Identifier | Notes |
|---|---|---|
| User-personal room | `user:{userId}` | Joined automatically on connect. |
| Driver-personal room | `driver:{driverId}` | Joined for online drivers. |
| Trip room | `trip:{tripId}` | Both passenger and driver join once matched. |
| Drivers broadcast | `drivers:online` | Used for area-wide announcements. |
| Admin dashboard | `admin:dashboard` | Live monitoring. |
| Admin emergency | `admin:emergency` | SOS alert queue. |

Authentication: JWT in `socket.handshake.auth.token`. Role is decoded server-side
and used to join the appropriate rooms.

---

## Events: Client → Server

### `trip:accept`
- **Sender**: Driver app
- **Payload**: `{ tripId: string, driverId: string }`
- **Side effects**:
  - Calls `driverAccept(tripId, driverId)` (race-safe, first-write-wins via Mongo updateOne).
  - On success: emits `trip:accepted` to passenger, `trip:accept:success` back to driver, joins both to `trip:{tripId}`.
  - Sends push notification `driver_found` to passenger.
- **Failure modes**: trip taken / cancelled / expired → `trip:accept:failed`.

### `trip:reject`
- **Sender**: Driver app
- **Payload**: `{ tripId: string, driverId: string }`
- **Side effects**: Driver removed from candidate pool; matching engine moves to next candidate.
- **Ack**: `trip:reject:success` to the rejecting driver.

### `trip:driver:location`
- **Sender**: Driver app (every 5s while online, every 5s during active trip, every 30s while idle)
- **Payload**: `{ tripId, driverId, latitude, longitude, heading?, speed? }`
- **Side effects**:
  - Updates Redis GEO index (`location.service.ts`).
  - Broadcasts `trip:driver:location` to `trip:{tripId}` room.
- **Server-side throttle**: relayed at most 1/5s to passenger.

### `trip:status:update`
- **Sender**: Driver app
- **Payload**: `{ tripId, status, location? }`
- **Side effects**: Broadcasts `trip:status:updated` to `trip:{tripId}` room.

### `trip:cancel:passenger`
- **Sender**: Passenger app
- **Payload**: `{ tripId, passengerId, reason? }`
- **Side effects**: Emits `trip:cancelled` to driver + push notification `trip_cancelled_by_passenger`.

### `trip:cancel:driver`
- **Sender**: Driver app
- **Payload**: `{ tripId, driverId, reason? }`
- **Side effects**: Emits `trip:cancelled` to passenger + push notification `trip_cancelled_by_driver`.

### `trip:sos`
- **Sender**: Either passenger or driver
- **Payload**: `{ tripId, userId, userType: 'passenger' | 'driver', location: { lat, lng } }`
- **Side effects**:
  - Logs `SOS triggered` at warn level (immutable audit trail).
  - Emits `trip:sos:alert` to the other party.
  - Emits `trip:sos:emergency` to `admin:emergency` room.
  - Sends push notifications to **all** admins via `sendSOSAlert`.
  - SMS notifications to passenger's emergency contacts (via `sms.service` → SOSAlertParams flow).

### `trip:chat`
- **Sender**: Either party in trip
- **Payload**: `{ tripId, senderId, senderType, message }`
- **Side effects**: Broadcasts `trip:chat:message` to `trip:{tripId}` room.

### `trip:rate`
- **Sender**: Either party at trip completion
- **Payload**: `{ tripId, raterId, raterType, score, comment? }`
- **Side effects**: Emits `trip:rated` to the rated party; persists to Trip.rating subdocument.

---

## Events: Server → Client

### `trip:request`  (Server → Driver)
- **Triggered by**: `matching.service` emits `notify_driver` internal event.
- **Payload**: `TripRequestPayload`
  ```ts
  {
    tripId: string,
    tripNumber: string,
    pickup: { address, latitude, longitude },
    dropoff: { address, latitude, longitude },
    distance: number,        // meters
    rideType: 'economy'|'comfort'|'family'|'tuktuk'|'motorcycle',
    estimatedFare: { min, max },
    distanceToPickup: number,
    timeout: number          // 10-15 seconds
  }
  ```
- **Driver must respond within `timeout` seconds** with `trip:accept` or `trip:reject`.

### `trip:accepted`  (Server → Passenger)
- **Triggered by**: Driver accepts.
- **Payload**: `{ tripId, tripNumber, driver: { ... }, status }`

### `trip:accept:success`  (Server → Driver)
- **Triggered by**: Driver's `trip:accept` succeeded.
- **Payload**: `{ tripId, tripNumber, pickup, dropoff, passenger }`

### `trip:accept:failed`  (Server → Driver)
- **Triggered by**: Driver's `trip:accept` failed (taken by another driver, etc.).
- **Payload**: `{ tripId, message, messageAr }`

### `trip:driver:location`  (Server → Trip room)
- See client event. Relayed to passenger.

### `trip:status:updated`  (Server → Trip room)
- See client event.

### `trip:status:changed`  (Server → Trip room, via `emitTripStatusChange`)
- **Payload**: `{ tripId, tripNumber, status, updatedAt, ...additionalData }`

### `trip:driver_arriving` / `trip:driver_arrived` / `trip:trip_started` / `trip:trip_completed`
- Status-specific events emitted to passenger via `trip:${status}`.

### `trip:driver_arrived`  (Server → Passenger, via `emitDriverArrived`)
- **Payload**: `{ tripId, tripNumber, driver, message, messageAr }`

### `trip:completed`  (Server → both, via `emitTripCompleted`)
- **Payload to passenger**: `{ tripId, tripNumber, status, fare, driver, paymentMethod, paymentStatus }`
- **Payload to driver**: `{ tripId, tripNumber, status, fare, driverEarnings, passenger, paymentMethod, paymentStatus }`

### `trip:cancelled`  (Server → either party)
- **Payload**: `{ tripId, cancelledBy: 'passenger' | 'driver' | 'system', reason, reasonAr }`

### `trip:sos:alert`  (Server → other party in trip)
- **Payload**: `{ tripId, triggeredBy: 'passenger' | 'driver', location }`

### `trip:sos:emergency`  (Server → `admin:emergency` room)
- **Payload**: `{ tripId, tripNumber, triggeredBy, userId, location, timestamp }`

### `trip:chat:message`  (Server → Trip room)
- **Payload**: `{ tripId, senderId, senderType, message, sentAt }`

### `trip:rated`  (Server → rated party)
- **Payload**: `{ tripId, score, ratedBy }`

### `trip:no_drivers`  (Server → Passenger)
- **Triggered by**: Matching service finds zero candidates.
- **Payload**: `{ tripId, message, messageAr }`

### `trip:timeout`  (Server → Passenger)
- **Triggered by**: Matching service exhausted candidates without acceptance.
- **Payload**: `{ tripId, message, messageAr }`

---

## State-Machine Coverage

For each Trip status transition, the following events fire:

| From | To | Server → Passenger | Server → Driver | Server → Admin |
|---|---|---|---|---|
| - | `pending` | (REST response) | - | - |
| `pending` | `searching` | - | `trip:request` (broadcast to candidates) | dashboard counter |
| `searching` | `accepted` | `trip:accepted` | `trip:accept:success` | dashboard counter |
| `accepted` | `arriving` | `trip:status:changed` | (driver self) | dashboard |
| `arriving` | `arrived` | `trip:driver_arrived` | (driver self) | dashboard |
| `arrived` | `in_progress` | `trip:trip_started` | (driver self) | dashboard |
| `in_progress` | `completed` | `trip:completed` | `trip:completed` | dashboard |
| any active | `cancelled` | `trip:cancelled` | `trip:cancelled` | dashboard + alert if SOS |
| any active | `sos_triggered` | `trip:sos:alert` (the other) | `trip:sos:alert` (the other) | `trip:sos:emergency` |

---

## Throttling and Backpressure

- Driver location updates: server-side rate-limit to 1/5s per trip room.
- Chat messages: 1/sec per sender per trip.
- SOS: no throttle; always relayed.
- Trip request fan-out: matching service serializes — one driver at a time, 10-15s window each.

## Idempotency Guarantees

- `trip:accept` is race-safe via `Trip.findOneAndUpdate({status:'searching'}, {driver:..., status:'accepted'})`. Only one driver wins.
- Status transitions are validated server-side (no client-controlled jumps).
- SOS events are appended-only (audit log).

## Testing

Backend integration tests exercise the lifecycle in `src/__tests__/trip.test.ts`.
The passenger / driver web apps test socket flows via Vitest with a mocked
`@wasalni/socket-client` and Playwright end-to-end tests (see `apps/*/e2e/`).

Add new events here whenever you add an `io.on(...)`, `socket.on(...)`,
`socket.emit(...)`, or `emit*` helper in the backend.
