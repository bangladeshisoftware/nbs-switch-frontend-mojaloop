# R Switch Portal - Frontend

The React-based admin portal for **R Switch**, a Mojaloop-powered national payment switch. Built for central switch operators to monitor real-time transfers, manage DFSP participants, control liquidity and settlement, configure the Mojaloop Hub, and audit all system activity — from a single unified interface.

---

## Table of Contents

- [Features](#features)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Portal Navigation](#portal-navigation)
  - [Monitor](#monitor)
  - [Liquidity](#liquidity)
  - [Finance](#finance)
  - [Hub Configuration](#hub-configuration)
  - [Admin](#admin)
- [Project Structure](#project-structure)

---

## Features

### Real-Time Transfer Monitoring
Live dashboard with transfer volumes, success rates, hourly throughput charts, and top DFSP activity. Full transaction list with search, status filter, DFSP filter, currency filter, and date range — drill down to per-transfer state history from `RECEIVED → RESERVED → COMMITTED`.

### Liquidity Management
Per-DFSP live position view sourced directly from the Central Ledger — current position, Net Debit Cap (NDC), settlement account balance, available headroom, and health status (`HEALTHY / LOW / CRITICAL`). Deposit funds to settlement accounts and adjust NDC limits without leaving the portal.

### Settlement Operations
Full Deferred Net Settlement workflow: open windows, trigger the 6-step settlement pipeline (`PS_TRANSFERS_RECORDED → PS_TRANSFERS_RESERVED → PS_TRANSFERS_COMMITTED → SETTLED`), and run physical fund movements (credit/debit per DFSP). All results tracked with before/after position snapshots.

### Reconciliation
Dual-entry reconciliation (SEND + RECEIVE per transfer). Run reconciliation for any settlement date, view MATCHED / UNMATCHED / PENDING / DISPUTED status per record, and export net position reports per DFSP.

### Reports & Excel Export
Filterable transfer reports (today, yesterday, this week, custom range, by DFSP, by status) with summary KPIs. One-click Excel export — styled `.xlsx` with a dark-theme summary sheet and color-coded transaction sheet (up to 50,000 rows).

### Hub Configuration
Manage Mojaloop Hub accounts, create and view settlement models (e.g. `DEFERREDNET`), and configure ALS oracles — all via the Central Ledger Admin and ALS Admin APIs.

### DFSP Management
Register new DFSPs with automatic Central Ledger provisioning: participant creation, SETTLEMENT account setup, all 13 FSPIOP callback URL registrations, NDC initialization, portal user creation, and welcome email — in one form submission.

### Notification Log
Browse every Mojaloop notification event consumed from Kafka, filterable by FSP, transfer state, and event type. View full raw payload per notification.

### Activity Audit
Login audit trail for switch operators and DFSP portal users — with IP address, geo-location (City, Country), login time, and user type. Daily chart for the last 7 days and top-user rankings.

### User Management
Manage switch operator accounts with role-based access (`ADMIN`, `OPERATOR`, `VIEWER`). Create users, toggle active status, and update roles.

---

## Environment Setup

Create a `.env` file in the project root:

```dotenv
REACT_APP_API_URL=https://your-rswitch-server.com/api
REACT_APP_DFSP_URL=https://your-dfsp-portal.com
```

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Base URL of the R Switch backend REST API. All portal API calls are prefixed with this. |
| `REACT_APP_DFSP_URL` | URL of the DFSP-facing portal. Used for cross-linking when switch operators need to navigate to a specific DFSP's portal. |

> All Create React App environment variables must be prefixed with `REACT_APP_` to be accessible via `process.env`.

---

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set REACT_APP_API_URL and REACT_APP_DFSP_URL

# 3. Start development server
npm start

# 4. Build for production
npm run build
```

---

## Portal Navigation

The portal is organized into five sections. All routes require a valid JWT session (OTP-verified login).

---

### Monitor

The operational heartbeat of the switch — live data, transfer records, and notification events.

#### Dashboard `/`
Switch-wide overview sourced from the backend `/dashboard/summary` endpoint:
- Total transfers with committed / failed / timeout / reserved breakdown and success rate percentage
- Committed volume by currency
- Hourly throughput chart for the last 24 hours (total, success, failed per hour)
- Top 5 DFSPs by committed transfer volume
- Supports date range filtering

#### Transactions `/transactions`
Full transfer ledger with rich filtering:
- Filter by status (`COMMITTED`, `FAILED`, `RESERVED`, `RECEIVED`, `TIMEOUT`)
- Filter by payer FSP, payee FSP, currency, date range
- Search by transfer ID
- Paginated results with per-page control
- Click any transfer to see the complete **state transition history** (`transfer_state_log`) — each hop from `RECEIVED` through to `COMMITTED` or `FAILED`, with timestamps, direction, and raw event type

#### Notifications `/notifications`
Every Mojaloop notification event that passed through `topic-notification-event`:
- Filter by `to_fsp`, `from_fsp`, `transfer_state`, `event_type`, or `transfer_id`
- View full raw Kafka payload per notification
- Summary stats: total, committed, failed, prepare, unique FSPs, unique transfers
- Per-FSP breakdown of notification outcomes

---

### Liquidity

Tools for managing DFSP financial positions and settlement account funding.

#### Liquidity `/liquidity`
Per-DFSP live position dashboard:
- Real-time data fetched from Central Ledger (`/participants/:dfspId/positions`, `/limits`, `/accounts`)
- Current position, NDC, settlement account balance, available headroom
- Health indicator: `HEALTHY` (>30% NDC remaining), `LOW` (>0%), `CRITICAL` (exhausted)
- Deposit funds to a DFSP's SETTLEMENT account (validates account type before submitting)
- Update Net Debit Cap — syncs to Central Ledger then updates local DB in a transaction
- All DFSP positions in a single summary table with filterable columns

#### Positions History `/positions`
Audit trail of every position movement recorded by the Kafka consumer:
- `RESERVE` entries when transfers are prepared
- `COMMIT` entries when transfers are fulfilled
- `ROLLBACK` entries when transfers fail or timeout
- Filter by DFSP and transfer ID
- Links back to the originating transfer

---

### Finance

End-to-end financial operations from reconciliation through settlement finalization.

#### Reconciliation `/reconciliation`
Dual-entry reconciliation records (one SEND + one RECEIVE per committed transfer):
- Status breakdown: MATCHED / UNMATCHED / PENDING / DISPUTED
- Run reconciliation for any settlement date (auto-matches SEND/RECEIVE pairs)
- Filter by DFSP, status, and date range
- Net position report per DFSP grouped by currency (total sent, total received, net position)

#### Settlement `/settlement`
Settlement window management and full pipeline execution:
- View open and historical settlement windows
- Open a new settlement window (synced with Mojaloop Settlement Service)
- Close a specific window manually
- **Complete Settlement** — triggers the full 6-step pipeline:
  1. Close window
  2. Create settlement with `DEFERREDNET` model
  3. `PS_TRANSFERS_RECORDED`
  4. `PS_TRANSFERS_RESERVED`
  5. `PS_TRANSFERS_COMMITTED`
  6. `SETTLED`
- Net positions per DFSP for any settlement date
- Step-by-step result display — each pipeline step shown as pass/fail

#### Finalize Records `/settlement-finalize-records`
Physical fund movement records from the `finalizeByWindow` operation:
- Per-DFSP entries showing `credit` (recordFundsIn) or `debit` (recordFundsOutCommit) actions
- `before_amount` and `after_amount` from Central Ledger
- Action status: `ok`, `prepare`, `commit`, `abort`, `failed`, `skipped`
- Summary: total credited, total debited, DFSPs processed, windows covered
- Filter by DFSP, window, settlement ID, action type, status, date range

#### Settlement History `/settlement-complete-records`
Completed settlement snapshots — one record per DFSP per settlement:
- `before_position` and `after_position` at settlement time
- Net amount settled per DFSP
- Filter by window, settlement ID, DFSP, date range

#### Deposits History `/deposits-records`
Log of all funds deposited to DFSP settlement accounts:
- DFSP, account ID, amount, currency, reason, timestamp
- Summary: total volume deposited, number of DFSPs funded
- Filter by DFSP name and date range

#### Reports `/reports`
Flexible transfer reporting with export:
- Quick filters: **Today**, **Yesterday**, **This Week**, or custom date range
- Filter by DFSP (payer or payee direction), status
- Summary KPIs: total transfers, committed, failed, reserved, total volume, average processing time
- **Export to Excel** — downloads a styled `.xlsx` workbook:
  - Summary sheet with dark theme, success/failure rates, and total volume
  - Transactions sheet — color-coded by status, frozen header, auto-filter, up to 50,000 rows

---

### Hub Configuration

Direct management of the Mojaloop Hub participant and infrastructure configuration.

#### Hub Accounts `/hub/accounts`
View and create Hub participant accounts in the Central Ledger:
- List existing Hub accounts (type, currency, balance)
- Create new Hub account (`{ currency, type }`)
- Required before DFSPs can transact in a new currency

#### Settlement Models `/hub/settlement-models`
View and create settlement models registered in the Central Ledger:
- List all models (e.g. `DEFERREDNET`)
- Create new settlement model with custom configuration
- Settlement model must exist before running `completeSettlement`

#### Oracle Config `/hub/oracles`
Manage ALS (Account Lookup Service) oracles:
- List all registered oracles
- Register a new oracle (type, endpoint, currency)
- Delete an oracle by ID
- Oracles define which external service resolves a party identifier type (e.g. MSISDN)

---

### Admin

User, DFSP, and audit management for switch administrators.

#### DFSP Management `/dfsps`
Full DFSP lifecycle from a single page:
- List all registered DFSPs with status, currency, endpoint URL
- **Create DFSP** — one form that provisions the full stack:
  - Central Ledger participant + SETTLEMENT account
  - All 13 FSPIOP callback URL registrations
  - NDC initialization
  - Local DB record + position row
  - DFSP admin user creation
  - Welcome email with portal credentials
- Edit DFSP details (name, callback URL, currency, status) — re-registers endpoints automatically
- View DFSP detail page: transfer stats (total, committed, failed, volume), live Central Ledger endpoints and limits

#### Activity Logs `/activity-logs`
Complete login audit trail for the switch:
- Every login logged with username, email, IP address, geo-location, timestamp, and type (`switch` or `dfsp`)
- Filter by type, username, IP address, date range
- Stats panel: total logins, switch vs DFSP breakdown, unique users, unique IPs, logins today
- Daily login chart for the last 7 days
- Top 10 most active users by login count

#### Users `/users`
Switch operator user management:
- List all portal users with role, active status, last login date
- Create new user (username, email, password, role)
- Update role (`ADMIN`, `OPERATOR`, `VIEWER`) or toggle active status
- Duplicate username/email validation

---

## Project Structure

```
src/
├── pages/
│   ├── Dashboard.jsx                  # /
│   ├── Transactions.jsx               # /transactions
│   ├── Notifications.jsx              # /notifications
│   ├── Liquidity.jsx                  # /liquidity
│   ├── Positions.jsx                  # /positions
│   ├── Reconciliation.jsx             # /reconciliation
│   ├── Settlement.jsx                 # /settlement
│   ├── SettlementFinalizeRecords.jsx  # /settlement-finalize-records
│   ├── SettlementCompleteRecords.jsx  # /settlement-complete-records
│   ├── DepositsRecords.jsx            # /deposits-records
│   ├── Reports.jsx                    # /reports
│   ├── hub/
│   │   ├── HubAccounts.jsx            # /hub/accounts
│   │   ├── SettlementModels.jsx       # /hub/settlement-models
│   │   └── Oracles.jsx                # /hub/oracles
│   ├── Dfsps.jsx                      # /dfsps
│   ├── ActivityLogs.jsx               # /activity-logs
│   └── Users.jsx                      # /users
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx                # NAV config + section grouping
│   │   └── TopBar.jsx
│   └── ui/                            # Shared UI primitives
├── services/
│   └── api.js                         # Axios instance with REACT_APP_API_URL base
├── hooks/                             # useAuth, useFetch, etc.
├── routes/
│   └── index.jsx                      # React Router v6 route definitions
└── main.jsx                           # App entry point
```

---

## License

Private - R Switch Portal / Bangladeshi Software LTD. All rights reserved.
