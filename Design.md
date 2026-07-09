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

> 🔴 **Aturan wajib**: teks **tidak boleh** pakai class hardcode (`text-white`, `text-black`, hex langsung). Selalu pakai token semantik (`--text-primary`, `--text-secondary`, dan tambahkan `--text-on-accent` untuk teks di atas background solid berwarna seperti wallet card/category chip). Ini untuk mencegah bug seperti teks yang jadi tak terlihat di list transaksi — kemungkinan besar penyebabnya adalah class warna teks yang di-hardcode dan tidak beradaptasi ke background/tema yang berbeda.

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
- **🆕 Budget Harian Card (hero dashboard)**: elemen visual PALING besar/menonjol di Dashboard, di atas semua elemen lain. Berisi: label "Budget Harian", nominal terpakai vs total (misal "Rp85.000 / Rp150.000"), progress bar horizontal dengan warna status (hijau/kuning/merah — reuse `--accent-primary/--accent-warning/--accent-danger`), dan teks kecil sisa per kategori di bawahnya (tappable untuk expand ke breakdown per kategori). Tap card ini membuka halaman `budget` untuk kelola budget bulanan.
- **🆕 Capture Buttons (foto & suara)**: dua tombol bulat kecil (ikon kamera & mic, Phosphor duotone) di header Add Transaction sheet & Split Bill flow, berdampingan dengan toggle income/expense. Mic button punya 3 state visual: idle (outline), recording (pulsing red dot + mini waveform animasi), processing (spinner kecil menggantikan ikon).
- **🆕 Extraction Review Sheet**: bottom sheet yang muncul setelah AI selesai ekstrak foto/suara — banner kecil di atas form bertuliskan *"Diekstrak otomatis — cek dulu ya sebelum simpan 🧐"*, field-field sama seperti form manual tapi sudah terisi, field dengan confidence rendah dari AI diberi border warning (`--accent-warning`) dan ikon kecil "⚠️ cek lagi".

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
- **🆕 Loading state ekstraksi AI**: skeleton/shimmer di area form + mascot Pundi kecil dengan animasi "membaca" (misal pakai kaca pembesar), micro-copy playful bergantian seperti *"Pundi lagi baca struk..."* atau *"Nerjemahin omongan kamu..."* — durasi biasanya singkat (beberapa detik), jadi animasi harus terasa ringan, bukan bikin nunggu berasa lama.

## 7. Ikonografi

- Phosphor Icons, varian **Duotone** untuk state aktif dan **Regular** untuk state default — memberi kesan playful tanpa kehilangan kerapian line-icon ala iOS (SF Symbols-like).
- Ikon kategori transaksi dibuat rounded-bulat dengan warna solid background, bukan flat monokrom — ini elemen utama yang bikin app terasa "fun" dari sekadar utility app.

## 8. Aksesibilitas

- Kontras teks minimum WCAG AA di kedua mode (light/dark).
- Dukung **Dynamic Type** (font scaling ikut setting aksesibilitas iOS) — gunakan unit `rem`, hindari `px` fixed untuk teks.
- Semua ikon interaktif punya `aria-label` deskriptif untuk VoiceOver.
- Warna tidak jadi satu-satunya penanda income/expense — selalu disertai ikon panah (↑/↓) sebagai redundansi visual.

## 9. Contoh Layar Kunci (Deskripsi)

1. **Dashboard [Update IA]**: urutan dari atas ke bawah sekarang: (1) header ringkas "Halo, Rangga 👋" + streak flame di pojok kanan, (2) **Budget Harian Card sebagai hero pertama** (lihat komponen §4), (3) kartu saldo total (swipeable antar kantong) + Net Worth kecil di sampingnya, (4) chart donat kategori pengeluaran, (5) section "Highlight Minggu Ini" (card carousel). Perubahan ini sengaja menggeser fokus dari "berapa saldo saya" menjadi "berapa yang boleh saya keluarkan hari ini" — lebih actionable buat kebiasaan harian.
2. **Tambah Transaksi (bottom sheet)**: keypad angka besar di tengah, pilihan kategori berupa scrollable row ikon bulat, toggle income/expense di atas, **🆕 tombol kamera & mic di pojok kanan atas form** (tap kamera → pilih foto/ambil foto; tap mic → mulai rekam), tombol simpan full-width hijau.
3. **Wallets**: horizontal scroll kartu kantong dengan warna berbeda, tombol "+ Tambah Kantong" di ujung.
4. **Hutang & Split Bill**: dua tab (Hutang Saya / Hutang Orang), tiap item pakai progress bar pelunasan; split bill punya flow terpisah — pilih peserta, **🆕 opsi "Scan Struk" di langkah awal (foto bill → item otomatis terisi) atau ketik manual**, input item/nominal, preview hasil split sebelum share.
5. **Achievement/Profil**: avatar mascot Pundi di tengah dengan XP ring, badge shelf di bawahnya, riwayat streak dalam bentuk kalender mini (mirip GitHub contribution graph tapi bulat-bulat).
6. **AI Advisor (chat)**: bubble chat dengan avatar mascot Pundi sebagai "AI", quick-reply suggestion chips di atas keyboard (misal "Analisa bulan ini", "Saran hemat"), disclaimer kecil di bawah header bahwa ini bukan nasihat finansial profesional.
