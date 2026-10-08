# Alur Pembayaran Midtrans — End to End

Dokumen ini menjelaskan alur lengkap dari customer memesan produk (paket CV / fitur berbayar)
sampai pembayaran selesai, termasuk bagaimana sistem tetap aman ketika **katalog produk
masih dalam proses penambahan/perubahan** (produk baru ditambah, harga diubah, paket
dinonaktifkan) di tengah-tengah alur pembayaran.

## Ringkasan arsitektur

| Komponen | File | Peran |
|---|---|---|
| Checkout UI | `src/app/settings/billing/page.tsx`, `src/app/cv/[id]/checkout/page.tsx` | Pilih paket → buka Snap |
| Buat order | `src/app/api/payments/create-order/route.ts` | Resolusi katalog, snapshot, buat transaksi Snap |
| Snap API | `src/lib/midtrans.ts` (`createSnapTransaction`) | HTTP ke Midtrans Snap v1 |
| Webhook | `src/app/api/payments/notification/route.ts` | Terima notifikasi status, update DB |
| Katalog paket | `src/lib/access.ts` (`getPackagesDb`, `PACKAGES`) | DB-first + hardcoded fallback |
| Entitlement | `src/lib/access.ts` (`getUserAccess`) | Hitung akses fitur dari pembayaran sukses |

## Alur lengkap

```
1. USER pilih produk
   /settings/billing atau /cv/[id]/checkout
   POST /api/payments/create-order  { packageType, cvDocumentId? }

2. RESOLUSI KATALOG
   pkgDef = getPackagesDb()[type] || PACKAGES[type]
   • getPackagesDb(): baca tabel `packages` (admin-manage, filter active,
     urut sortOrder) + cache 60 detik
   • DB kosong / gagal → fallback PACKAGES hardcoded (tidak pernah mati)
   • paket tidak dikenal → 400 INVALID_PACKAGE

3. ANTI DOUBLE-ORDER (resume pending)
   Cek payments: userId + packageType (+ cvDocumentId) + status "pending"
   + expiresAt > now. Kalau ada → kembalikan redirect_url lama (existing: true).
   User lanjut bayar order yang sama — tidak bikin order ganda.

4. SNAPSHOT ORDER
   orderId = "ACH-" + nanoid(12)  (unik, acak)
   INSERT payments:
     packageType, packageName, amount (= harga saat itu, TERKUNCI),
     limits (= definisi fitur saat itu, TERKUNCI), status "pending",
     expiresAt = now + periodDays

5. BUAT TRANSAKSI MIDTRANS SNAP
   POST snap/v1/transactions (sandbox/production by env)
     transaction_details: { order_id, gross_amount }
     item_details: [{ id: packageType, name, price, qty: 1 }]
     expiry: 60 menit
     callbacks: finish/error/pending → /settings/billing?payment=…
   ✅ return { token, redirect_url } → redirect_url disimpan ke payments
   ❌ Snap error → record payment dihapus → 502

6. USER BAYAR DI SNAP
   frontend: window.location.href = redirect_url
   user pilih metode (VA, QRIS, e-wallet, kartu, dll)
   selesai → callback browser ke /settings/billing?payment=success|error|pending

7. WEBHOOK NOTIFIKASI (sumber kebenaran status)
   Midtrans POST /api/payments/notification
   a. Verifikasi signature sha512(order_id + status_code + gross_amount + server_key)
      → salah = 403
   b. Cari payments by order_id → tidak ada = 404
   c. IDEMPOTENCY: kalau status sudah "success" → abaikan notifikasi lain
      (Midtrans bisa kirim ganda / tidak berurutan; "expire" yang datang
      terlambat tidak boleh menimpa "settlement")
   d. Map status:
      settlement/capture            → success
      pending/authorize/challenge   → pending
      deny/cancel/expire/failure    → failed
   e. UPDATE payments (status, transaction_id, payment_method, paidAt,
      raw_notification)

8. ENTITLEMENT (akses fitur)
   getUserAccess(userId):
   • SELECT payments WHERE status="success" AND expiresAt >= now
   • Untuk tiap pembayaran aktif: pakai SNAPSHOT limits (kolom payments.limits)
     kalau ada; fallback ke definisi katalog saat ini untuk order lama
   • Gabungkan semua paket aktif — nilai tertinggi menang
   • isPremium = punya ≥ 1 paket aktif
```

## Kenapa aman saat katalog "masih dalam proses"?

Ada 4 lapis perlindungan:

### 1. Harga + definisi fitur di-snapshot saat order dibuat
Kolom `amount`, `packageName`, dan `limits` di tabel `payments` disalin dari paket
**pada detik order dibuat**. Transaksi Midtrans dibuat dengan `gross_amount` yang sama.
Jadi admin boleh bebas menambah produk baru, mengubah harga, atau mengubah limit —
order yang sudah dibuat (pending/berjalan) tetap dengan harga dan fitur yang user setujui.

### 2. Webhook tidak pernah membaca katalog
Notifikasi hanya mencocokkan `order_id` → update record yang sama. Status di-map
dari `transaction_status` Midtrans, bukan dari tabel paket. Penambahan produk di
dashboard tidak mengganggu notifikasi yang masuk.

### 3. Katalog DB-first + hardcoded fallback
Produk baru yang diinsert admin ke tabel `packages` (dengan `active=true`) sudah bisa
dibeli dalam ≤ 60 detik (cache TTL) **tanpa redeploy**. Kalau DB kosong atau query
gagal, `PACKAGES` hardcoded jadi jaring pengaman — checkout tidak pernah down.

### 4. Entitlement dihitung dari tabel payments, bukan katalog
Akses fitur berasal dari transaksi yang **sukses**, bukan dari daftar produk saat ini.
Bahkan jika paket dihapus dari katalog setelah dibayar, user tetap punya akses
(fallback ke definisi katalog / snapshot).

## Keamanan & edge case

| Kasus | Penanganan |
|---|---|
| Belum login | 401 AUTH_REQUIRED |
| Paket tidak dikenal | 400 INVALID_PACKAGE |
| `single_cv` tanpa CV | 400 CV_REQUIRED |
| Signature webhook salah | 403 INVALID_SIGNATURE |
| Order tidak dikenal di webhook | 404 ORDER_NOT_FOUND |
| Snap API gagal | Record pending dihapus + 502 |
| User double-click "Beli" | Kembalikan order pending yang sama (resume, tidak duplikat) |
| Notifikasi ganda / tidak berurutan | Guard idempotency: success tidak bisa ditimpa |
| User batal / tidak membayar | Status tetap pending → expire (Snap 60 menit + expiresAt) → webhook `expire` → failed |

## Catatan desain

- **Sumber kebenaran status = webhook**, bukan callback browser. Callback browser
  hanya untuk UX redirect.
- Snapshot `limits` membuat kebijakan "harga & fitur terkunci saat beli" berlaku penuh —
  perubahan katalog ke depan tidak mengubah apa yang sudah dibeli user.
- Order lama (sebelum fitur snapshot) otomatis fallback ke definisi katalog saat ini,
  jadi tidak ada pembayaran yang kehilangan akses.

## Referensi Midtrans

- Snap API: https://docs.midtrans.com/reference/snap-api
- Webhook after payment: https://docs.midtrans.com/reference/after-payment-webhook
- Signature key: sha512(order_id + status_code + gross_amount + server_key)