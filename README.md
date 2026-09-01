# GaragePro — Garage Management SaaS (Frontend)

A mobile-first Garage Management SaaS frontend built with React, TypeScript and
Tailwind CSS. It talks to the **Node.js API** in
`D:\Arti\Project\GarageManagementSystem\NodeJS_API`.

**Authentication, Customers, Vehicles, Staff and Job Cards are wired to the
real API** — registration, OTP verification, login, the garage profile, change
password and forgot password, plus the four data modules the desk works in all
day. Billing, Salary, Reports, the dashboard's figures and the whole Platform
Admin panel still render mock data; those are integrated one at a time.

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
  the owner's name**, above the subscription banner.
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

- **`SubscriptionBanner`** on the dashboard — plan name, days remaining, the end
  date, and a progress bar showing the elapsed share of the plan
  (*Day 6 of 30*). Every string is data-driven; the expiring and expired states
  name the actual plan instead of always saying "trial".
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

The four integrated modules share the same shape: one endpoint serves both the
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

The order is sent to the API, so it holds across every page rather than
shuffling the page on screen — with one exception: the Vehicles tab can also
sort by vehicle type and owner name, which `GET /auth/vehicle` does not accept.
Those two are ordered in the browser over the page in hand; ask for **All** rows
to put the whole list in order.

### Customers

Search by name or mobile number, sort by name, city or when they were added,
and expand any row to see that customer's vehicles. Opening one shows their
details, their fleet, and the forms to edit them or add another vehicle.

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

### Excel Export

Customers and Vehicles have a **Download Excel** button. It writes a real
`.xlsx` — a title block naming the data, the search term and the order it was
taken in, then a frozen, styled header over the rows — with no dependency:
`src/lib/excel.ts` builds the handful of XML parts and stores them in a ZIP
uncompressed, which Excel accepts.

It exports **what the list is showing**: this page of it, under the search term
in the box. Ask for "All" rows first to download everything.

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
| `/app` | Dashboard | Greeting, garage name and subscription banner from the API; the figures are mock |
| `/app/customers` | Customer list | **API integrated** |
| `/app/customers/new` | Add customer | **API integrated** |
| `/app/customers/:id` | Customer details, vehicles, add/edit forms | **API integrated** |
| `/app/vehicles` | Vehicle list | **API integrated** |
| `/app/vehicles/new`, `/app/vehicles/:id` | Older standalone vehicle form | Mock — the live add/edit forms live on the customer |
| `/app/job-cards` | Job card list | **API integrated** |
| `/app/job-cards/new` | New job card | **API integrated** |
| `/app/job-cards/:id` | Job card details | **API integrated** |
| `/app/job-cards/:id/edit` | Edit a pending job card | **API integrated** |
| `/app/staff` | Staff | **API integrated** |
| `/app/profile` | Garage Profile | Reads `GET /auth/me`; Save Changes is still mock |
| `/app/billing`, `/app/salary`, `/app/reports` | Billing, Salary, Reports | Mock |
| `/app/subscription`, `/app/settings` | Subscription, Settings | Mock |

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
  Skeleton, EmptyState, ErrorState, LoadingState, Toast.
  Input, Select and Textarea all take a `leftIcon`, and every field in the app
  carries the mark of what it holds.
- **`common/`** — PageHeader, SearchInput, FilterButton, StatCard, DataTable
  (sortable headers), ResponsiveList, SortBar, PaginationBar, BarChart,
  SubscriptionBanner, PWA UI (install prompt + offline/online banners).
- **`layout/`** — Sidebar, Topbar, BottomNav, SubscriptionPill,
  ChangePasswordModal.
- **`customers/`** — CustomerFields (shared by the add page and the edit
  dialog), CustomerSummaryCard, CustomerVehicleList, EditCustomerModal.
- **`vehicles/`** — VehicleFields, VehicleFormCard (adds or edits, depending on
  what it is given), VehicleSummaryCard, VehicleStatusBadge.
- **`staff/`** — AddStaffModal.
- **`jobcards/`** — ComboboxInput, CustomerSearchInput (the type-ahead),
  RecordPickerModal, SectionCard, JobItemsTable, JobItemModal, JobCardSummary.

## Project Structure

```
src/
├── components/
│   ├── ui/         primitives — Button, Input, Modal, OtpInput, Toast, ...
│   ├── common/     shared widgets — PageHeader, DataTable, SortBar, StatCard, ...
│   ├── layout/     app chrome — Sidebar, Topbar, BottomNav, SubscriptionPill,
│   │               ChangePasswordModal
│   ├── customers/  customer fields, summary, vehicle list, edit dialog
│   ├── vehicles/   vehicle fields, the add/edit form card, summary, status badge
│   ├── staff/      add-staff dialog
│   └── jobcards/   the job card form's own parts — type-ahead, pickers, items
├── config/       env.ts — API base URL
├── context/      AuthContext — session state, persistence, auto-logout
├── hooks/        useCountdown (OTP timers), useDebouncedValue,
│                 useCustomerSearch, useCustomerVehicles, useAllStaff,
│                 useJobNumber, useSessionLifecycle
├── layouts/      AppShell, OwnerLayout, AdminLayout, AuthLayout, navigation
├── lib/          utils, validation, subscription, excel,
│                 customerForm, vehicleForm, staffForm, jobCard,
│                 vehicleStatus, staff, activeCustomer,
│                 authStorage, adminAuthStorage,
│                 pendingRegistration, pendingPasswordReset
├── mock/         static mock data (modules not yet integrated)
├── pages/        auth/ · owner/ · admin/
├── routes/       route definitions + Protected / PublicOnly / Admin guards
├── services/     httpClient, authService, customerService, vehicleService,
│                 staffService, jobCardService, adminService
└── types/        shared types · auth, customer, vehicle, staff, jobCard
                  mirror the API contract
```

## Adding the Next Endpoint

1. Add the request/response types to `src/types/`.
2. Add a function to a service in `src/services/` that calls `apiRequest`
   (the bearer token is attached for you).
3. Call it from the page, catching `ApiError` to show `error.message`.
4. Delete the matching file in `src/mock/` once the screen is fully integrated.

## Notes

- **Billing, Salary and Reports still use mock data and mock submission**
  (simulated latency + toast); nothing is persisted. So do the dashboard's stat
  cards and its recent job cards — only the greeting, garage name and
  subscription banner there come from the API.
- **Garage Profile reads but does not write.** Save Changes is still a mock
  submission; the API has no profile-update endpoint yet.
- The standalone vehicle form at `/app/vehicles/new` and `/app/vehicles/:id` is
  the older mock screen. The live add and edit forms are reached from the
  Vehicles tab, and open on the customer the vehicle belongs to.
- The job card's **discount** field is display-only: neither the create nor the
  update contract carries one, so it changes the summary on screen and nothing
  else.
- PWA UI (install prompt, offline / back-online banners) is **UI-only** — no
  service worker or sync is implemented.
- The Platform Admin panel behind `/admin/login` is still mock, though the
  sign-in itself is real and guarded by its own token.
- There is no Prettier or ESLint config in the repo. Match the surrounding
  style — single quotes, no semicolons — rather than running a formatter with
  its defaults.
