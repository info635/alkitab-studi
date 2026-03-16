# Alkitab Studi — Panduan Instalasi & Deployment

Alat Penelitian Alkitab Reformed untuk Pendeta dan Mahasiswa Teologi Indonesia

## Fitur
- Teks Alkitab TB (Terjemahan Baru) Indonesia
- Tafsiran Reformed domain publik: Matthew Henry (1706), JFB (1871), John Gill (1748)
- AI Reformed (Calvinistis) untuk pertanyaan teologis
- Catatan khotbah dengan template ekspositori
- PWA — bekerja offline setelah pertama kali dimuat
- Dapat diinstall di Android, iOS, Windows, Mac

---

## Cara Deploy ke Netlify (Gratis)

### Opsi 1: Drag & Drop (Paling Mudah)
1. Buka https://netlify.com dan daftar akun gratis
2. Di dashboard, klik "Add new site" → "Deploy manually"
3. Zip seluruh folder `alkitab-studi`
4. Drag & drop file zip ke area yang tersedia
5. Selesai! URL akan otomatis diberikan (contoh: `alkitab-studi.netlify.app`)

### Opsi 2: GitHub + Netlify (Untuk Update Otomatis)
1. Buat repository di GitHub
2. Upload semua file ke repository
3. Di Netlify: "Add new site" → "Import from Git"
4. Pilih repository → Deploy
5. Setiap push ke GitHub = otomatis update

### Domain Kustom (Opsional)
- Beli domain di Niaga Hoster, IDCloudHost, dll (~Rp 150.000/tahun)
- Di Netlify: Site settings → Domain management → Add custom domain

---

## Struktur File

```
alkitab-studi/
├── index.html              # Halaman utama
├── manifest.json           # PWA config
├── sw.js                   # Service Worker (offline)
├── netlify.toml            # Konfigurasi Netlify
├── css/
│   └── app.css             # Stylesheet
├── js/
│   └── app.js              # Logika aplikasi
├── data/
│   ├── bible/
│   │   ├── matius.json     # Teks Matius
│   │   ├── yohanes.json    # Teks Yohanes
│   │   ├── roma.json       # Teks Roma
│   │   ├── efesus.json     # Teks Efesus
│   │   └── filipi.json     # Teks Filipi
│   └── commentary/
│       ├── matthew-henry.json
│       ├── jfb.json
│       └── john-gill.json
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Menambah Teks Alkitab Baru

Buat file JSON baru di `data/bible/` dengan format:

```json
{
  "book": "Galatia",
  "abbreviation": "Gal",
  "testament": "nt",
  "chapters": {
    "2": [
      {"v":16, "t": "teks ayat...", "red": false}
    ]
  }
}
```

Lalu daftarkan di `js/app.js` dalam `BOOK_FILES`.

---

## Menambah Tafsiran Baru

Tambahkan entry baru di file commentary JSON:

```json
{
  "Galatia:2:16": "<p>Teks tafsiran dalam HTML...</p>"
}
```

Format key: `NamaKitab:Pasal:Ayat`

---

## Koneksi API (Opsional)

Fitur AI membutuhkan koneksi Anthropic API. Jika digunakan di domain sendiri, tambahkan API key di environment variable Netlify:
- `ANTHROPIC_API_KEY` = your_api_key

Atau biarkan pengguna menggunakan fitur offline saja.

---

## Lisensi Tafsiran

| Tafsiran | Tahun | Status |
|----------|-------|--------|
| Matthew Henry's Commentary | 1706 | Domain Publik |
| Jamieson-Fausset-Brown | 1871 | Domain Publik |
| John Gill's Exposition | 1748 | Domain Publik |

Semua tafsiran yang digunakan telah melewati batas hak cipta dan bebas digunakan.

---

*Dikembangkan untuk pelayanan pendeta dan mahasiswa teologi Indonesia*
*Perspektif teologi: Reformed Evangelikal (Calvinis)*
