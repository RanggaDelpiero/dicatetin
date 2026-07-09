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

### 5.2 Kantong / Rekening / Wallet
- User bisa membuat banyak "kantong" (cash, rekening bank, e-wallet, dana darurat, dll), masing-masing punya saldo sendiri.
- Transfer antar kantong (misal dari rekening ke e-wallet) tercatat sebagai 1 transaksi transfer, bukan income+expense terpisah, supaya tidak mengganggu laporan pemasukan/pengeluaran riil.
- Tiap kantong bisa punya ikon & warna sendiri untuk gampang dibedakan secara visual.

### 5.3 Pencatatan Bulk / Massal
- User bisa mencatat banyak item pengeluaran sekaligus dalam satu sesi (misal belanja bulanan dengan 15 item), dengan total otomatis terhitung dan bisa dipecah per kategori per item atau digabung jadi satu entri kategori "belanja bulanan".
- Mendukung input cepat berulang (tambah baris baru tanpa harus buka form dari awal).

### 5.4 Hutang / Kredit (Utang Saya ke Orang Lain / Lembaga)
- Catat cicilan, pinjaman, kartu kredit: nominal total, sisa, bunga (opsional), tanggal jatuh tempo, jadwal pembayaran.
- Reminder jatuh tempo (push notification via PWA jika didukung, atau in-app highlight).
- Progress bar pelunasan per hutang.

### 5.5 Hutang Orang (Piutang — Uang yang Dipinjam Orang Lain ke User)
- Catat siapa yang berhutang, jumlah, tanggal, status (lunas/belum), dan reminder halus untuk follow up.
- Riwayat pelunasan parsial (orang bisa bayar bertahap).

### 5.6 Split Bill
- Buat sesi split bill: total tagihan, daftar peserta, metode split (rata/custom per item/persentase).
- Hasil split otomatis masuk sebagai "piutang" ke tiap peserta yang belum bayar, terhubung dengan modul Hutang Orang (§5.5).
- Bisa share ringkasan split bill (link/gambar) ke peserta di luar app.

### 5.7 Financial Dashboard
- Ringkasan saldo total semua kantong, breakdown pengeluaran per kategori (chart), tren pemasukan vs pengeluaran per bulan.
- Filter periode (minggu/bulan/custom range) dan filter per kantong.

### 5.8 Financial Highlight
- Insight otomatis mingguan/bulanan dalam bahasa natural: kategori pengeluaran terbesar, perubahan signifikan dibanding bulan lalu, pencapaian (misal "bulan ini kamu berhasil hemat 15% dari bulan lalu 🎉").
- Ditampilkan sebagai kartu-kartu ringkas yang bisa di-swipe, mirip "Spotify Wrapped" versi finansial.

### 5.9 AI Personal Financial Advisor
- Chat interface untuk tanya-jawab seputar kondisi keuangan user (misal "kenapa pengeluaran gue naik bulan ini?", "gimana caranya nabung buat marathon trip?").
- Advisor punya akses ke ringkasan data finansial user (bukan raw transaksi) sebagai konteks, dijalankan via server-side proxy ke model `claude-sonnet-4.5` (lihat `CLAUDE.md` §7 untuk detail teknis & aturan privasi).
- Bisa memberi rekomendasi actionable (misal saran budget kategori tertentu), bukan cuma analisis pasif.
- Harus ada disclaimer: advisor memberi insight berbasis data yang dicatat user, bukan nasihat keuangan profesional/lisensi.

## 6. Gamifikasi — Mekanik Inti

- **Streak**: hitung hari berturut-turut user mencatat minimal 1 transaksi. Visual flame icon, reminder halus kalau streak hampir putus.
- **XP & Level**: setiap aksi (catat transaksi, isi highlight mingguan, lunasi hutang) dapat XP. Level naik membuka badge/tema baru.
- **Badge/Achievement**: contoh — "7 Hari Beruntun", "Detektif Kategori" (pertama kali custom kategori), "Lunas!" (melunasi hutang pertama), "Bagi Rata" (split bill pertama).
- **Challenge mingguan** (opsional fase 2): misal "3 hari tanpa jajan kopi", dengan reward XP kalau berhasil.
- Detail visual gamifikasi ada di `Design.md`.

## 7. Data Model (High-Level Entities)

- `User` — profil, preferensi (mata uang default: IDR, dark mode, dll)
- `Wallet` — kantong/rekening (nama, tipe, saldo, warna/ikon)
- `Transaction` — income/expense/transfer (jumlah, kategori, wallet, tanggal, catatan, foto struk)
- `Category` — preset + custom, terhubung ke income/expense
- `Debt` — hutang saya (kreditur, nominal, sisa, jadwal, jatuh tempo)
- `Receivable` — piutang/hutang orang (debitur, nominal, status, riwayat cicilan)
- `SplitBillSession` — total, peserta, metode split, status per peserta
- `Achievement` / `UserProgress` — XP, level, streak counter, badge yang dimiliki
- `AdvisorConversation` — riwayat chat dengan AI advisor (opsional disimpan)

## 8. Non-Functional Requirements

- **Offline-first** untuk pencatatan transaksi dasar.
- **Keamanan data finansial**: RLS ketat per user di Supabase, tidak ada data user lain yang bocor lintas akun.
- **Performa**: transaksi baru harus render optimistic (langsung muncul di UI sebelum konfirmasi server).
- **Privasi AI**: data yang dikirim ke AI advisor diminimalkan (ringkasan, bukan raw dump), sesuai `CLAUDE.md` §7.
- Harus tetap terasa **ringan & cepat** meskipun banyak animasi/gamifikasi (hindari jank di iPhone lama).

## 9. Roadmap / Fase

**MVP (Fase 1)**
- Pencatatan income/expense, multi-wallet, dashboard dasar, offline-first, PWA install.

**Fase 2**
- Bulk entry, hutang/kredit, hutang orang, split bill, gamifikasi dasar (streak, XP, badge).

**Fase 3**
- Financial highlight otomatis, AI Personal Financial Advisor, challenge mingguan, notifikasi jatuh tempo.

## 10. Out of Scope (untuk sekarang)

- Integrasi langsung ke rekening bank/API perbankan (open banking) — pencatatan tetap manual di fase awal.
- Multi-currency selain IDR.
- Kolaborasi keuangan keluarga/bersama (shared household budget) — kemungkinan fase jauh ke depan.

## 11. Asumsi & Pertanyaan Terbuka

- Skema request/response aktual dari `openagentic.id` (apakah persis OpenAI-compatible atau Anthropic `/v1/messages`) perlu dicek ke dokumentasi mereka sebelum implementasi final — belum diverifikasi di dokumen ini.
- Apakah Pundi ditujukan untuk pemakaian pribadi (single user, Rangga) dulu, atau langsung dirancang multi-user dari awal? Ini memengaruhi kompleksitas Auth & RLS di fase MVP.
