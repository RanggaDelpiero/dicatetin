# Design.md — Pundi: Design System & UX Guidelines

## 1. Filosofi Desain

Pundi harus terasa seperti **native iOS app** dari segi struktur & interaksi (tab bar bawah, sheet modal yang naik dari bawah, swipe gesture, haptic feedback), tapi dengan kepribadian **playful & warm** dari segi visual — warna cerah, ilustrasi bulat/soft, micro-copy yang ngobrol santai, dan mascot kecil bernama **Pundi** (celengan/koin dengan wajah) yang muncul di momen-momen pencapaian.

Referensi rasa: iOS Wallet/Settings app (struktur & kredibilitas) + Duolingo (gamifikasi & kepribadian) + Cash App (playful finance color).

## 2. Design Tokens

### Warna (Light Mode)
| Token | Hex | Pemakaian |
|---|---|---|
| `--bg-primary` | `#F7F7FA` | background utama |
| `--bg-elevated` | `#FFFFFF` | card, sheet |
| `--accent-primary` | `#22C55E` | income, positif, CTA utama (hijau — asosiasi uang masuk/untung) |
| `--accent-secondary` | `#6366F1` | elemen interaktif sekunder, highlight AI advisor |
| `--accent-warning` | `#F59E0B` | pengeluaran besar, reminder jatuh tempo |
| `--accent-danger` | `#EF4444` | expense, hutang, alert |
| `--text-primary` | `#111114` | teks utama |
| `--text-secondary` | `#6B7280` | teks sekunder/caption |
| `--gamify-gold` | `#FFC53D` | XP, badge, streak flame |

### Warna (Dark Mode)
- `--bg-primary` → `#0B0B0D`, `--bg-elevated` → `#18181B`, teks disesuaikan kontras WCAG AA minimum.
- Warna aksen tetap sama, hanya diberi sedikit boost saturasi agar tetap jelas di background gelap.

### Tipografi
- Font stack: `-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif` — supaya otomatis pakai SF Pro asli di iOS tanpa perlu embed font (menghormati lisensi Apple).
- Scale: Caption 12px, Body 15px, Body Emphasis 17px (setara iOS default), Title 22px, Large Title 34px (dipakai di header dashboard, ala native iOS large title yang collapse saat scroll).
- Angka finansial (`saldo`, `nominal transaksi`) pakai *tabular figures* (`font-variant-numeric: tabular-nums`) supaya angka rapi sejajar di list.

### Spacing & Radius
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 (kelipatan 4, konsisten dengan grid iOS).
- Corner radius: 14px untuk card, 20px untuk bottom sheet, full-round untuk badge/avatar.
- Shadow: soft, low-opacity (`0 2px 12px rgba(0,0,0,0.06)`), hindari shadow tajam ala Material Design.

## 3. Navigasi & Layout

- **Bottom tab bar** (5 item): Dashboard, Transaksi, **[+] Tambah (FAB tengah, elevated)**, Hutang/Split, Profil & Achievement.
- Header pakai pola **Large Title yang collapse** saat scroll ke atas (persis iOS native — misal Settings app).
- Semua layout full-screen menghormati `env(safe-area-inset-top/bottom)` — konten tidak pernah kepotong notch atau home indicator.
- Detail/form dibuka sebagai **bottom sheet modal** (naik dari bawah, bisa di-dismiss dengan swipe-down), bukan full page navigation — ini pola yang paling "iOS-native" untuk aksi cepat seperti tambah transaksi.

## 4. Komponen Kunci

- **Transaction List Item**: ikon kategori bulat berwarna, nama & catatan, nominal (hijau untuk income, merah untuk expense), swipe-left untuk edit/hapus (pola native iOS Mail app).
- **Wallet Card**: kartu dengan warna custom per kantong, saldo besar di tengah, ikon kecil (cash/bank/e-wallet).
- **Segmented Control**: dipakai untuk switch periode (Minggu/Bulan/Custom) di dashboard — pola native iOS.
- **Progress Ring**: dipakai untuk XP menuju level berikutnya dan progress pelunasan hutang.
- **Bottom Sheet Form**: form tambah transaksi/hutang/split bill, drag handle di atas, tombol submit besar full-width di bawah (thumb-friendly).

## 5. Sistem Visual Gamifikasi

- **Streak (flame icon)**: ditampilkan di pojok atas dashboard, angka hari beruntun, warna berubah makin intens (kuning → oranye → merah) makin panjang streak-nya.
- **XP Progress Ring**: melingkari avatar/mascot Pundi di halaman profil, terisi progresif tiap kali dapat XP dengan animasi spring (bukan linear).
- **Badge Shelf**: grid badge di halaman Achievement, badge yang belum didapat ditampilkan silhouette abu-abu (menimbulkan rasa penasaran/koleksi).
- **Level-Up Modal**: full-screen celebratory modal — confetti animation ringan, mascot Pundi melompat, micro-copy fun contoh: *"Level naik! Pundi makin gendut nih 🐷"*.
- **Micro-copy tone**: santai, hangat, sedikit humor, selalu bahasa Indonesia casual — hindari nada korporat/formal di semua notifikasi & empty state.

## 6. Interaksi & Animasi

- Semua transisi pakai **spring physics** (Framer Motion `type: "spring", stiffness: 300, damping: 25` sebagai default), bukan easing linear/ease-in-out generik — ini yang bikin terasa "native iOS" bukan "web app biasa".
- **Haptic feedback** (via Vibration API, degrade gracefully kalau tidak didukung):
  - Light tap → navigasi tab/toggle.
  - Medium → konfirmasi submit form.
  - Success pattern (double-pulse) → transaksi berhasil tersimpan, hutang lunas.
- **Pull-to-refresh** di halaman dashboard & transaksi.
- **Swipe-to-delete/edit** di list item (pola native iOS, bukan tombol edit terpisah).

## 7. Ikonografi

- Phosphor Icons, varian **Duotone** untuk state aktif dan **Regular** untuk state default — memberi kesan playful tanpa kehilangan kerapian line-icon ala iOS (SF Symbols-like).
- Ikon kategori transaksi dibuat rounded-bulat dengan warna solid background, bukan flat monokrom — ini elemen utama yang bikin app terasa "fun" dari sekadar utility app.

## 8. Aksesibilitas

- Kontras teks minimum WCAG AA di kedua mode (light/dark).
- Dukung **Dynamic Type** (font scaling ikut setting aksesibilitas iOS) — gunakan unit `rem`, hindari `px` fixed untuk teks.
- Semua ikon interaktif punya `aria-label` deskriptif untuk VoiceOver.
- Warna tidak jadi satu-satunya penanda income/expense — selalu disertai ikon panah (↑/↓) sebagai redundansi visual.

## 9. Contoh Layar Kunci (Deskripsi)

1. **Dashboard**: Large title "Halo, Rangga 👋" collapse saat scroll, di bawahnya kartu saldo total (swipeable antar kantong), chart donat kategori pengeluaran, section "Highlight Minggu Ini" (card carousel), streak flame di pojok kanan atas.
2. **Tambah Transaksi (bottom sheet)**: keypad angka besar di tengah, pilihan kategori berupa scrollable row ikon bulat, toggle income/expense di atas, tombol simpan full-width hijau.
3. **Wallets**: horizontal scroll kartu kantong dengan warna berbeda, tombol "+ Tambah Kantong" di ujung.
4. **Hutang & Split Bill**: dua tab (Hutang Saya / Hutang Orang), tiap item pakai progress bar pelunasan; split bill punya flow terpisah — pilih peserta, input item/nominal, preview hasil split sebelum share.
5. **Achievement/Profil**: avatar mascot Pundi di tengah dengan XP ring, badge shelf di bawahnya, riwayat streak dalam bentuk kalender mini (mirip GitHub contribution graph tapi bulat-bulat).
6. **AI Advisor (chat)**: bubble chat dengan avatar mascot Pundi sebagai "AI", quick-reply suggestion chips di atas keyboard (misal "Analisa bulan ini", "Saran hemat"), disclaimer kecil di bawah header bahwa ini bukan nasihat finansial profesional.
