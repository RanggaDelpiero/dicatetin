# PRD.md — Pundi: Personal Finance Tracker PWA

## 1. Overview

**Pundi** adalah aplikasi pencatat keuangan pribadi berbentuk PWA, dioptimasi untuk iPhone, yang menggabungkan fungsi finance tracker lengkap dengan pengalaman yang *fun* dan *digamify* — supaya kebiasaan mencatat keuangan terasa ringan dan bikin ketagihan, bukan beban administratif.

**Masalah yang diselesaikan**: kebanyakan app finance tracker terasa kaku, form-heavy, dan gampang ditinggalkan setelah beberapa hari. Pundi mendekatinya seperti Duolingo mendekati belajar bahasa — streak, level, badge, dan feedback positif instan setiap kali user mencatat transaksi.

## 2. Target User

- Primary: individu produktif (mahasiswa/pekerja) yang sudah beberapa kali coba app finance tracker tapi gak konsisten pakai.
- Punya kebutuhan spesifik Indonesia: kantong/rekening multiple, hutang piutang informal antar teman/keluarga, split bill nongkrong, transfer & pengeluaran bulk (misal belanja bulanan dengan banyak item).

## 3. Goals & Success Metrics

| Goal | Metrik |
|---|---|
| Retensi harian tinggi | Streak rata-rata > 7 hari dalam bulan pertama |
| Pencatatan cepat & rendah friksi | < 10 detik untuk mencatat 1 transaksi |
| Kepercayaan terhadap data | Saldo di dashboard selalu match dengan input manual |
| AI advisor dipakai nyata | > 30% user aktif membuka advisor minimal 1x/minggu |

## 4. Platform & Constraint

- PWA, target utama Safari iOS (Add to Home Screen), harus terasa seperti native app (bottom tab bar, swipe gesture, haptic, safe-area aware).
- Harus bisa dipakai offline untuk pencatatan dasar (income/expense), sync otomatis saat online.
- Tidak butuh app store submission — instalasi via "Add to Home Screen".

## 5. Fitur & Requirement Detail

### 5.1 Pencatatan Pemasukan & Pengeluaran
- User bisa tambah transaksi income/expense dengan: jumlah, kategori, kantong/rekening asal, tanggal, catatan opsional, foto struk opsional.
- Kategori bisa custom (user tambah kategori sendiri) + preset default (makan, transport, hiburan, gaji, dll).
- Quick-add dari home screen (shortcut/FAB) — target minim tap.
- 🆕 Bisa diisi otomatis lewat foto struk atau rekaman suara — lihat §5.11.

### 5.2 Kantong / Rekening / Wallet
- User bisa membuat banyak "kantong" (cash, rekening bank, e-wallet, dana darurat, dll), masing-masing punya saldo sendiri.
- Transfer antar kantong (misal dari rekening ke e-wallet) tercatat sebagai 1 transaksi transfer, bukan income+expense terpisah, supaya tidak mengganggu laporan pemasukan/pengeluaran riil.
- Tiap kantong bisa punya ikon & warna sendiri untuk gampang dibedakan secara visual.

### 5.3 Pencatatan Bulk / Massal
- User bisa mencatat banyak item pengeluaran sekaligus dalam satu sesi (misal belanja bulanan dengan 15 item), dengan total otomatis terhitung dan bisa dipecah per kategori per item atau digabung jadi satu entri kategori "belanja bulanan".
- Mendukung input cepat berulang (tambah baris baru tanpa harus buka form dari awal).

### 5.4 Hutang / Kredit — *Liabilities* (Utang Saya ke Orang Lain / Lembaga)
> Secara akuntansi, ini adalah **Liabilitas** — mengurangi net worth user.
- Catat cicilan, pinjaman, kartu kredit: nominal total, sisa, bunga (opsional), tanggal jatuh tempo, jadwal pembayaran.
- Reminder jatuh tempo (push notification via PWA jika didukung, atau in-app highlight). **[Status: belum diimplementasikan, lihat §9 roadmap]**
- Progress bar pelunasan per hutang.

### 5.5 Hutang Orang — *Receivables/Piutang* (Uang yang Dipinjam Orang Lain ke User)
> Secara akuntansi, ini adalah **Aset (Piutang)** — menambah net worth user, bukan sekadar catatan pasif.
- Catat siapa yang berhutang, jumlah, tanggal, status (lunas/belum), dan reminder halus untuk follow up.
- Riwayat pelunasan parsial (orang bisa bayar bertahap).

### 5.6 Split Bill
- Buat sesi split bill: total tagihan, daftar peserta, metode split (rata/custom per item/persentase).
- Hasil split otomatis masuk sebagai "piutang" ke tiap peserta yang belum bayar, terhubung dengan modul Hutang Orang (§5.5).
- Bisa share ringkasan split bill (link/gambar) ke peserta di luar app.
- 🆕 Bisa dimulai dari foto struk (item-item otomatis ter-ekstrak, tinggal di-assign ke peserta) atau dari rekaman suara — lihat §5.11.

### 5.7 Financial Dashboard
- **Hero pertama yang terlihat: Budget Harian** (lihat §5.10) — bukan lagi saldo total. Ini perubahan IA dari desain awal.
- Ringkasan saldo total semua kantong, breakdown pengeluaran per kategori (chart), tren pemasukan vs pengeluaran per bulan.
- **Net Worth** (Kekayaan Bersih) = Total saldo wallet + Total Piutang belum lunas − Total Hutang belum lunas. Ditampilkan sebagai satu metric ringkas (lihat `CLAUDE.md` §12.1 untuk rumus persis).
- Filter periode (minggu/bulan/custom range) dan filter per kantong.

### 5.8 Financial Highlight
**[Status: parsial — perlu dicek apakah sudah full carousel atau baru 1 card, lihat catatan implementasi]**
- Insight otomatis mingguan/bulanan dalam bahasa natural: kategori pengeluaran terbesar, perubahan signifikan dibanding bulan lalu, pencapaian (misal "bulan ini kamu berhasil hemat 15% dari bulan lalu 🎉").
- Ditampilkan sebagai kartu-kartu ringkas yang bisa di-swipe, mirip "Spotify Wrapped" versi finansial.

### 5.9 AI Personal Financial Advisor
- Chat interface untuk tanya-jawab seputar kondisi keuangan user (misal "kenapa pengeluaran gue naik bulan ini?", "gimana caranya nabung buat marathon trip?").
- Advisor punya akses ke ringkasan data finansial user (bukan raw transaksi) sebagai konteks, dijalankan via server-side proxy ke model `claude-sonnet-4.5` (lihat `CLAUDE.md` §7 untuk detail teknis & aturan privasi).
- Bisa memberi rekomendasi actionable (misal saran budget kategori tertentu), bukan cuma analisis pasif.
- Harus ada disclaimer: advisor memberi insight berbasis data yang dicatat user, bukan nasihat keuangan profesional/lisensi.

### 5.10 🆕 Budget per Kategori (Cascading Bulanan → Mingguan → Harian)

**Konsep**: user set budget di level bulanan per kategori (misal "Makan: Rp2.000.000/bulan"), sistem otomatis menurunkan jadi angka mingguan dan harian — user tidak perlu (dan tidak boleh) input manual angka weekly/daily secara terpisah, supaya tidak ada risiko gak sinkron.

**Requirement:**
- User bisa menambahkan/edit **budget bulanan per kategori** dari halaman `budget` (atau dari halaman "Kelola Budget" yang bisa diakses dari dashboard).
- Sistem otomatis menghitung dan menampilkan:
  - **Budget Harian** = budget bulanan ÷ jumlah hari aktual di bulan berjalan (bukan dibulatkan/konstanta 30).
  - **Budget Mingguan** = budget harian × 7.
  - **Total Budget** (semua kategori digabung) = jumlah seluruh budget bulanan per kategori — dihitung otomatis, bukan input terpisah.
- Progress real-time: berapa dari budget harian/mingguan/bulanan yang sudah kepakai, dengan indikator warna (hijau/kuning/merah — lihat `Design.md`).
- **Perubahan pada Dashboard (§5.7)**: elemen **pertama** yang dilihat user saat buka app adalah **kartu Budget Harian** (bukan saldo total seperti desain sebelumnya) — ini reorder Information Architecture dashboard yang cukup signifikan, detail visual di `Design.md`.
- Kategori tanpa budget yang di-set tidak masuk hitungan progress (biar gak bikin bingung "over budget" padahal memang belum diatur).
- Rumus detail & aturan implementasi ada di `CLAUDE.md` §12.2.

### 5.11 🆕 Input via Foto & Suara (AI Extraction)

**Konsep**: alih-alih isi form manual, user bisa foto struk/bill atau ngomong aja, terus AI otomatis ekstrak jadi data transaksi (atau item split bill) yang siap direview.

#### 5.11.1 Foto Struk/Bill
- Tombol kamera tersedia di: Add Transaction sheet, Bulk Entry, dan Split Bill flow.
- User foto struk langsung atau pilih dari galeri.
- AI (`claude-sonnet-4.5` via proxy, lihat `CLAUDE.md` §13.1) membaca gambar dan mengekstrak: nama merchant, tanggal, daftar item + harga, total, kategori yang disarankan.
- Untuk **transaksi biasa**: hasil ekstraksi mengisi form (jumlah = total, kategori = saran AI, catatan = nama merchant), foto disimpan sebagai attachment (reuse field "foto struk" di §5.1).
- Untuk **split bill**: daftar item hasil ekstraksi otomatis mengisi mode "custom per item" (§5.6) — user tinggal assign tiap item ke peserta, gak perlu ketik ulang satu-satu.

#### 5.11.2 Input Suara
- Tombol mic tersedia di Add Transaction sheet dan Split Bill flow.
- User ngomong natural, misal *"Beli kopi dua puluh lima ribu pake cash"* atau *"Split makan siang dua ratus ribu buat gue, Kayis, sama Budi rata rata"*.
- Suara ditranskrip jadi teks dulu (lihat `CLAUDE.md` §13.2 untuk detail teknis), lalu teks itu yang dikirim ke AI untuk diekstrak jadi data terstruktur (jumlah, kategori, kantong yang disebut, catatan, dan untuk split bill: peserta + metode split kalau disebutkan).
- Mendukung format angka umum bahasa Indonesia: "25rb", "dua juta", "1.5jt", dll.

#### 5.11.3 Aturan Wajib: Selalu Ada Review, Tidak Pernah Auto-Save
- Hasil ekstraksi AI (dari foto maupun suara) **tidak pernah langsung tersimpan**. Selalu muncul layar review — semua field editable, persis seperti form manual, tapi udah keisi otomatis.
- Field yang AI kurang yakin (misal tulisan struk buram, atau angka di suara ambigu) ditandai visual (border warning) supaya user tau bagian mana yang perlu dicek lebih teliti.
- Kalau ekstraksi gagal total (foto gak jelas / suara gak kedengeran / API error), user tetap bisa lanjut isi manual seperti biasa — fitur ini adalah *shortcut*, bukan satu-satunya jalan input.

#### 5.11.4 Batasan & Catatan
- Butuh koneksi internet (foto & suara dikirim ke server untuk diproses AI) — tidak tersedia dalam mode offline penuh, beda dengan input manual yang offline-native.
- Foto & transkrip suara diproses lewat pihak ketiga (`openagentic.id`), jadi berlaku aturan privasi yang sama seperti AI Advisor (§5.9) — lihat `CLAUDE.md` §13.5.

## 6. Gamifikasi — Mekanik Inti

- **Streak**: hitung hari berturut-turut user mencatat minimal 1 transaksi. Visual flame icon, reminder halus kalau streak hampir putus.
- **XP & Level**: setiap aksi (catat transaksi, isi highlight mingguan, lunasi hutang) dapat XP. Level naik membuka badge/tema baru.
- **Badge/Achievement**: contoh — "7 Hari Beruntun", "Detektif Kategori" (pertama kali custom kategori), "Lunas!" (melunasi hutang pertama), "Bagi Rata" (split bill pertama).
- **Challenge mingguan** (opsional fase 2): misal "3 hari tanpa jajan kopi", dengan reward XP kalau berhasil.
- Detail visual gamifikasi ada di `Design.md`.

## 7. Data Model (High-Level Entities)

- `User` — profil, preferensi (mata uang default: IDR, dark mode, dll)
- `Wallet` — kantong/rekening (nama, tipe, saldo, warna/ikon, 🆕 untuk `credit_card`: limit, tagihan berjalan, jatuh tempo)
- `Transaction` — income/expense/transfer (jumlah, kategori, wallet, tanggal, catatan, foto struk, 🆕 `sourceType`: manual/photo/voice untuk tracking)
- `Category` — preset + custom, terhubung ke income/expense
- `Debt` — hutang saya (kreditur, nominal, sisa, jadwal, jatuh tempo)
- `Receivable` — piutang/hutang orang (debitur, nominal, status, riwayat cicilan)
- `SplitBillSession` — total, peserta, metode split, status per peserta
- `Budget` 🆕 — kategori, budget bulanan (source of truth), turunan mingguan/harian dihitung on-the-fly (bukan disimpan redundan)
- `Achievement` / `UserProgress` — XP, level, streak counter, badge yang dimiliki
- `AdvisorConversation` — riwayat chat dengan AI advisor (opsional disimpan)

## 8. Non-Functional Requirements

- **Offline-first** untuk pencatatan transaksi dasar. ✅ Terpenuhi secara natural karena implementasi aktual client-only (Zustand + localStorage), bukan lewat sync-queue seperti rencana awal.
- ⚠️ **Data Safety (update)**: karena tidak ada backend, data 100% hidup di 1 browser/device. Requirement keamanan bergeser dari "RLS di Supabase" menjadi **wajib ada fitur Export/Import JSON** sebelum app dianggap siap dipakai untuk keuangan riil (detail di `CLAUDE.md` §11).
- **Performa**: transaksi baru harus render optimistic (langsung muncul di UI).
- **Privasi AI**: data yang dikirim ke AI advisor diminimalkan (ringkasan, bukan raw dump), sesuai `CLAUDE.md` §7. ✅ Sudah diimplementasikan & terverifikasi sesuai desain.
- **Konsistensi angka**: semua kalkulasi finansial (net worth, budget cascade, split bill) harus pure function yang di-unit-test — lihat `CLAUDE.md` §12.
- Harus tetap terasa **ringan & cepat** meskipun banyak animasi/gamifikasi (hindari jank di iPhone lama).

## 9. Roadmap / Fase

**MVP (Fase 1)** ✅ Selesai
- Pencatatan income/expense, multi-wallet, dashboard dasar, offline-first, PWA install.

**Fase 2** ✅ Selesai (per `task.md`)
- Bulk entry, hutang/kredit, hutang orang, split bill, gamifikasi dasar (streak, XP, badge), AI Personal Financial Advisor.

**Fase 3 — Sedang Berjalan**
- 🐛 **Bugfix**: teks tidak terlihat di list transaksi (kemungkinan kontras warna, lihat `CLAUDE.md` §4).
- 🆕 **Budget per kategori** dengan cascading bulanan→mingguan→harian, jadi hero baru di Dashboard (§5.10).
- 🆕 **Refinement akuntansi**: terminologi Hutang (Liabilitas) / Piutang (Aset) yang konsisten + metric Net Worth di dashboard.
- Financial highlight otomatis (lengkapi jadi full carousel kalau belum).
- Notifikasi jatuh tempo hutang.
- Unit test untuk logic finansial (budget cascade, net worth, split bill, XP/streak).
- Export/Import JSON (data safety, lihat `CLAUDE.md` §11).
- 🆕 **Input via foto & suara (AI extraction)** untuk transaksi & split bill (§5.11) — termasuk layar review/edit wajib.
- 🆕 **Manual Credit Card Tracking**: Pelacakan limit kartu kredit, tagihan berjalan, jatuh tempo, dan manual payment (§5.12).

**Fase 4 (belum direncanakan detail)**
- Challenge mingguan, kemungkinan migrasi opsional ke backend (Supabase) kalau butuh multi-device sync.

## 10. Out of Scope (untuk sekarang)

- Integrasi langsung ke rekening bank/API perbankan (open banking) — pencatatan tetap manual di fase awal.
- Multi-currency selain IDR.
- Kolaborasi keuangan keluarga/bersama (shared household budget) — kemungkinan fase jauh ke depan.

## 11. Asumsi & Pertanyaan Terbuka

- Skema request/response aktual dari `openagentic.id` — sudah terverifikasi jalan per `walkthrough.md` (AI API Call: ✅ Pass), jadi asumsi ini sudah terjawab oleh implementasi.
- ✅ **Terjawab**: Pundi saat ini single-user/single-device by design (client-only storage, tanpa Auth/multi-user). Kalau ke depan butuh dipakai di 2 device (misal HP + web), itu perlu keputusan sadar untuk migrasi ke backend — bukan sesuatu yang otomatis "gratis" datang dari arsitektur sekarang.
- 🆕 Apakah Total Budget bulanan boleh melebihi total pemasukan (income) bulan itu? Perlu diputuskan apakah sistem cuma kasih warning, atau strict validation yang mencegah user set budget tidak realistis.
- 🆕 Untuk kategori yang belum di-set budget-nya, apakah tetap muncul di dashboard budget (dengan status "belum diatur") atau disembunyikan sampai user set?
- 🆕 Pendekatan speech-to-text untuk input suara masih perlu divalidasi di device asli: apakah Web Speech API cukup reliable di Safari iOS, atau perlu fallback ke layanan STT lain — lihat `CLAUDE.md` §13.2.
