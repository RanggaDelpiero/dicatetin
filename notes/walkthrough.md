# Pundi — Implementation Walkthrough

A complete, gamified personal finance tracker PWA with iOS-native feel, built using Next.js 16, TypeScript, Tailwind CSS v4, Zustand, and Framer Motion.

---

## 📸 Media & Visual Demos

### Dashboard (Fase 1)
![Pundi Dashboard](C:/Users/rangg/.gemini/antigravity-ide/brain/745c4c33-0f02-4eea-aeea-80568389a1dd/pundi_dashboard_maximized_1783582686982.png)
![Dashboard interaction recording](C:/Users/rangg/.gemini/antigravity-ide/brain/745c4c33-0f02-4eea-aeea-80568389a1dd/pundi_dashboard_preview_1783582653640.webp)

### AI Advisor & Bulk Entry (Fase 2 Flow)
![AI & Bulk Entry Flow](C:/Users/rangg/.gemini/antigravity-ide/brain/745c4c33-0f02-4eea-aeea-80568389a1dd/pundi_fase2_flow_1783583291838.webp)

### Populated Dashboard (with Dummy Data)
![Populated Dashboard](C:/Users/rangg/.gemini/antigravity-ide/brain/745c4c33-0f02-4eea-aeea-80568389a1dd/dashboard_overview_1783583826485.png)
![Dummy Data Injection Flow](C:/Users/rangg/.gemini/antigravity-ide/brain/745c4c33-0f02-4eea-aeea-80568389a1dd/pundi_dummy_data_injection_1783583785247.webp)

### Bulk Transaction Page
![Bulk Transactions](C:/Users/rangg/.gemini/antigravity-ide/brain/745c4c33-0f02-4eea-aeea-80568389a1dd/bulk_transactions_1783583351409.png)

---

## 🛠️ Architecture

### Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + Custom design tokens |
| Animation | Framer Motion (spring physics) |
| State | Zustand (persisted to localStorage) |
| Icons | Phosphor Icons (duotone/regular) |
| Charts | Custom SVG donut chart |
| AI Integration | Claude Sonnet 4.5 via server proxy to openagentic.id |

### File Structure Created
```
dicatetin/
├── app/
│   ├── globals.css               # Full design system
│   ├── layout.tsx                # Root layout (PWA meta)
│   ├── page.tsx                  # → redirects to /dashboard
│   ├── api/
│   │   └── advisor/
│   │       └── route.ts          # Server-side AI API Proxy
│   └── (main)/
│       ├── layout.tsx            # Tab bar + modals
│       ├── advisor/
│       │   └── page.tsx          # AI Advisor Chat Page
│       ├── dashboard/
│       │   └── page.tsx          # Main dashboard
│       ├── debts/
│       │   └── page.tsx          # Hutang, Piutang, Split Bill Page
│       ├── transactions/
│       │   ├── page.tsx          # Transaction list
│       │   └── bulk/
│       │       └── page.tsx      # Bulk/Massal Input Page
│       ├── wallets/
│       │   └── page.tsx          # Wallet management
│       └── profile/
│           └── page.tsx          # Profile & achievements
├── components/
│   ├── ui/
│   │   ├── BottomTabBar.tsx      # iOS-style tab bar + FAB
│   │   ├── BottomSheet.tsx       # Draggable sheet modal
│   │   ├── ProgressRing.tsx      # SVG ring (XP/debt)
│   │   └── DynamicIcon.tsx       # Icon name → component
│   ├── transactions/
│   │   └── AddTransactionSheet.tsx  # Full transaction form
│   ├── charts/
│   │   └── DonutChart.tsx        # Category donut
│   ├── debts/
│   │   ├── DebtTab.tsx           # Hutang saya
│   │   ├── ReceivableTab.tsx     # Hutang orang
│   │   └── SplitBillTab.tsx      # Split bill session
│   └── gamification/
│       ├── StreakFlame.tsx        # Animated flame
│       └── LevelUpModal.tsx      # Confetti celebration
├── lib/
│   ├── types.ts                  # All TypeScript types
│   ├── stores/
│   │   ├── transaction-store.ts  # Transactions + categories
│   │   ├── wallet-store.ts       # Wallets + balances
│   │   ├── debt-store.ts         # Debt + payments
│   │   ├── receivable-store.ts   # Piutang + payments
│   │   ├── splitbill-store.ts    # Split bill sessions
│   │   └── advisor-store.ts      # AI chat messages
│   ├── gamification/
│   │   ├── xp.ts                 # Level system
│   │   ├── streak.ts             # Streak logic
│   │   └── badges.ts             # 12 badge definitions
│   ├── ai/
│   │   └── context.ts            # AI context assembler
│   ├── data/
│   │   └── presets.ts            # Categories + defaults
│   └── utils/
│       ├── currency.ts           # IDR formatting
│       ├── date.ts               # Indonesian dates
│       └── haptic.ts             # Vibration API
└── public/
    ├── manifest.json             # PWA manifest
    └── icons/
        └── icon-512.svg          # App icon
```

---

## 📱 Features

### 1. Dashboard (`/dashboard`)
- **Greeting header** with "Halo, Rangga 👋" and current month.
- **Total balance card** with gradient (indigo → green), wallet pills, and **"Kelola" link** to wallets page.
- **AI Advisor Shortcut** robot icon in the header.
- **Income/expense summary** for current month.
- **XP & Level card** showing progress ring and level title.
- **Category spending donut chart** with legend.
- **Recent transactions** list (last 5) and quick highlight card.

### 2. Transactions & Bulk Entry (`/transactions`, `/transactions/bulk`)
- **Period Filter**: segmented control (Minggu/Bulan/Semua).
- **Search bar** to quickly locate transactions.
- **Swipe-to-delete** with iOS-native drag gesture.
- **Bulk Transaction Page**:
  - Add multiple rows of expenses at once.
  - Set default Category/Wallet quickly across all rows.
  - Auto-calculates total and saves batch transactions.

### 3. Hutang, Piutang & Split Bill (`/debts`)
- **Hutang Saya (Debts)**:
  - Add debts with due date and notes.
  - Progress bar + Progress ring showing how much has been repaid.
  - Repay debts in installments.
- **Hutang Orang (Receivables)**:
  - Track who owes money to you.
  - Support for partial payment tracking.
- **Split Bill**:
  - Group split session creation.
  - Add participants with custom chip tags.
  - Divides bill equally (or custom).
  - Automatically spawns Receivable instances for unpaid participants.

### 4. AI Advisor (`/advisor`)
- Chat interface directly communicating with **Claude 4.5 Sonnet** on `openagentic.id`.
- **Privacy First**: only sends a generated summary of balances and trends — never raw dumps of transactions.
- **Indonesian Persona**: speaks in a casual, supportive, and friendly tone (Pundi 🐷).
- Quick suggestion chips and full chat history persistence (with clear option).

### 5. Profile & Achievements (`/profile`)
- **XP Progress Ring** around Pundi mascot.
- **Badge Shelf**: unlock 12 distinct achievements (silhouette for locked ones).
- Dark mode toggle, total stats counter, and data reset button.

---

## 🧪 Verification & Quality Check

| Metric | Status | Note |
|---|---|---|
| **TypeScript compile** | ✅ Pass | Zero compiler errors or warnings |
| **Production build** | ✅ Pass | Full build generated successfully |
| **PWA Installability** | ✅ Pass | manifest.json + custom icon configured |
| **AI API Call** | ✅ Pass | Handled successfully with casual Indonesian replies |
| **Gamification Flow** | ✅ Pass | XP increases and level-up modals celebrate achievements |
