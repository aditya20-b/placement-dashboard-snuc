# Google Sheets Setup

[![Google Sheets](https://img.shields.io/badge/Google_Sheets-API_v4-34A853?logo=googlesheets&logoColor=white)](https://developers.google.com/sheets/api)

## Overview

The dashboard reads placement data from a single Google Spreadsheet with **3 required tabs**. The sheet must be shared with the service account email as a **Viewer** (read-only access).

## Required Tabs

The spreadsheet must contain exactly these 3 tab names (case-sensitive):

| Tab Name | Purpose | Managed By |
|----------|---------|------------|
| `Master` | Student records (demographics, status) | Placement cell |
| `Offer_Details` | Individual offer entries | Placement cell |
| `Access` | Email-to-role mapping for dashboard access | Dashboard admin |

> **Important:** The tab name `Offer_Details` uses an **underscore**, not a space.

---

## Tab 1: Master

Contains one row per student with their placement status.

| Column | Field | Format | Example |
|--------|-------|--------|---------|
| A | Roll No | 8-digit number | `22110164` |
| B | Reg No | 11-digit number | `22110164001` |
| C | Name | All caps | `JOHN DOE` |
| D | Gender | `Male` or `Female` | `Male` |
| E | Class | `AIDS`, `IOT`, or `CS` | `AIDS` |
| F | Section | `A`, `B`, or empty (CS has no section) | `A` |
| G | Choice | `Placement`, `Higher Studies`, or `Placement Exempt` | `Placement` |
| H | Status | `Placed`, `Not Placed`, `Hold`, `Dropped`, or `LOR Issued` | `Placed` |
| I | Company | Comma-separated company names | `Google, Amazon` |

**Notes:**
- Row 1 is treated as a header and skipped
- CS class has no section — leave Column F empty
- Company column lists all companies that made offers (comma-separated)
- Each student appears exactly once

---

## Tab 2: Offer_Details

Contains one row per offer (students with multiple offers have multiple rows).

| Column | Field | Format | Example |
|--------|-------|--------|---------|
| A | Roll Number | 8-digit number (FK to Master) | `22110164` |
| B | Name | Title case | `John Doe` |
| C | Company | Single company name | `Google PPO` |
| D | CTC / Stipend | Numeric INR value | `5900000` |
| E | Offer Type | `Regular`, `Dream`, `Super Dream`, `Marquee`, or `Internship` | `Marquee` |
| F | Offer Date | `dd-MMM-yyyy` format (some may be blank) | `30-Jul-2025` |

**Notes:**
- Roll Number links to Column A in Master
- CTC is stored in **rupees** (not lakhs) — e.g., `5900000` for 59 LPA
- A student with 3 offers will have 3 rows here
- Offer Date may be blank for some entries

**Offer Type Ranking** (lowest to highest):

```
Internship → Regular → Dream → Super Dream → Marquee
```

---

## Tab 3: Access

Controls who can sign in and their role.

| Column | Field | Format | Example |
|--------|-------|--------|---------|
| A | Email | Google email address | `john@university.edu` |
| B | Role | `admin` or `viewer` | `admin` |

**Notes:**
- Only emails listed here can sign in to the dashboard
- Unknown emails are **blocked** at sign-in and logged for review
- The access list is cached for 1 minute on the server

---

## Google Cloud Setup

### 1. Enable the Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services → Library**
4. Search for **Google Sheets API** and enable it

### 2. Create a Service Account

1. Navigate to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Name it (e.g., `placement-dashboard-reader`)
4. No roles needed at the project level
5. Create a **JSON key** and download it
6. Extract `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
7. Extract `private_key` → `GOOGLE_PRIVATE_KEY`

### 3. Share the Spreadsheet

1. Open the Google Spreadsheet
2. Click **Share**
3. Add the service account email (from step 2.6) as **Viewer**
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
5. Set `GOOGLE_SHEET_ID` in your environment

### 4. Create OAuth 2.0 Client

1. In **APIs & Services → Credentials**, click **Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.com/api/auth/callback/google
   ```
4. Copy Client ID → `GOOGLE_OAUTH_CLIENT_ID`
5. Copy Client Secret → `GOOGLE_OAUTH_CLIENT_SECRET`

---

## Data Validation

The dashboard validates all data from the sheets at parse time. Invalid values are handled as follows:

| Field | Invalid Value Handling |
|-------|----------------------|
| Class | Rejects row if not `AIDS`, `IOT`, or `CS` |
| Gender | Defaults parsing; logs warning |
| Choice | Must be `Placement`, `Higher Studies`, or `Placement Exempt` |
| Status | Must be `Placed`, `Not Placed`, `Hold`, `Dropped`, or `LOR Issued` |
| Offer Type | Must match one of 5 valid types |
| CTC | Parsed to number; 0 if invalid |
| Offer Date | Parsed from `dd-MMM-yyyy`; null if invalid |

## CTC Bucket Distribution

The dashboard groups CTC values into these ranges for histogram display:

| Bucket | Range |
|--------|-------|
| 3-5L | 3,00,000 – 4,99,999 |
| 5-8L | 5,00,000 – 7,99,999 |
| 8-12L | 8,00,000 – 11,99,999 |
| 12-20L | 12,00,000 – 19,99,999 |
| 20-50L | 20,00,000 – 49,99,999 |
| 50L+ | 50,00,000+ |

> **Note:** Internship offers are excluded from all CTC analytics.
