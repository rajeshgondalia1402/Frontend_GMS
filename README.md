# GaragePro — Garage Management SaaS (Frontend)

A mobile-first Garage Management SaaS frontend built with React, TypeScript and
Tailwind CSS. It talks to the **Node.js API** in
`D:\Arti\Project\GarageManagementSystem\NodeJS_API`.

**Authentication, Customers, Vehicles, Staff, Job Cards, Payments and the
Dashboard are wired to the real API** — registration, OTP verification, login,
the garage profile, change password and forgot password, plus the modules the
desk works in all day, the money taken against a card, and every figure at the
top of the dashboard. Billing, Salary, Reports and the whole Platform Admin
panel still render mock data; those are integrated one at a time.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (dev/build tooling, dev API proxy)
- **Tailwind CSS** (design system)
- **React Router v6** (routing + route guards)
- **React Hook Form** (forms & validation)
- **Lucide React** (icons)

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

Open the printed local URL (default `http://localhost:5173`).

Start the Node.js API separately (default `http://localhost:5000`) — the login
screen needs it.

## Environment Configuration

Copy `.env.example` to `.env` (a working `.env` is already committed) and adjust
if needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Prefix added to every API call. |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Where the dev server forwards `/api`. Dev only. |

The backend has **no CORS middleware**, so a browser cannot call
`http://localhost:5000` directly from `http://localhost:5173`. The dev server
therefore proxies `/api` → the API (see `vite.config.ts`), keeping every request
same-origin. To bypass the proxy and call the API directly instead, set
`VITE_API_BASE_URL=http://localhost:5000/api` and enable CORS on the backend.

## API Integration

### Layers

```
src/config/env.ts             API base URL
src/services/httpClient.ts    fetch wrapper — envelope unwrapping, bearer token, ApiError
src/services/*Service.ts      endpoint calls, one service per module
src/context/AuthContext.tsx   session state, persistence, auto-logout
src/routes/ProtectedRoute.tsx route guards
src/types/*.ts                request / response types mirroring the API
```

`httpClient` unwraps the API's `{ success, message, data }` envelope: it returns
`data` on success and throws an `ApiError` otherwise, so callers never inspect
the envelope themselves. It also attaches `Authorization: Bearer <token>`
automatically to authenticated requests.

`ApiError` carries:

| Property | Use |
| --- | --- |
| `message` | the API's own message — shown to the user verbatim |
| `status` | HTTP status, for routing decisions (`404` → back to step 1) |
| `fieldErrors` | the `errors` array from a `400 Validation failed.` |
| `isNetworkError` | true when the request never reached the server |

A request that never reaches the server, or a `5xx` with no JSON body, is
reported as *"Unable to reach the server…"* rather than a bare status code —
during development that usually means the API is not running.

**Every endpoint is called through this layer.** No page calls `fetch` directly.

### Endpoints at a Glance

| Endpoint | Auth | Called from |
| --- | --- | --- |
| `POST /auth/login` | — | `/login`, and after registration |
| `POST /auth/generate-otp` | — | `/verify-otp` on load and on resend |
| `POST /auth/verify-otp` | — | `/verify-otp` when the code is entered |
| `POST /auth/register` | — | `/verify-otp`, on **Done** |
| `POST /auth/forgot-password` | — | `/forgot-password`, and `/reset-password` on resend |
| `POST /auth/reset-password` | — | `/reset-password` |
| `POST /auth/change-password` | token | Change Password dialog |
| `GET /auth/me` | token | `/app/profile` on mount |
| `POST /auth/customer` | token | `/app/customers/new` |
| `GET /auth/customer` | token | `/app/customers` — list, search and stat cards |
| `PUT /auth/customer/:id` | token | Edit Customer dialog |
| `POST /auth/vehicle` | token | Add Vehicle, on the customer |
| `GET /auth/vehicle` | token | `/app/vehicles` — list, search and the fleet count |
| `PUT /auth/vehicle/:id` | token | Edit Vehicle, on the customer |
| `POST /auth/staff` | token | Add Staff dialog |
| `GET /auth/staff` | token | `/app/staff` — list, filters and order |
| `GET /auth/jobcard/job-number` | token | `/app/job-cards/new` as it opens |
| `GET /auth/jobcard/customer-search` | token | The job card's customer type-ahead |
| `POST /auth/jobcard` | token | `/app/job-cards/new`, on save |
| `GET /auth/jobcard` | token | `/app/job-cards` — list, search and order |
| `GET /auth/jobcard/:id` | token | Job card details, and the edit form |
| `PUT /auth/jobcard/:id` | token | Job card edit, and Update Status |
| `GET /auth/payment/job-card/:id` | token | The payment screen, and the invoice |
| `POST /auth/payment` | token | Record Payment dialog |
| `PUT /auth/payment/:id` | token | Correcting a receipt |
| `DELETE /auth/payment/:id` | token | Cancelling a receipt |
| `GET /auth/car-selling` | token | `/app/car-selling` — list, search, order and the count |
| `POST /auth/car-selling` | token | `/app/car-selling/new`, on save |
| `GET /auth/car-selling/:id` | token | The car details modal, the edit form, and the car picked on a sale |
| `PUT /auth/car-selling/:id` | token | `/app/car-selling/:id/edit`, on save |
| `DELETE /auth/car-selling/:id` | token | Delete Car confirmation |
| `GET /auth/car-selling/dropdown` | token | The car picker on `/app/car-sold/new` |
| `GET /auth/car-selling/sold` | token | `/app/car-sold` — list, search, order and the count |
| `POST /auth/car-selling/:id/sold-customer` | token | `/app/car-sold/new`, on save |
| `GET /auth/car-selling/sold-customer/:id` | token | `/app/car-sold/:id/edit` opened from its address, and the Receipt PDF |
| `POST /auth/car-selling/sold-customer/:id` | token | `/app/car-sold/:id/edit`, on save |
| `POST /auth/car-selling/sold-customer/:id/payment` | token | Collect Payment dialog |
| `POST /auth/car-selling/sold-customer/:id/payment/:paymentId` | token | Edit Payment dialog |
| `GET /auth/dashboard/summary` | token | `/app` — every tile at the top |
| `POST /admin/login` | — | `/admin/login` |
| `POST /admin/change-password` | admin token | Admin change-password dialog |

The admin endpoints take a **separate** token: the platform admin signs in at
`/admin/login` and its bearer is stored apart from the garage owner's, so an
admin request is never sent the owner's token or the other way round.

### `POST /api/auth/login`

Request:

```json
{ "mobileNumber": "7359458813", "password": "Password123" }
```

`200 OK`:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
    "expiresIn": "30d",
    "expiresAt": "2026-09-13T10:15:30.000Z",
    "user": {
      "id": "0f1a6c1e-7f4b-4a5e-9d1c-2b3a4c5d6e7f",
      "ownerName": "John Doe",
      "mobileNumber": "7359458813",
      "garageName": "John Auto Garage",
      "city": "Ahmedabad",
      "email": "john@example.com"
    },
    "subscription": {
      "planID": 1,
      "plan": "FREE_TRIAL",
      "price": 0,
      "status": "ACTIVE",
      "startDate": "2026-08-14T10:15:30.000Z",
      "endDate": "2026-09-13T10:15:30.000Z"
    }
  }
}
```

`401 Unauthorized`:

```json
{ "success": false, "message": "Invalid mobile number or password." }
```

The API returns the **same message** for an unknown mobile number and a wrong
password on purpose, so the endpoint cannot be used to discover which numbers
are registered. The UI shows that message verbatim — do not make it more
specific.

### `GET /api/auth/me`

Protected — `httpClient` attaches `Authorization: Bearer <token>` automatically.
Called by the Garage Profile page on mount.

```json
{
  "success": true,
  "message": "Profile fetched.",
  "data": {
    "user": {
      "id": "0f1a6c1e-7f4b-4a5e-9d1c-2b3a4c5d6e7f",
      "ownerName": "John Doe",
      "mobileNumber": "7359458813",
      "garageName": "John Auto Garage",
      "city": "Ahmedabad",
      "workingDays": "Mon - Sat",
      "workingHours": "9:00 AM - 9:00 PM",
      "email": "john@example.com",
      "address": "Satellite Road, Ahmedabad",
      "logo": null,
      "gstNo": "24ABCDE1234F1Z5"
    },
    "subscription": { "planID": 1, "plan": "FREE_TRIAL", "...": "..." }
  }
}
```

This returns **more** than the login response — `workingDays`, `workingHours`,
`address`, `logo` and `gstNo` only come from here. Any of them can be `null`.

### `POST /api/auth/generate-otp` · `POST /api/auth/verify-otp`

```json
{ "mobileNumber": "9723657967" }
{ "mobileNumber": "9723657967", "otp": "789012" }
```

A fresh 6-digit code is created, stored and sent by SMS on every call, valid for
10 minutes and never returned in the response. Verification always checks the
newest code, so calling `generate-otp` again simply invalidates the previous
one. `generate-otp` returns **409** when the number is already registered;
`verify-otp` returns **400** with `{ "verified": false }` for an invalid,
expired or missing code.

### `POST /api/auth/register`

```json
{
  "ownerName": "John Doe",
  "mobileNumber": "7359458813",
  "password": "Password123",
  "garageName": "John Auto Garage",
  "city": "Ahmedabad",
  "email": "john@example.com"
}
```

`email` is the only optional field. Returns `{ user, subscription }` — **no
token**. Failure modes: **400** `Mobile number is not verified. Please verify
the OTP first.`, **400** `Validation failed.` with a per-field `errors` array,
**409** `Mobile number is already registered.`, **500** `Something went wrong.`

`ApiError.fieldErrors` carries that `errors` array so a form can map each
message onto the field it belongs to.

### `POST /api/auth/change-password` (protected)

```json
{ "currentPassword": "Password123", "newPassword": "NewPassword456" }
```

The account is identified by the **bearer token**, never by the body. Returns
`{ id, mobileNumber, passwordChangedAt }` on success.

| Failure | Response |
| --- | --- |
| `newPassword` shorter than 6 (or over 72) | **400** validation error |
| `newPassword` same as `currentPassword` | **400** validation error |
| `currentPassword` does not match | **401** `Current password is incorrect.` |

Tokens are stateless, so the old one keeps working until it expires. The
frontend therefore signs the user out and sends them to `/login` after a
successful change.

### `POST /api/auth/forgot-password` · `POST /api/auth/reset-password`

```json
{ "mobileNumber": "7359458813" }
{ "mobileNumber": "7359458813", "otp": "789012", "newPassword": "NewPassword456" }
```

Neither needs a token — the OTP is the proof. `forgot-password` sends a code to
a number that is **already registered** and returns **404**
`Mobile number is not registered. Please register first.` when it is not.
Calling it again is "Send OTP again"; the new code replaces the old.

`reset-password` returns **400** for an unusable code or a password that has not
changed:

| Message | When |
| --- | --- |
| `Invalid OTP.` | the code does not match |
| `OTP has expired. Please generate a new OTP.` | older than 10 minutes |
| `This OTP has already been used. Please generate a new OTP.` | that code already reset a password |
| `No OTP found for this mobile number. Please generate a new OTP.` | step 1 was never called |
| `New password must be different from the current password.` | same password as before |

### Rejected Tokens

A `401` on a request that actually **sent** a token normally means the server
rejected it (expired early, revoked). `httpClient` reports those to a handler
that `AuthProvider` registers, which signs the user out immediately — the server
is trusted over the local clock.

Two cases opt out, because their `401` reports a credential the user just typed
rather than a dead token:

- `/auth/login` — sends no token at all (`auth: false`).
- `/auth/change-password` — sends `signOutOn401: false`, so a wrong current
  password shows an inline error instead of throwing the user out of the app.

## Registration Flow

Registration is three API calls stitched together, because the API will not
create an account until the mobile number has been OTP-verified:

```
/register            Create Account -> payload parked in sessionStorage
   |
/verify-otp          on load        -> POST /auth/generate-otp
   (code entry)      Send OTP again -> POST /auth/generate-otp
                     code entered   -> POST /auth/verify-otp
   |
/verify-otp          "Mobile Number Verified" confirmation
   (confirmation)    Done           -> POST /auth/register  (parked payload)
                                    -> POST /auth/login     (parked password)
   |
/app                 signed in, dashboard
```

The screen has **two panels**. Verification stops at the confirmation — no
account exists yet — and **Done** is what creates it and starts the session.

**Create Account does not call the API.** It validates, parks the payload via
`src/lib/pendingRegistration.ts`, and routes to `/verify-otp`.

That store uses `sessionStorage`, not `localStorage`: it holds a plaintext
password, so it must not outlive the tab. It is cleared the moment registration
completes or fails unrecoverably, and an entry older than 15 minutes (the API's
10-minute OTP validity plus slack) is treated as abandoned. Opening
`/verify-otp` with nothing parked redirects to `/register` without sending an
SMS.

Registration returns **no token**, so the parked password is replayed against
`/auth/login` to start the session — the user lands on the dashboard already
signed in, never seeing the login screen.

### Code entry panel

- The first code is sent on mount, guarded by a ref so React StrictMode's
  double-invoked effect cannot cost a second SMS.
- **Send OTP again** calls `generate-otp` again after a 60-second cooldown; the
  new code replaces the old one server-side.
- Entering the sixth digit auto-submits; the **Verify** button stays for
  explicit use.
- A rejected code (invalid / expired / none found) clears the boxes and shows
  the API's message.

### Confirmation panel

Shown once `verify-otp` succeeds: a green check, *Mobile Number Verified*, the
verified number, and a summary of the garage about to be created.

- **Done** runs `register` then `login`, reporting which call is in flight —
  *Creating your account… → Signing you in…* — and lands on the dashboard
  already signed in.
- `markPendingVerified()` records the verified state in the parked entry, so a
  refresh here keeps the confirmation instead of dropping back to code entry
  and burning another SMS.
- A recoverable failure (e.g. `500`) shows the message and leaves **Done** to
  retry. `409` and `400 Validation failed.` send the user back to `/register`
  with the per-field messages applied to the form — those can only be fixed
  there.

## Forgot Password Flow

```
/login            "Forgot Password?"
   |
/forgot-password  mobile number -> POST /auth/forgot-password
                                -> number parked in sessionStorage with sentAt
   |
/reset-password   code + new password -> POST /auth/reset-password
                  Send OTP again      -> POST /auth/forgot-password
   |
/login            sign in with the new password
```

Unlike registration, **step 1 is what sends the code**, so the reset screen does
not send one on mount. `src/lib/pendingPasswordReset.ts` parks the mobile number
together with `sentAt`, and the reset screen derives both countdowns from the
elapsed time — so a refresh resumes the timers where they were instead of
restarting them or firing another SMS. Landing on `/reset-password` with nothing
parked redirects to `/forgot-password`.

Failures route to whichever screen can fix them: a **404** from either endpoint
sends the user back to step 1 with the message and their number prefilled;
everything else shows inline. An OTP-related message clears the code boxes and
keeps the typed passwords, while a rejected password keeps the code — retyping
the other half would not help.

## Form Validation

Rules live in `src/lib/validation.ts` and are shared by every auth form; max
lengths mirror the Zod schemas in the API's `auth.validation.js`.

| Field | Rules |
| --- | --- |
| `mobileNumber` | Required · exactly **10 digits** · letters and symbols rejected |
| `password` | Required · **6–24 characters** |
| `ownerName` | Required · at most 100 characters |
| `garageName` | Required · at most 150 characters |
| `city` | Required · at most 100 characters |
| `email` | **Optional** · valid address, at most 150 characters, when filled |
| `otp` | Exactly 6 digits |

The mobile input normalises what is typed or pasted: non-digits are stripped and
a leading country code (`+91`) or trunk `0` is dropped rather than eating the
first digits of the real number, so `+91 73594 58813` becomes `7359458813`.
Validation runs on blur and again on submit.

Empty optional fields are **omitted from the payload** rather than sent as `""`,
which the API's `.optional()` email rule would reject.

## Session & Auto-Logout

`AuthProvider` (`src/context/AuthContext.tsx`) owns the session:

- On successful login it stores `token`, `expiresIn`, `expiresAt`, `user` and
  `subscription` in `localStorage` under `gms.auth.session`.
- The session is restored on refresh, so the user stays signed in.
- A timer scheduled from `expiresAt` signs the user out the moment the token
  expires — after the 30 days the API grants. Because `setTimeout` silently
  truncates delays above ~24.8 days, the wait is split into safe chunks and
  re-armed until the deadline is actually reached.
- A stored session already past `expiresAt` is discarded on load, and the expiry
  is re-checked whenever the tab regains focus — a sleeping tab can miss its
  timer.
- A `storage` listener keeps other tabs of the same browser in sync, so logging
  out in one tab logs out the rest.
- An automatic sign-out returns the user to `/login` with
  *"Your session has expired. Please sign in again."*

### Client-side Storage

Three keys, and the choice of store is deliberate in each case:

| Key | Store | Holds | Cleared |
| --- | --- | --- | --- |
| `gms.auth.session` | `localStorage` | token, `expiresIn`, `expiresAt`, user, subscription | logout, token expiry, or a rejected token |
| `gms.auth.pendingRegistration` | `sessionStorage` | the registration payload + `verified` flag | registration completes, or 15 min |
| `gms.auth.pendingPasswordReset` | `sessionStorage` | mobile number + `sentAt` | reset completes, or 15 min |

The session is in `localStorage` so it survives a browser restart. The two
pending stores use `sessionStorage` instead — `pendingRegistration` holds a
plaintext password and must not outlive the tab — and both carry a 15-minute
TTL, slightly longer than the API's 10-minute OTP validity, so an abandoned
attempt cannot be resumed later.

Anything malformed, expired, or past its TTL is discarded on read rather than
trusted.

### Route Guards

`src/routes/ProtectedRoute.tsx` provides two guards:

- **`ProtectedRoute`** — wraps `/app/*`. Without a valid session it redirects to
  `/login` and remembers the attempted URL, which the user is returned to after
  signing in.
- **`PublicOnlyRoute`** — wraps the auth screens. An already signed-in user
  visiting `/login` is sent to `/app`.

## The Signed-in Experience

### Where the Account Data Appears

After login the owner's details come from the session, not from mock data:

- **Dashboard** (`src/pages/owner/Dashboard.tsx`) — greeting with `ownerName`,
  `garageName` as the page heading, and an avatar showing the **first letter of
  the owner's name**, with the plan the garage is on beside it rather than as a
  band of its own underneath.
- **Topbar** (`src/components/layout/Topbar.tsx`) — the same initial, the
  owner's first name, and a dropdown showing owner + garage name. **Profile**
  goes to `/app/profile`, **Change Password** opens the dialog below, and
  **Logout** clears the session and returns to `/login`.
- **Garage Profile** (`src/pages/owner/GarageProfile.tsx`) — fetches
  `GET /auth/me` on mount and fills every field: garage name, owner name, mobile
  number, email, city, GST number, address, working days and hours, plus the
  logo (falling back to the garage's initial). Fields are seeded from the login
  session first, so nothing flashes empty while the request is in flight, and
  the response is written back into the session via `syncProfile` so the topbar,
  dashboard and subscription pill pick up any newer values. Mobile number is
  read-only — it is the login identifier. A failed load shows an `ErrorState`
  with **Retry**.

  **Save Changes is still a mock submission** — the API has no profile-update
  endpoint yet.

### Subscription Display

`src/lib/subscription.ts` derives one view from the `subscription` object in the
login response. Every number comes from the `startDate` / `endDate` the API
stored when the account was registered — **nothing assumes a 30-day plan**, so a
7-day, 30-day or 365-day plan all report correctly.

| Field | Derived from |
| --- | --- |
| `daysRemaining` | today → `endDate` |
| `totalDays` | `startDate` → `endDate` |
| `daysUsed` / `progress` | `totalDays - daysRemaining` |
| `planLabel` | `plan`, title-cased (`FREE_TRIAL` → `Free Trial`) |
| `endDateLabel` / `startDateLabel` | formatted as `13 Sep 2026` |

| Condition | State | Colour |
| --- | --- | --- |
| `FREE_TRIAL`, more than 7 days left | trial | sky |
| Paid plan, more than 7 days left | active | emerald |
| 7 days or fewer left | expiring | amber |
| Status not `ACTIVE`, or past `endDate` | expired | red |

**Days are counted in calendar days, not elapsed milliseconds.** `daysBetween`
compares local midnights, so the count drops by one at midnight rather than at
whatever time of day the account happened to be created. Counting raw elapsed
time and rounding up instead makes the number sit at its starting value for a
full day after registration — which reads as "every user shows 30 days". The
`Math.round` in `daysBetween` absorbs the 23- and 25-hour days that
daylight-saving changes produce.

Dates are formatted by hand rather than with `toLocaleDateString`, whose short
month name varies with the browser's ICU build (`Sep` vs `Sept`).

Two components read the view, so they can never disagree:

- **`SubscriptionBanner`** beside the garage name on the dashboard — plan name,
  days remaining, the end date, and a progress bar showing the elapsed share of
  the plan (*Day 6 of 30*). Every string is data-driven; the expiring and
  expired states name the actual plan instead of always saying "trial".
- **`SubscriptionPill`** (`src/components/layout/SubscriptionPill.tsx`) in the
  topbar — the same palette and icons in a compact badge showing the plan and
  days remaining (e.g. *Free Trial · 25 days remaining*), collapsing to just the
  day count on mobile. It links to `/app/subscription` and replaces the old
  notifications bell. It renders nothing when the session has no subscription,
  so the admin panel is unaffected.

Both use `formatDayCount` so a single day never reads "1 days".

### Change Password

`src/components/layout/ChangePasswordModal.tsx`, opened from **Change Password**
in the topbar account menu (next to Profile, with a key icon). It uses the same
`Modal` as *Staff → Add Staff*: a centred dialog on desktop, a bottom sheet on
mobile, Cancel / Change Password in the footer.

| Field | Rules |
| --- | --- |
| Current Password | Required · 6–24 characters |
| New Password | Required · 6–24 characters · must differ from the current one |
| Confirm New Password | Required · must match the new password |

The "must differ" and "must match" checks read their sibling field at validation
time, so they stay correct as the user edits either one. Nothing is sent until
every rule passes.

On success the session is cleared and the user is sent to `/login` with
*"Password changed successfully. Please login again."* — the old token would
otherwise stay valid until it expires. On a wrong current password the API's
message appears inline and the dialog stays open, still signed in. Typed values
are wiped whenever the dialog closes, so reopening never shows a previous
password.

## The Data Modules

The integrated modules share the same shape: one endpoint serves both the
full list and the search box, the API does the paging and the ordering, and the
newest request is the only one allowed to write to state — so a slow response
for an earlier search term can never overwrite what is being typed now.

### Sorting

Ordering is driven from the **table headers**: click a header to sort by it
ascending, click again for descending, and the arrow beside the field says
which way it is going. A column with no arrow is not sortable, because the API
cannot order by it.

Below `lg` the tables become cards, which have no header row, so the same
fields are offered as a row of buttons (`SortBar`) that behave exactly the same
way. Staff is cards at every width and uses that row on its own.

The two car boards are the exception: they sort **from the headers only** — a
second row of sort buttons above rows that already carry an arrow was one
control too many there.

The order is sent to the API, so it holds across every page rather than
shuffling the page on screen — with one exception: the Vehicles tab can also
sort by vehicle type and owner name, which `GET /auth/vehicle` does not accept.
Those two are ordered in the browser over the page in hand; ask for **All** rows
to put the whole list in order.

### Details Under a Row

Customers, Vehicles, Job Cards and the two car boards all carry an **arrow** at
the start of each row (and on each mobile card) that unfolds the rest of the
record underneath it. Several rows can stand open at once. What opens shows only
what the row does **not** — nothing the columns already say is repeated, and a
detail never filled in is left out rather than shown as a dash or "Not added".

Customers, Vehicles and Job Cards open **one sheet**: a strip of equal fact cells
across the top, bands for chips, warnings and notes, then the main content in
columns divided by hairlines — so every part lines up on the same edges. The
two car boards open **panels**: the car's specs as tiles, its papers or the
sale's standing as a checklist with a coloured verdict per line, the people on
either side, and the description or the receipts in full.

Alongside the stored fields they show figures worked out from them:

| Where | Worked out |
| --- | --- |
| Job card | **Turnaround** — "2 days in garage" while pending (amber past a week), "Done in 1 day" once delivered |
| Customer | **Customer for** "1 month"; how many vehicles are in service, pending and completed |
| Customer, Vehicle | **Insurance** — "Insured till …", or amber "ends in 11 days" / "expired …" within 30 days of the date; a customer lists every vehicle due in one warning band |
| Vehicle | **Last visit** "2 days ago" |
| Car sold | The **deal** against the asking price — "₹15,000 off", "At asking" — and how much of the price is paid |

A phone gets the same sheet stacked: fact cells two across with their icons
dropped, so the values have the room, and nothing scrolls sideways.

### Customers

Search by name or mobile number, sort by name, city or when they were added,
and open any row's arrow for their other contact details, notes, where their
vehicles stand, an insurance warning, and each vehicle as a card. **View** opens
the customer: the same kind of sheet with **Edit Customer**, then their vehicles
two across — each with its chips, what it came in for and how long ago — and the
forms to edit them or add another vehicle.

### Vehicles

Every vehicle of the garage, with its owner. What a row offers depends on where
the vehicle is in its life:

- **Completed** — an **Add** button, which opens the owner with the form filled
  in for that vehicle's next visit. Saving `POST`s a new vehicle: the API keeps
  a row per visit, so a returning car is a new row, not an edit.
- **Anything else** — a **View** button, which opens the same form over the
  vehicle itself. Saving `PUT`s only the fields that changed.

Both land on the same screen and the same form; only the button — **Save
Vehicle** or **Edit Vehicle** — and the request differ.

Each row's arrow opens the full make, model and variant with its type, fuel and
colour, the reading on the clock, where the insurance stands, how long ago the
vehicle last came in, the owner's WhatsApp when it is not their mobile, and what
it came in for.

### Staff

Category and status chips narrow the list, the search box matches name, role,
category or mobile, and the sort row orders by name, category, salary, status
or when they joined. Status is a filter, not a sort: "Active & Inactive" simply
leaves `?status=` off, which is how the API returns both.

### Job Cards

A card is opened against a **saved vehicle** — the API takes a `vehicleId` and
cannot create the vehicle on the way — so the form searches customers as it is
typed, then their fleet is fetched and picked from.

The job number is asked for as the screen opens. It is a *suggestion*, not a
reservation: two desks asking at the same moment are told the same number, and
whichever saves second is turned away with a 409, at which point the next
number is fetched and the save retried once, on its own.

What a row offers depends on the card's status:

- **Pending** — an **Edit** button, opening the same form filled in from
  `GET /auth/jobcard/:id` with **Edit Job Card** in place of Save. The `PUT`
  takes the status, the assigned staff, the reading, the complaint and the
  billable lines; the customer, the vehicle, the number and the service date are
  shown read-only because the API does not accept new ones.
- **Anything else** — a **View** button, opening the card read-only: the
  vehicle, its owner, the complaint, every billed line and the total, with an
  **Update Status** action.

Line items go out as the whole set the card should end up with. A line the API
already holds carries its id, a line added here does not, and a line left out is
dropped — all in one transaction, so the lines can never be saved against a
total that no longer adds up to them.

The list itself is the job number, the service date, the money, the two
statuses and the row of actions — **Invoice**, **Collect** / **Receipts** and
**Edit** / **View**. The vehicle and the customer are read from the **arrow** at
the start of each row: the vehicle and its facts, the customer with a call link,
who attended, the turnaround, what was asked for and every billed line — long
values no column can hold at a readable width, on the row that needs them
rather than on every row at once.

### Payments & Receipts

A bill is rarely settled in one go — part cash now, the rest on UPI when the
vehicle is collected — so the money has a screen of its own at
`/app/job-cards/:id/payment`: the balance, the row of ways to take it, and every
receipt behind it.

The **card settles itself**. Every payment endpoint answers with the re-settled
card, so the screen re-renders the money straight from the answer rather than
asking again: part of the bill leaves it `PARTIAL`, the last of it leaves it
`PAID` and — nothing being owed any more — marks the card `DELIVERED`. A receipt
can be corrected or cancelled, and an edit that leaves the bill short puts a
delivered card back to pending.

Offering more than the balance is a `400` that carries the same money block a
success does, so the refusal names what is actually left and the screen updates
from it instead of firing another request.

Each receipt can be sent to the customer on **WhatsApp** — the mark itself, not
the word — as a `wa.me` link with the message already typed in: the garage, the
job card, the vehicle, what was taken and how, then the three figures that
matter — the total, what was just paid, and what is still owing. The chat opens
straight out of the click that asked for it, since a tab opened after an `await`
is a pop-up as far as the browser is concerned. Nothing is sent behind the
owner's back: WhatsApp opens with the message ready and they press send.

### Car Selling

The used cars the garage is selling, at `/app/car-selling`. **Car Selling** is a
group in the sidebar rather than a page of its own: it opens on click — and on
its own while one of its pages is current — over **Car Add For Selling** and
**Car Sold Detail**.

The list keeps to what a garage needs to recognise a car and quote it — the car,
its number, the seller, the mobile number and the price — and each row carries
an **arrow** that unfolds the rest underneath it: year, fuel, colour (with a
swatch) and ownership as tiles; insurance, PUC and accident history as a
checklist marked Valid / Expired / Missing / Clean / Accidental; the seller and
the listing; and whatever was written about the car.

The add and edit screens are pages, not dialogs, and the whole form sits in
three full-width sections — seller details on one row, the car and its price
over two, then the papers — so a listing is written without scrolling. **Car
Number**, **Fuel Type**, **Owner Name**, **Mobile Number** and **Selling Price**
are required; the number is uppercased with spaces and hyphens dropped as it is
typed, which is how the API stores it. **Car Name** is a searchable pick list
that still takes free text (it is stored as `carType`). The papers read **PUC**,
**Accidental**, **Insurance**, in that order; ticking **Insurance** opens the
calendar for the date it runs until — past days cannot be picked, though an
older car being edited keeps the lapsed date it already has — and unticking it
clears the date again. Editing
`PUT`s only the fields that changed, and a form where nothing changed simply
says so instead of sending an empty body.

A car leaves this board the moment it is sold: `GET /auth/car-selling` answers
with the cars still `SALE`, and its exact complement — the sold list below —
answers with the rest.

### Car Sold

Who bought each car and what has been collected, at `/app/car-sold`.

**Add Car Sold** opens a page that starts from a **searchable car picker** over
`GET /auth/car-selling/dropdown` — every car still for sale, read once and
narrowed in the browser as it is typed, by number or body type, with the number
matched the way it is stored so `gj 01-ab` finds `GJ01AB1234`. A car already
sold is not on it. Picking one reads the listing back and shows it **read only**
— the seller, their mobile, the asking price and how many owners the car has
had — and offers the asking price as the figure the deal closed at.

The deal itself is the buyer, the **Final Selling Price** — what the car
actually went for, which need not be the asking price — and the **Payment
Received** at the counter, which is **required** and which the API writes as the
sale's first receipt. It may not exceed the final price, and the field re-checks
itself when that price is edited. A car can only be sold once — a second attempt
is the API's `409`, shown as it comes back with the picker focused again.

Recording a sale always takes the car off the board (`SOLD`). Delivery is the
desk's to say, with one exception:

| Delivered Status | Payment | Stored |
| --- | --- | --- |
| **Delivered** | anything | `DELIVERED`, on the **Delivered Date** — shown only for Delivered, filled in with today, no later than today |
| **Pending** | part of the price | `PENDING`, no date |
| **Pending** | the whole price | `DELIVERED`, dated **today** — a car paid for in full has gone |

The same rule holds afterwards: the receipt that pays a sale off delivers a car
still pending and dates it today, while a part payment never touches delivery.

**Edit** on a row opens the sale at `/app/car-sold/:id/edit` — the same form,
with the car fixed and no payment box (money only moves through Collect). It
corrects the buyer, the final price — never below what has been paid — and the
delivery. Opened from the list it fills in at once from the row; opened from its
address it reads the sale from `GET /auth/car-selling/sold-customer/:id`.

Each row shows the car, the seller, the buyer, the sale price with what is still
owing under it, and two badges: the money and the delivery. A sale with nothing
against it reads **Nothing paid** rather than "Partial" — a car sale has only
the two statuses, `PARTIAL` and `PAID`, so "nothing paid yet" is the far end of
the first one. The arrow unfolds the car as tiles, the sale's standing — payment,
delivery and the deal against the asking price — as a checklist, the buyer and
the seller with call links, and **every receipt** taken against the sale: the
final price, what is paid and what is pending, a bar showing how far through
paying the buyer is, and each receipt numbered with its date.

Each receipt has an **Edit** button for a figure typed wrong. The dialog opens on
the amount the receipt holds and allows at most that plus what is still pending,
so the corrected total never passes the price; the API
(`POST /auth/car-selling/sold-customer/:id/payment/:paymentId`) checks the same
against the live receipts, re-works the payment status, and delivers a car the
correction pays off.

A car the garage marked sold by hand, without ever recording a buyer, comes back
with no sale on it. It is shown as **"No buyer recorded"** instead of being
filtered out, which would leave the garage wondering where the car went.

**Collect** — offered on any row still owing — takes the balance through
`POST /auth/car-selling/sold-customer/:id/payment`. The dialog shows the price,
what is paid and what is **pending**, offers to collect the whole balance in one tap,
and refuses more than is owing before it asks. The API checks the same thing
against the live receipts, which is the check that counts, since another desk
may have taken money since the screen was drawn; its `400` names what is left to
pay and is shown as it comes back. The list reads itself again afterwards, so
the row, its badges and the count all move together.

### Invoice PDF

A card that has been paid, in part or in full, offers an **Invoice** button on
the list. It fetches the card and its receipts, then builds a PDF in the browser
and hands it over as `invoice-JC-2026-0004.pdf`.

The document carries the garage and its contact details, the customer, the
vehicle in full — number, make and model, type, fuel, colour, odometer and
insurance expiry — the complaint, every billed line, the totals with the balance
due, and every receipt with the balance left after each. Long bills flow onto
further pages with the table header repeated and a *Page 1 of 2* footer.

Like the Excel export it costs **no dependency**: `src/lib/pdf.ts` writes the
PDF format by hand — text in the standard Helvetica faces, rules, rectangles and
as many pages as the content runs to — and `src/lib/invoice.ts` lays the invoice
out on it. Those faces carry no rupee sign, so the printed figures read `Rs.`
where the screen shows `₹`.

### Car Sale Receipt PDF

Every sale with a buyer has a **Receipt** button on Car Sold Detail. It reads the
sale again first — so a payment collected since the page loaded is on it — and
builds `receipt-GJ01AB1234.pdf` in the browser: the garage, a **RECEIPT** title
with a Paid / Partial / Nothing paid stamp, the car number, sale and delivery
dates, the buyer and the car with its seller, the final price, what is paid and
the balance due, and every receipt with the balance left after it.

It is laid out with the invoice's own building blocks (`src/lib/carSaleReceipt.ts`
over `src/lib/invoice.ts`), so the two documents read as coming from one garage.

### Excel Export

Customers, Vehicles, Car Selling and Car Sold Detail have a **Download Excel**
button. It writes a real
`.xlsx` — a title block naming the data, the search term and the order it was
taken in, then a frozen, styled header over the rows — with no dependency:
`src/lib/excel.ts` builds the handful of XML parts and stores them in a ZIP
uncompressed, which Excel accepts.

It exports **what the list is showing**: this page of it, under the search term
in the box. Ask for "All" rows first to download everything.

## The Dashboard

Twelve figures, in **one request** — `GET /auth/dashboard/summary` — so the
screen does not open with a dozen requests racing each other. They are grouped
under the heading that says what each row is counted over:

| Row | Tiles |
| --- | --- |
| **Overall** — since the garage opened | Total Customers · Total Vehicles · Total Job Cards · Total Revenue |
| **The month**, named from the answer | New Customers · New Vehicles · New Job Cards · Revenue This Month |
| **Needs Attention** — all time | Pending Vehicles · In Service · Unpaid Bills · Partially Paid |

The month row is the month **to date** — midnight on the 1st up to this moment,
on the server's calendar — and the window comes back with the figures, so the
heading names the month it is showing (*September 2026*) rather than working it
out from the browser's own clock. It is read off the window's **end**: the start
is midnight on the 1st in the server's timezone, and that instant falls in the
previous month once a browser somewhere else in the world writes it out.

The attention row is deliberately **all time**, not this month: an unpaid bill
from March is still owed in September, and a month boundary would hide exactly
what a garage opens this screen to see. `unpaid` and `partiallyPaid` count **job
cards** — it is the bill that is unpaid, not the vehicle or the customer.

Revenue is money **collected**, counted by the date each payment came in, not
work billed.

Each tile links to the screen where those rows can be read one by one. While the
request is out they paint with their labels and a bar in place of each figure,
so nothing jumps when the numbers land; a failure is **one** message with a
retry rather than twelve tiles each saying the same thing. A brand new garage is
a `200` with zeros all the way down, never a 404.

Below the tiles, the four newest job cards are the real rows from
`GET /auth/jobcard`, each linking to its own card.

## Panels & Routes

### Authentication (`/`)
| Route | Screen | Status |
| --- | --- | --- |
| `/login` | Login | **API integrated** |
| `/register` | Create garage account | **API integrated** |
| `/verify-otp` | OTP entry + verified confirmation | **API integrated** |
| `/forgot-password` | Request reset OTP | **API integrated** |
| `/reset-password` | Code + new password | **API integrated** |

### Garage Owner (`/app`) — protected
| Route | Screen | Status |
| --- | --- | --- |
| `/app` | Dashboard | **API integrated** — twelve figures from `GET /auth/dashboard/summary` |
| `/app/customers` | Customer list | **API integrated** |
| `/app/customers/new` | Add customer | **API integrated** |
| `/app/customers/:id` | Customer details, vehicles, add/edit forms | **API integrated** |
| `/app/vehicles` | Vehicle list | **API integrated** |
| `/app/vehicles/new`, `/app/vehicles/:id` | Older standalone vehicle form | Mock — the live add/edit forms live on the customer |
| `/app/job-cards` | Job card list | **API integrated** |
| `/app/job-cards/new` | New job card | **API integrated** |
| `/app/job-cards/:id` | Job card details | **API integrated** |
| `/app/job-cards/:id/edit` | Edit a pending job card | **API integrated** |
| `/app/job-cards/:id/payment` | Collect payment, receipts, WhatsApp | **API integrated** |
| `/app/staff` | Staff | **API integrated** |
| `/app/car-selling` | Car Add For Selling — the cars on the board | **API integrated** |
| `/app/car-selling/new` | Add a car for sale | **API integrated** |
| `/app/car-selling/:id/edit` | Edit a listing | **API integrated** |
| `/app/car-sold` | Car Sold Detail — sales, money and Collect | **API integrated** |
| `/app/car-sold/new` | Add Car Sold — pick the car, record the buyer | **API integrated** |
| `/app/car-sold/:id/edit` | Edit a recorded sale (`:id` is the sale) | **API integrated** |
| `/app/profile` | Garage Profile | Reads `GET /auth/me`; Save Changes is still mock |
| `/app/billing`, `/app/salary`, `/app/reports` | Billing, Salary, Reports | Mock |
| `/app/subscription` | Subscription | Mock |

### Platform Admin (`/admin`)
Sign-in at `/admin/login` is **API integrated** and holds its own token behind
its own guard (`AdminProtectedRoute`), separate from the garage owner's. The
panel behind it — dashboard, Garages, Subscription Plans, Payments and Reports
— is still mock.

## Responsive Design

- **Mobile-first** layouts tested at 375 / 390 / 414 / 768 / 1024 / 1440 px.
- Desktop uses a fixed sidebar; mobile uses a hamburger **drawer** + a **bottom
  navigation bar** with a **More** sheet for secondary modules.
- Data tables on desktop collapse to **cards/lists** on mobile.
- No unwanted horizontal scrolling.

## Design System

Reusable components live in `src/components/`:

- **`ui/`** — Button, Input, Select, Textarea, PasswordInput, OtpInput, Card,
  Badge, StatusBadge, Modal (bottom-sheet on mobile), Drawer, ConfirmDialog,
  Skeleton, EmptyState, ErrorState, LoadingState, Toast, WhatsappIcon.
  Input, Select and Textarea all take a `leftIcon`, and every field in the app
  carries the mark of what it holds. `WhatsappIcon` is drawn by hand —
  `lucide-react` carries no WhatsApp mark, and its nearest is a plain speech
  bubble, which does not say which app the receipt is about to open in.
- **`common/`** — PageHeader, SearchInput, FilterButton, StatCard, ActionButton,
  DataTable (sortable headers), ResponsiveList, SortBar, PaginationBar,
  BarChart, SubscriptionBanner, PWA UI (install prompt + offline/online
  banners), and **DetailBlocks** — the parts every "details under a row" is
  built from: `DetailSheet`, `FactStrip` / `FactCell`, `SheetBand`,
  `SheetSection`, `FactChip`, and the panel set `DetailPanel`, `SpecGrid` /
  `SpecTile`, `StatusList` / `StatusRow` / `StatusPill`, `InfoLine`, `PhoneLink`.
- **`layout/`** — Sidebar, Topbar, BottomNav, SubscriptionPill,
  ChangePasswordModal.
- **`customers/`** — CustomerFields (shared by the add page and the edit
  dialog), CustomerSummaryCard (the sheet on the customer's page),
  CustomerMoreDetails (what the row's arrow unfolds), EditCustomerModal.
- **`vehicles/`** — VehicleFields, VehicleFormCard (adds or edits, depending on
  what it is given), VehicleSummaryCard, VehicleMoreDetails (the row's arrow),
  VehicleStatusBadge, and VehicleFacts — the vehicle chips and the one insurance
  rule (amber within 30 days) every screen shares.
- **`staff/`** — StaffFormModal (adds or edits, depending on what it is given).
- **`jobcards/`** — ComboboxInput, CustomerSearchInput (the type-ahead),
  RecordPickerModal, SectionCard, JobItemsTable, JobItemModal, JobCardSummary,
  JobCardMoreDetails (the row's arrow).
- **`payments/`** — PaymentSummary (the balance and the bar), PaymentMethodPicker,
  PaymentModal (record or correct a receipt), PaymentHistory.
- **`carSelling/`** — SuggestionCombobox (a searchable pick list that still takes
  free text, over `ComboboxInput`), CarFlagBadges, CarSellingDetailsModal,
  CarSellingMoreDetails (what the row's arrow unfolds).
- **`carSold/`** — CarPickerInput (the car type-ahead over the dropdown
  endpoint), SelectedCarDetails (the picked listing, read only),
  SaleStatusBadges, SoldCarMoreDetails (the sale and its receipts),
  CollectPaymentModal, EditPaymentModal (corrects one receipt's amount).
- **`dashboard/`** — SummaryCard, one figure with its icon, colour and link.

### Rows, cards and their actions

`ActionButton` is the one button at the end of a table row and at the foot of a
card, shared by Job Cards, Customers, Vehicles, Staff and the two car boards. It
is drawn as a button — bordered, on its own fill — rather than as a coloured
word, because a row of links reads as text the desk has to guess is clickable.
Its **tone** says what the action is for (blue for paperwork, green for money,
grey for opening the record) and its **layout** sizes it for a row or for a card.

Table columns carry an `align` that the header and its cells share, so a column
and the word naming it always line up: money sits against the right edge with
the paise written out and the digits on one width. Where a row can offer an
action that another row cannot, the gap is held open, so the buttons stay under
one another down the whole table.

## Project Structure

```
src/
├── components/
│   ├── ui/         primitives — Button, Input, Modal, OtpInput, Toast, ...
│   ├── common/     shared widgets — PageHeader, DataTable, SortBar, StatCard, ...
│   ├── layout/     app chrome — Sidebar, Topbar, BottomNav, SubscriptionPill,
│   │               ChangePasswordModal
│   ├── customers/  customer fields, summary sheet, row details, edit dialog
│   ├── vehicles/   vehicle fields, the add/edit form card, summary, row details,
│   │               chips and insurance rule, status badge
│   ├── staff/      the staff form dialog
│   ├── jobcards/   the job card form's own parts — type-ahead, pickers, items —
│   │               and the row details
│   ├── payments/   balance, method picker, receipt dialog, receipt history
│   ├── carSelling/ pick lists, flag badges, details modal, row details
│   ├── carSold/    car picker, picked car, status badges, row details,
│   │               collect and edit-payment dialogs
│   └── dashboard/  SummaryCard — one figure per tile
├── config/       env.ts — API base URL
├── context/      AuthContext — session state, persistence, auto-logout
├── hooks/        useCountdown (OTP timers), useDebouncedValue,
│                 useCustomerSearch, useCustomerVehicles, useAllStaff,
│                 useJobNumber, useJobCardPayments, useDashboardSummary,
│                 useSessionLifecycle
├── layouts/      AppShell, OwnerLayout, AdminLayout, AuthLayout, navigation
├── lib/          utils, validation, subscription, dashboard,
│                 excel, pdf, invoice, carSaleReceipt (the file writers),
│                 payment, whatsapp (the receipt message),
│                 carSelling, carSold (form values, labels, payloads),
│                 customerForm, vehicleForm, staffForm, jobCard,
│                 vehicleStatus, staff, activeCustomer,
│                 authStorage, adminAuthStorage,
│                 pendingRegistration, pendingPasswordReset
├── mock/         static mock data (modules not yet integrated)
├── pages/        auth/ · owner/ · admin/
├── routes/       route definitions + Protected / PublicOnly / Admin guards
├── services/     httpClient, authService, customerService, vehicleService,
│                 staffService, jobCardService, paymentService,
│                 carSellingService, carSoldService,
│                 dashboardService, adminService
└── types/        shared types · auth, customer, vehicle, staff, jobCard,
                  payment, carSelling, carSold, dashboard — mirror the API
                  contract
```

## Adding the Next Endpoint

1. Add the request/response types to `src/types/`.
2. Add a function to a service in `src/services/` that calls `apiRequest`
   (the bearer token is attached for you).
3. Call it from the page, catching `ApiError` to show `error.message`.
4. Delete the matching file in `src/mock/` once the screen is fully integrated.

## Notes

- **Billing, Salary and Reports still use mock data and mock submission**
  (simulated latency + toast); nothing is persisted. The dashboard is not among
  them any more: every tile on it, and the recent job cards under them, come
  from the API.
- **Garage Profile reads but does not write.** Save Changes is still a mock
  submission; the API has no profile-update endpoint yet.
- The standalone vehicle form at `/app/vehicles/new` and `/app/vehicles/:id` is
  the older mock screen. The live add and edit forms are reached from the
  Vehicles tab, and open on the customer the vehicle belongs to.
- The job card's **discount** field is display-only: neither the create nor the
  update contract carries one, so it changes the summary on screen and nothing
  else.
- The invoice PDF is written by hand against the standard PDF fonts, which have
  no rupee sign — printed figures read `Rs. 18,450.50` where the screen shows
  `₹18,450.50`. Nothing about the file leaves the browser: it is built and
  downloaded on the spot, and the API is not asked to render it.
- The **Settings** screen has been removed. Everything it linked to is reached
  elsewhere: the profile from the topbar's avatar menu, and Subscription from
  the sidebar.
- PWA UI (install prompt, offline / back-online banners) is **UI-only** — no
  service worker or sync is implemented.
- The Platform Admin panel behind `/admin/login` is still mock, though the
  sign-in itself is real and guarded by its own token.
- There is no Prettier or ESLint config in the repo. Match the surrounding
  style — single quotes, no semicolons — rather than running a formatter with
  its defaults.
