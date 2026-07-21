# Dashboard + CV Builder Flow — Design Spec

## Latar Belakang
Aplikasi AI Career Hub tidak memiliki halaman dashboard. User yang login langsung diarahkan ke landing page tanpa central hub. Flow "Buat CV" juga tidak logis — langsung minta job title tanpa konteks dashboard.

## Tujuan
1. Membuat halaman `/dashboard` sebagai central hub setelah login
2. Memperbaiki flow "Buat CV Baru": Dashboard → Pilih Template → Isi Posisi (opsional) → Builder
3. Menambahkan endpoint `GET /api/cv-documents` untuk daftar CV user
4. Template CV bisa dipilih sebelum masuk builder

---

## Halaman Dashboard (`/dashboard`)

### Layout
- `AppHeader` di atas
- **Welcome section**: "Selamat datang, [Nama]" + progress profil
- **Quick actions**: 3 kartu — Cek CV, Buat CV Baru, Portfolio Web
- **Riwayat CV**: Daftar CV yang sudah pernah dibuat, masing-masing dengan:
  - Judul posisi + tanggal dibuat
  - Nama template
  - Action: Edit, Download PDF, Hapus
- **Empty state**: Kalau belum punya CV, tampilkan ilustrasi + CTA "Buat CV Pertama"

### Access
- Hanya untuk user yang sudah login (gunakan `AuthGuard`)
- Redirect ke `/login` jika belum login

---

## Flow "Buat CV Baru"

1. Klik "Buat CV Baru" di dashboard → **Template Selection Sheet**
2. Tampilkan grid template CV (2-3 template awal: Minimal Dark, Professional Blue, Clean White)
3. User klik salah satu template → preview card
4. Klik "Gunakan Template Ini" → **Form isi posisi** (opsional):
   - Input: "Target Posisi (opsional)"
   - Note: "Mengisi posisi membantu AI menyesuaikan konten CV-mu"
   - Tombol: "Buat CV"
5. `POST /api/cv-documents/create` → redirect ke `/builder/[id]`

### Template Data
Template disimpan sebagai konfigurasi, bukan render engine penuh. Cukup:
- `id`: string
- `name`: string
- `description`: string
- `thumbnail`: string (path ke gambar)
- `defaultFont`: string
- `primaryColor`: string

---

## API Changes

### NEW: `GET /api/cv-documents`
Return daftar CV milik user yang sudah login.
- Auth required
- Response: `{ id, jobTitle, templateId, createdAt, updatedAt }[]`

### MODIFY: `POST /api/cv-documents/create`
Tambahkan field `templateId` di body request (optional, default "minimal-dark-v1").
Hapus validasi `jobTitle` sebagai required (buat opsional).

---

## Komponen Baru

1. **`src/app/dashboard/page.tsx`** — Halaman dashboard utama
2. **`src/components/TemplatePicker.tsx`** — Modal/sheet untuk milih template
3. **`src/lib/templates.ts`** — Data template CV (id, name, desc, thumbnail, dll)

---

## File yang Diubah
- `src/app/builder/new/page.tsx` — Sederhanakan jadi terima `templateId` dari query param
- `src/app/api/cv-documents/create/route.ts` — Tambah `templateId`, buat jobTitle opsional
- `src/app/api/cv-documents/route.ts` — **BARU**: list CV user

---

## Yang Tidak Berubah
- Halaman checker tetap bisa diakses tanpa login (trial 2x)
- Halaman builder `[id]` tetap sama
- AuthGuard & AppHeader tetap
