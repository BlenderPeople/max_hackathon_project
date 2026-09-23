# Frontend API integration

The UI uses only `api/client.ts` through TanStack Query hooks from
`api/hooks.ts`. Product components do not call `fetch`.

## Modes

- Default: in-memory contract mocks from `mockData.ts`.
- `VITE_API_MODE=real`: requests go through the shared `api/http.ts` boundary.

The real mode now uses MAX `initData` to create a short backend session and
passes it as a bearer token. File upload and download use this session too;
the app downloads via an authenticated blob request, not a bare URL. Keep
mocks as the default until the team verifies the full flow inside MAX.

## Responses required from the backend

- `ServiceDetails` for the service screen and create-order entry point.
- `OrderSummary[]` for order filters.
- `OrderDetails` for the shared customer/master order screen.
- `BusinessProfile` for the profile and service list.

`OrderDetails.available_actions` is authoritative. The UI does not derive
permissions from a user role. Routes use `public_token`; no parallel public id
is introduced by the UI.

## Inputs required from the backend

- `CreateOrderInput`
- `UpdateOrderInput`
- `RecordPaymentInput`
- approval decision `{ approved: boolean }`

## Profile, services and booking additions

The mock adapter now defines the expected next integration slice:

- `PATCH /api/businesses/me` accepts `UpdateBusinessProfileInput` and returns
  `BusinessProfile`.
- `POST /api/services` and `PATCH /api/services/{public_token}` accept
  `CreateServiceInput` and return `ServiceDetails`.
- `GET /api/businesses/me/schedule` returns `ScheduleView`.
- `PUT /api/businesses/me/schedule` accepts `AvailabilitySchedule` and returns
  `ScheduleView`.
- `GET /api/services/{public_token}/availability?date=YYYY-MM-DD` returns
  `AvailableSlot[]` after weekly hours, date overrides, past time and bookings
  are applied.

`slot_duration_minutes` is the grid step between possible start times.
`Service.duration_minutes` is the actual occupied duration. For example, a
120-minute service with a 30-minute grid may start at 10:00 or 10:30 and
blocks its complete interval. The backend must reject overlapping bookings
even if the frontend previously received the slot as free.

`CreateOrderInput.scheduled_start_at` and `scheduled_end_at` contain the
selected interval. Order creation and slot occupation are one atomic backend
operation. Existing order status values and transitions remain unchanged.

When Sergey publishes final OpenAPI examples, map them inside `api/client.ts`
if their transport shape differs. Screens and visual components should not
need changes.
