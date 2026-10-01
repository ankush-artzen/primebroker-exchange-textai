# Prime Brokers MVP

Mobile-friendly CRM for real-estate brokers — manage leads, properties, and daily follow-ups.

## Stack

- **Frontend:** Next.js 16 (React) + Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** MongoDB Atlas via **Prisma** (not Mongoose)
- **Photos:** Cloudinary
- **AI:** OpenAI or Anthropic Claude Haiku (voice lead parsing)
- **PWA:** Installable on Android home screen

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Fill in `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB Atlas connection string |
| `OPENAI_API_KEY` | For voice lead extraction (preferred if set) |
| `ANTHROPIC_API_KEY` | Alternate AI provider for voice lead extraction |
| `AI_PROVIDER` | Optional: `openai` or `anthropic` to force a provider |
| `CLOUDINARY_*` | For property photo uploads |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID from the [console](https://console.twilio.com/) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token from the console |
| `TWILIO_VERIFY_SERVICE_SID` | Verify Service SID (`VA…`). Create under **Verify → Services**. No phone number purchase needed. |

3. Push schema to MongoDB:

```bash
npm run db:push
```

4. Add PWA icons to `public/icons/` (`icon-192.png`, `icon-512.png`).

5. Twilio OTP (no phone number purchase):
   - Open [Twilio Console](https://console.twilio.com/) → copy **Account SID** and **Auth Token**
   - Go to **Verify → Services → Create new** (name it `Prime Brokers`)
   - Copy the Service SID (`VA…`) into `TWILIO_VERIFY_SERVICE_SID`
   - Trial accounts can only SMS numbers listed under **Phone Numbers → Manage → Verified Caller IDs**

6. Start dev server:

```bash
npm run dev
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/send-otp` | Send SMS OTP via Twilio Verify |
| POST | `/api/auth/verify-otp` | Check OTP; returning brokers are logged in |
| POST | `/api/users/identify` | Create broker after OTP (new accounts) |
| GET | `/api/leads` | List all leads |
| POST | `/api/leads` | Create lead |
| PATCH | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead |
| GET | `/api/leads/today` | Today's & overdue follow-ups |
| GET | `/api/properties` | List properties |
| POST | `/api/properties` | Create property |
| PATCH | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| POST | `/api/ai/parse-lead` | AI extract lead from voice text |
| POST | `/api/upload` | Upload photos to Cloudinary |

Auth: pass `x-user-id` header (stored in browser localStorage after onboarding).

## Features

- **Broker identity** — phone OTP via Twilio Verify, then name for new accounts
- **Leads** — CRUD, follow-up dates, call/WhatsApp, reschedule
- **Voice capture** — English/Hindi/Punjabi speech → OpenAI or Claude Haiku → pre-filled form
- **Properties** — CRUD with Cloudinary photo uploads
- **Today screen** — overdue + due today, sorted by date
- **PWA** — manifest + service worker for home-screen install

## 7-Day Plan

| Day | Focus |
|-----|-------|
| 1 | Prisma schema, auth, project scaffold |
| 2 | Leads CRUD + Today screen |
| 3 | Properties + Cloudinary uploads |
| 4 | Voice capture + AI parsing |
| 5 | Detail sheets, reschedule, polish |
| 6 | PWA, mobile UX, testing |
| 7 | Deploy (Vercel + MongoDB Atlas) |
