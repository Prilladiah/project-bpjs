# Magang BPJS Ketenagakerjaan Yogyakarta (Next.js 14)

1. `npm install`
2. Salin `.env.example` ke `.env.local`, lalu isi ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET
3. `npm run dev` -> http://localhost:3000 ; login admin di /login
Konten disimpan di `data/content.json` dan diedit lewat /admin.
Catatan: penyimpanan berbasis file butuh server yang bisa menulis file (VPS / `npm start`), bukan Vercel.
