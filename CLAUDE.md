# CLAUDE.md — Pundi (Personal Finance Tracker PWA)

> Panduan kerja untuk Claude Code / AI coding assistant saat membangun & maintain codebase **Pundi**.
> Baca file ini dulu sebelum ngoding. Untuk requirement produk lengkap → `PRD.md`. Untuk visual/UX → `Design.md`.

## 1. Tentang Project

Pundi adalah PWA pencatat keuangan pribadi, dioptimasi buat dipakai di iPhone (Add to Home Screen), dengan tampilan native-iOS-like tapi fun & digamify — nyatet duit rasanya kayak main, bukan kerjaan.

## 2. Tech Stack & Alasan

> ✅ **Update**: tabel di bawah sudah disesuaikan dengan implementasi aktual (per Fase 2, lihat `walkthrough.md`). Baris yang berubah dari rencana awal ditandai.

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | ⚠️ *update dari rencana awal (Next.js 14)* |
| Styling | Tailwind CSS v4 + design tokens custom (lihat `Design.md`) | ⚠️ *update ke v4* |
| UI primitives | Custom components (`components/ui/`) — tanpa shadcn/Radix | ⚠️ *dibangun manual, bukan pakai UI kit* — pastikan tetap accessible (label, focus state, aria) walau custom |
| Animasi | Framer Motion | spring physics buat micro-interaction ala iOS |
| State & persistence | Zustand + `persist` middleware → `localStorage` | ⚠️ **deviasi besar**: client-only, tanpa backend. Offline-native "gratis", tapi data cuma hidup di 1 browser (lihat §11 Data Safety) |
| DB + Auth (belum dipakai) | ~~Supabase~~ — tidak diimplementasikan | opsional untuk fase depan kalau butuh multi-device sync/cloud backup, bukan blocker untuk sekarang |
| Charts | Custom SVG donut chart | ⚠️ *lebih ringan daripada Recharts/Tremor, cocok buat kontrol visual penuh ala Design.md* |
| Icons | Phosphor Icons (duotone/regular) | rounded, playful, tetap rapi ala iOS |
| PWA | Web App Manifest + custom service worker | installable + offline utk transaksi |
| Hosting | Vercel | native fit dengan Next.js |
| AI Advisor | Server-side proxy route → `openagentic.id` (model `claude-sonnet-4.5`) | lihat §7 — sudah jalan & sesuai privacy-first design |

## 3. Struktur Folder (aktual — sinkron dengan `walkthrough.md`)

```
dicatetin/
├─ app/
│  ├─ globals.css                 # Design system lengkap (design tokens)
│  ├─ layout.tsx                  # Root layout (PWA meta)
│  ├─ page.tsx                    # → redirect ke /dashboard
│  ├─ api/
│  │  ├─ advisor/route.ts         # proxy server-side ke openagentic.id
│  │  └─ extract/                 # 🆕 receipt/route.ts, voice/route.ts
│  └─ (main)/
│     ├─ layout.tsx               # Tab bar + modals
│     ├─ dashboard/page.tsx       # ⚠️ hero-nya Budget Harian, lihat §11
│     ├─ budget/page.tsx          # 🆕 kelola budget per kategori (cascading)
│     ├─ transactions/
│     │  ├─ page.tsx
│     │  └─ bulk/page.tsx
│     ├─ wallets/page.tsx
│     ├─ debts/page.tsx           # tab Hutang Saya / Hutang Orang / Split Bill
│     ├─ advisor/page.tsx
│     └─ profile/page.tsx
├─ components/
│  ├─ ui/                         # BottomTabBar, BottomSheet, ProgressRing, DynamicIcon
│  ├─ transactions/AddTransactionSheet.tsx
│  ├─ capture/                    # 🆕 PhotoCaptureButton, VoiceCaptureButton, ExtractionReviewSheet
│  ├─ budget/                     # 🆕 BudgetCard (hero), BudgetCategoryRow, BudgetForm
│  ├─ charts/DonutChart.tsx
│  ├─ debts/                      # DebtTab, ReceivableTab, SplitBillTab
│  └─ gamification/               # StreakFlame, LevelUpModal
├─ lib/
│  ├─ types.ts
│  ├─ stores/                     # transaction, wallet, debt, receivable, splitbill, advisor
│  │  └─ budget-store.ts          # 🆕 budget per kategori + cascading calc
│  ├─ gamification/                # xp.ts, streak.ts, badges.ts
│  ├─ accounting/                 # 🆕 net-worth.ts, budget-cascade.ts (pure functions, unit-tested)
│  ├─ ai/context.ts
│  ├─ data/presets.ts
│  └─ utils/                      # currency.ts, date.ts, haptic.ts
└─ public/
   ├─ manifest.json
   └─ icons/icon-512.svg
```

> Catatan penamaan: folder project-nya `dicatetin/` tapi brand/UI-nya "Pundi" — gak masalah secara teknis, tapi pastikan konsisten kalau mau di-rename repo-nya nanti.

## 4. Coding Conventions

- **TypeScript strict mode**, no implicit `any`.
- Komponen: PascalCase, satu komponen utama per file, colocate sub-komponen kecil di file yang sama kalau memang tightly coupled.
- Semua mutasi data (transaksi, wallet, budget, dll) lewat Zustand store actions — store adalah satu-satunya "source of truth", jangan mutate state di luar store.
- Uang disimpan sebagai **integer (rupiah, tanpa desimal)** untuk menghindari floating point error. Format ke tampilan pakai `Intl.NumberFormat('id-ID')`.
- Nama file: kebab-case untuk file non-komponen, PascalCase untuk komponen React.
- Commit message: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).

### 🔴 Aturan wajib: warna teks — TIDAK BOLEH hardcode

Bug "tulisan gak keliatan" di list transaksi hampir pasti karena ada class warna teks yang di-hardcode (misal `text-white` atau `text-black`) yang gak beradaptasi waktu background/tema berubah (light/dark mode, atau card dengan bg custom per-kategori/per-wallet).

**Aturan ke depan:**
- **Jangan pernah** pakai `text-white`, `text-black`, atau hex warna teks langsung di komponen.
- **Selalu** pakai token semantik dari `globals.css` (`--text-primary`, `--text-secondary`, `--text-on-accent` untuk teks di atas background berwarna solid seperti wallet card/kategori).
- Setiap komponen baru yang punya background custom/dinamis (wallet card, category chip) **wajib** dites di kedua mode (light & dark) sebelum dianggap selesai.
- Kalau mau gue bantu benerin bug ini secara langsung, share aja file `TransactionList`/`page.tsx` transaksi atau `globals.css`-nya — gue cek exact class yang bermasalah.

## 5. Environment Variables

Buat `.env.local` (JANGAN pernah commit ke git — sudah harus ada di `.gitignore`):

```env
# AI Personal Financial Advisor (satu-satunya dependency eksternal saat ini)
AI_ADVISOR_BASE_URL=https://openagentic.id/api/v1
AI_ADVISOR_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_ADVISOR_MODEL=claude-sonnet-4.5

# Supabase — opsional, baru dipakai kalau migrasi ke cloud sync (belum diimplementasikan)
# NEXT_PUBLIC_SUPABASE_URL=xxx
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# SUPABASE_SERVICE_ROLE_KEY=xxx
```

⚠️ **Catatan keamanan**: key yang sempat kamu tulis di chat sebaiknya di-*rotate* dulu di dashboard openagentic.id sebelum dipakai production. Key hanya boleh diakses dari server (API route/Server Action), tidak pernah dari client bundle.

## 6. Commands (usulan `package.json`)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  }
}
```

> `db:types` (Supabase codegen) dihapus dari list — gak relevan selama masih client-only storage.

## 7. AI Advisor Integration — Aturan Wajib

1. **Selalu lewat server** (`app/api/advisor/route.ts`). Client **tidak pernah** memanggil `openagentic.id` langsung, dan API key tidak pernah ada di kode client.
2. Request ke endpoint pakai format chat-completion standar (kompatibel OpenAI-style atau Anthropic `/v1/messages`, sesuaikan dengan dokumentasi resmi openagentic.id — cek dulu response schema aktualnya sebelum asumsi format, karena base URL ini adalah proxy pihak ketiga, bukan endpoint resmi Anthropic).
3. **Konteks yang dikirim ke AI** hanya ringkasan finansial yang relevan (total saldo per kantong, kategori pengeluaran terbesar, tren bulan berjalan) — bukan raw dump seluruh riwayat transaksi, untuk efisiensi token dan privasi.
4. Tangani rate-limit & error dengan fallback message yang tetap berguna ("Lagi rame nih, coba beberapa saat lagi ya"), jangan biarkan UI blank/crash.
5. Riwayat chat advisor disimpan di `advisor-store.ts` (Zustand → localStorage), beri user opsi untuk clear history.
6. Jangan log isi request/response yang mengandung data finansial personal ke console/analytics pihak ketiga.

## 8. Offline & PWA Notes

- ✅ Karena storage-nya client-only (Zustand + localStorage), pencatatan transaksi **sudah offline-native by default** — tidak butuh sync queue karena memang tidak ada round-trip ke server. Trade-off-nya ada di §11 (Data Safety).
- `manifest.json`: set `display: "standalone"`, `theme_color` & `background_color` sesuai token di `Design.md`, sediakan icon 180x180 untuk `apple-touch-icon`.
- Tambahkan meta tag khusus iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, splash screen images untuk beberapa ukuran layar iPhone.
- Hormati **safe-area-inset** (notch & home indicator) di semua layout full-screen — pakai `env(safe-area-inset-*)`.

## 9. Testing Strategy

- Unit test untuk semua logic di `lib/accounting/` dan `lib/gamification/` (pure functions, gampang di-test tanpa mock):
  - `budget-cascade.ts` — pembagian monthly → weekly → daily harus akurat (termasuk edge case bulan 28/29/30/31 hari).
  - `net-worth.ts` — Total Aset − Total Liabilitas harus konsisten dengan data hutang/piutang/wallet.
  - Split bill divider, XP/level, streak counter — target coverage tinggi karena ini logic sensitif angka.
- Snapshot/visual test untuk komponen dengan background dinamis (wallet card, category chip) di light & dark mode — supaya bug "teks gak keliatan" gak kejadian lagi tanpa ketauan sebelum ship.
- Manual QA di Safari iOS (bukan cuma Chrome desktop) sebelum tiap rilis, karena banyak quirk PWA khusus iOS.

## 10. Referensi

- Requirement fitur lengkap → `PRD.md`
- Design system, komponen, gamifikasi visual → `Design.md`

## 11. Data Safety — Wajib Sebelum Dipakai Serius

Karena saat ini **tidak ada backend** (§2), semua data finansial hidup 100% di `localStorage` satu browser/device. Ini artinya:

- Clear cache, ganti HP, atau reinstall PWA = **semua data hilang, tidak bisa dipulihkan**.
- Ini blocker serius kalau app mau dipakai buat nyatet keuangan beneran (bukan cuma demo).

**Wajib ditambahkan sebelum dianggap "siap pakai":**
1. **Export ke JSON** — tombol di Profile untuk download seluruh state (transaksi, wallet, debt, receivable, budget, achievement) sebagai satu file `.json`.
2. **Import dari JSON** — restore dari file export, dengan konfirmasi (replace vs merge) supaya user gak nge-overwrite data tanpa sadar.
3. (Opsional, fase depan) Auto-backup berkala ke Google Drive/iCloud lewat Web Share API, atau migrasi penuh ke Supabase kalau butuh multi-device sync.

## 12. Accounting & Budget Logic — Aturan Perhitungan

Supaya konsisten dan gak salah hitung, semua logic di bawah ini harus jadi **pure function** yang di-unit-test (lihat §9), ditaruh di `lib/accounting/`.

### 12.1 Terminologi & Net Worth
- **Hutang (Liabilities)** — uang yang harus user bayar ke pihak lain. Mengurangi net worth.
- **Piutang (Receivables)** — uang yang harus diterima user dari pihak lain (termasuk hasil split bill yang belum dibayar peserta). Ini **aset**, menambah net worth.
- **Net Worth (Kekayaan Bersih)** = `(Total saldo semua wallet + Total Piutang belum lunas) − Total Hutang belum lunas`.
- Tampilkan Net Worth sebagai metric baru (lihat `PRD.md` §5.10 & `Design.md` untuk penempatan visual).

### 12.2 Budget Cascade (Bulanan → Mingguan → Harian)
- **Sumber kebenaran = Budget Bulanan per kategori** (input user).
- Turunan otomatis (jangan biarkan user input manual weekly/daily — itu tempat paling gampang jadi tidak sinkron):
  - `dailyBudget = monthlyBudget / jumlahHariDiBulanIni` (pakai jumlah hari kalender aktual: 28/29/30/31, bukan konstanta 30).
  - `weeklyBudget = dailyBudget * 7`.
- **Total budget** (semua kategori) = penjumlahan seluruh `monthlyBudget` per kategori. Ini otomatis, user tidak input total secara terpisah kecuali mau set overall cap (opsional).
- **Sisa budget harian** = `dailyBudget − total pengeluaran hari ini (kategori yang punya budget)`. Kategori tanpa budget diset tidak dihitung ke progress bar ini.
- Status warna: hijau (< 70% terpakai), kuning (70–100%), merah (> 100%, over budget) — reuse token warna yang sama dengan §2 di `Design.md`.

## 13. Fitur Input via Foto & Suara — Arsitektur Teknis

### 13.1 Foto Struk (Vision)
- Endpoint baru, server-only: `app/api/extract/receipt/route.ts` (pola sama seperti `app/api/advisor/route.ts` di §7 — API key tidak pernah ke client).
- ⚠️ **Verifikasi dulu**: pastikan endpoint `openagentic.id` memang mendukung image input (multimodal), sama seperti catatan di §7 poin 2 — jangan asumsikan format tanpa cek dokumentasi resminya.
- **Client-side**: resize/compress foto dulu sebelum upload — target maks ~1600px sisi terpanjang, JPEG quality ~0.8. Ini penting buat hemat payload, biaya token, dan kecepatan di koneksi mobile.
- **Prompt**: minta AI mengembalikan **JSON strict** (bukan free text) dengan shape kira-kira:
  ```json
  { "merchant": "string", "date": "YYYY-MM-DD", "items": [{"name": "string", "price": 0, "qty": 1}], "total": 0, "suggestedCategory": "string", "confidence": "high|medium|low" }
  ```
- Field `confidence` dipakai buat highlight visual di layar review (lihat `Design.md`).
- Foto asli disimpan sebagai attachment transaksi (field `foto struk` yang sudah ada di `PRD.md` §5.1).

### 13.2 Suara (Speech-to-Text → Text Extraction)
- Model teks (termasuk `claude-sonnet-4.5`) **tidak menerima audio langsung** — audio wajib dikonversi ke teks dulu sebelum dikirim ke AI.
- **Opsi default**: Web Speech API (`webkitSpeechRecognition`/`SpeechRecognition`), gratis & jalan di browser. ⚠️ Dukungan di Safari iOS perlu ditest langsung di device asli — kalau tidak reliable, siapkan fallback (misal tombol "ketik manual" muncul otomatis kalau API gagal/tidak tersedia).
- Alur: rekam suara → dapat transcript teks → kirim transcript ke endpoint ekstraksi (bisa reuse `/api/advisor` dengan prompt berbeda, atau endpoint baru `app/api/extract/voice/route.ts`) → AI kembalikan JSON serupa §13.1 (jumlah, kategori, wallet hint, catatan, dan untuk split bill: daftar peserta bila disebutkan).
- **Disclosure ke user**: Web Speech API di kebanyakan browser (terutama Chrome) memproses audio lewat server vendor browser (Google/Apple), bukan lewat `openagentic.id`. Tampilkan info singkat pertama kali fitur ini dipakai (misal di permission prompt mic).

### 13.3 Human-in-the-Loop — Wajib, Tanpa Kecuali
- Hasil ekstraksi (foto maupun suara) **tidak pernah auto-save**. Selalu tampilkan layar review dengan field editable sebelum data masuk ke store.
- Field dengan `confidence: "low"` dari AI ditandai border warning di UI review.

### 13.4 Error Handling & Fallback
- Kalau ekstraksi gagal (network, API error, respons AI tidak valid JSON) → fallback langsung ke form manual, jangan biarkan user stuck.
- Rate-limit/error handling mengikuti pola yang sama seperti AI Advisor (§7 poin 4).

### 13.5 Privasi
- Foto struk & transkrip suara dikirim ke pihak ketiga (`openagentic.id`) — perlakuan privasi sama seperti §7: jangan log isi request/response ke console/analytics, dan jangan retain foto/transkrip di server kita sendiri lebih lama dari yang dibutuhkan untuk proses ekstraksi.
