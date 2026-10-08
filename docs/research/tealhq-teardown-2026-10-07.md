# Teardown Teknologi & Produk: Teal (tealhq.com / app.tealhq.com)

**Tanggal riset:** 7 Oktober 2026
**Metode:** analisis HTTP publik (HTML, header, aset statis, bundle JS), render headless, dan verifikasi silang ke halaman first-party (pricing, about). Tanpa akun, tanpa menembus proteksi apa pun.
**Artefak acuan build:** `app.tealhq.com` build `main-BzIxTDIx.js` / `vendor-qlsOBgAj.js` / `main-Gxkk6unj.css` (hash berubah setiap deploy baru).

**Label keyakinan yang dipakai di dokumen ini:**
- **[V]** — Terverifikasi langsung (bucket/string/HTML/header yang saya lihat sendiri).
- **[KT]** — Keyakinan tinggi (inferensi kuat dari bukti langsung, mis. konvensi framework).
- **[I]** — Inferensi (rekonstruksi wajar, belum terbukti).
- **[Gap]** — Tidak bisa diverifikasi dengan sumber yang dapat diakses.

---

## 0. Ringkasan Eksekutif

Teal adalah platform karier freemium asal AS (resume builder + job tracker + Chrome extension + AI). Yang membuatnya menarik secara teknis:

1. **Tiga properti dengan stack berbeda** yang dikelola terpisah:
   - `www.tealhq.com` (marketing) → **Webflow** + jQuery + GSAP + Cloudflare Images. **[V]**
   - `app.tealhq.com` (produk) → **React 19.2.1 + Vite + Tailwind + Radix/cmdk/Vaul/Lucide/Recharts + TipTap**, dengan *shell* **JHipster** dan backend berpola **microservices** (`auth.service`, `resume.service`, `workstyles.service`) — kemungkinan besar **Java/Spring Boot**. **[V]/[KT]**
   - `mcp.tealhq.com` (agent AI beta) → **"Teal Job Search Agent"**, dibangun dengan **Cloudflare Agents**. **[V]**
2. **AI multi-model**: bundle aplikasi memuat daftar model `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, `anthropic/claude-opus-4.6`, `anthropic/claude-sonnet-5` dengan badge (★ Strong / ★ Premium / ★ Recommended). **[V]**
3. **Stack komersial & pertumbuhan**: Stripe (pembayaran), Intercom (support chat), Amplitude + VWO + GTM + Google Ads (analytics & eksperimen), Customer.io (email lifecycle), ShareASale (afiliasi). **[V]**
4. **Model bisnis**: freemium; Teal+ berharga **$13 / 7 hari, $29 / 30 hari, $79 / 90 hari**; ekstensi Chrome gratis 40+ job board sebagai mesin akuisisi. **[V]**
5. **Skala (klaim mereka, terverifikasi ada di halaman About)**: 678K+ members, 2.8M+ jobs di-bookmark, 934K+ resume dibuat. **[V]**

Implikasi membangun (blueprint lengkap di §7): yang sulit ditiru bukanlah stack-nya, tapi **funnel ekstensi + konten SEO masif + metering kredit AI + agent**.

---

## 1. Batasan & Metodologi (baca dulu)

- **Area ber-login tidak diakses.** `app.tealhq.com` adalah SPA di balik login; isi produk pasca-login, endpoint API internal, dan data model persis **tidak** bisa diverifikasi tanpa akun. Tidak ada upaya bypass.
- **Cloudflare bot management aktif.** Request `curl` dan Chromium headless ke `app.`/`www.` dijawab `403 Forbidden` ("Attention Required!"). Akses riset dilakukan lewat jalur yang diizinkan situs (HTML publik + aset statis yang memang dikirim ke browser mana pun). Bot detection mereka bekerja baik — anggap ini temuan positif, bukan hambatan.
- **Mesin pencari web tidak bisa diakses dari lingkungan ini** (DuckDuckGo/Bing gagal berulang), sehingga riset bersumber pada fetch langsung + halaman first-party. Beberapa data pihak ketiga (Crunchbase, Product Hunt, Chrome Web Store) terblokir untuk environment ini → masuk **[Gap]**.
- Semua angka finansial/traction produk di bawah **diverifikasi silang** langsung ke halaman `pricing` dan `about` pada 7 Okt 2026 (botScore situs 7 — diizinkan).

---

## 2. Profil Produk

**Posisi:** "Resume & Job Search Tools — Land Interviews 6x Faster". Target: pencari kerja profesional (AS-first).

**Fitur inti (terverifikasi dari halaman produk & pricing):**

- **AI Resume Builder** — resume tak terbatas, templates (10 di free, unlimited di Teal+), Design Mode (basic vs advanced), Analysis Mode (basic vs unlimited).
- **Job Application Tracker** — unlimited tracking (gratis), bookmark lowongan dari **40+ job board via ekstensi Chrome gratis**, pipeline tahapan lamaran, **email templates per tahap** (1 template di free, unlimited di paid).
- **Keyword matching** — match score resume vs job description; di free dibatasi "Top 5" keyword.
- **AI credits** — free: 10 credit bullet points + 2 credit professional summary + 2 credit cover letter; Teal+: unlimited.
- **Alat pendukung** — Resume Keyword Scanner, ATS Resume Checker, Bullet Point Generator, Summary Generator; serta kategori interview practice & salary negotiation.
- **Mesin SEO raksasa** (Career Hub): 2.000+ contoh resume, 1.500+ contoh cover letter, 900+ resume synonyms, 500+ career paths, tech job board "millions of jobs, daily updates".
- **Agent baru (beta)** — "Teal Job Search Agent": chat agent AI (lihat §5).

**[I]** Rekonstruksi alur produk khas pemain ini: ekstensi menyisipkan tombol "Save to Teal" di halaman job board → job masuk tracker → user diminta buat resume → AI membantu menulis → paywall saat kredit habis. Ini funnel yang menjembatani akuisisi dan monetisasi.

---

## 3. Profil Bisnis

| Item | Nilai | Status |
|---|---|---|
| Harga Teal+ | $13 / 7 hari · $29 / 30 hari · $79 / 90 hari | [V] pricing, 7 Okt 2026 |
| Free tier | Unlimited resume & tracking; 10 template; Top-5 keyword; basic analysis; 1 email template; 10+2+2 AI credits | [V] |
| Skala | 678K+ members · 2.8M+ jobs bookmarked · 934K+ resumes dibuat | [V] about |
| Pendiri | Dave Fano (mantan eksekutif karier/edtech) | [V] about |
| Organisasi | Remote-first | [V] about |
| Investor | Lerer Hippeau, Aleph, Oceans, Flybridge, Rethink Education, City Light, Alpaca VC, Human Ventures | [V] logo/alt-text about |
| Rekrutmen | ATS **Ashby** (`jobs.ashbyhq.com/tealhq`); 0 lowongan terbuka saat riset | [V] |
| Pendanaan (nominal/tanggal) | tidak terverifikasi | [Gap] Crunchbase diblokir |

**Catatan:** stack marketing memuat **VWO** (A/B testing) — jadi harga yang terlihat bisa berbeda per visitor/waktu. Angka di atas valid pada tanggal riset.

---

## 4. Arsitektur Teknologi

### 4.1 Peta properti

| Properti | Fungsi | Stack | Keyakinan |
|---|---|---|---|
| `www.tealhq.com` | Marketing/SEO | Webflow (`/vendor/webflow/thq-*`, jQuery 3.5.1, GSAP), Cloudflare Images (`imagedelivery.net`) | [V] |
| `app.tealhq.com` | Produk utama (SPA) | React 19.2.1 + Vite + Tailwind; shell JHipster; gateway ke microservices | [V]/[KT] |
| `auth.service.tealhq.com` | Layanan auth | microservice (JHipster UAA/oauth-like) | [KT] |
| `resume.service.tealhq.com` | Layanan resume (render/PDF/proses data) | microservice | [KT] |
| `workstyles.service.tealhq.com` | Layanan "workstyles" (personalisasi/preferensi kerja) | microservice | [KT] |
| `locations.tealhq.com` | Layanan lokasi | terdeteksi di konfig bundle | [V] |
| `mcp.tealhq.com` | Teal Job Search Agent (beta) | Cloudflare Agents + Vite SPA (`/ai-job-search/`) | [V] |
| `help.tealhq.com` | Help center | terdeteksi di bundle | [V] |

### 4.2 Frontend aplikasi (app.tealhq.com) — bukti bundle

- **React 19.2.1** — string renderer: `version:"19.2.1", rendererPackageName:"react-dom", reconcilerVersion:"19.2.1"`. **[V]**
- **Vite** — marker `__vite__` (69×), `type="module" crossorigin`, `modulepreload`, aset `assets/*-<hash>.js`. **[V]**
- **Redux** (state), **axios** (HTTP), **Zod** (299×) + **Yup** (20×) (validasi), **moment** + **date-fns** (tanggal), **lodash**, **DOMPurify** (sanitasi HTML). **[V]**
- **TipTap (22×) + ProseMirror (6×)** — editor rich text (kemungkinan inti editor resume/cover letter). **[V]**
- **Shell JHipster** — `div#jhipster-error`, `manifest.webapp` PWA khas JHipster, opsi `es2018–es2022` pada polyfill. **[V]**
- **Tidak memakai** styled-components/Emotion/antd/MUI/Chakra/Mantine/Bootstrap-grid/jQuery di app (probe CSS: `col-md-`=0, `Mui`=0, selector `jhi-`=0 → design system sudah dikustom total). **[V]**

### 4.3 UI / design system

- **Tailwind CSS** — marker `--tw-` (1.393× di `main.css`). **[V]**
- **Radix UI primitives** (118+16×), **Lucide icons** (214×), **cmdk** (54× — command palette), **Vaul** (drawer), **Recharts** (91× — grafik). Kombinasi ini persis keluarga **shadcn/ui**. **[V]**
- Font **Inter** (Google Fonts), preconnect gstatic. **[V]**
- HTML shell memuat komentar dev: *"polyfill for global to fix react-joyride > react-floater"* → pernah/sedang memakai **React Joyride** untuk product tour. **[V]**

### 4.4 Backend & microservices

- Pola hostname `*.service.tealhq.com` + `div#jhipster-error` + `manifest.webapp` = pola khas **JHipster** dalam mode **microservices** (gateway + service terpisah, umumnya **Spring Boot / Java**, dengan registry internal). **[KT]** (JHipster bisa juga scaffold .NET/Node — label "kemungkinan besar Java/Spring Boot", bukan "terbukti").
- App memanggil service lewat konfigurasi absolut di bundle (contoh string yang terlihat): `https://workstyles.service.tealhq.com/`, `https://mcp.tealhq.com`, `https://locations.tealhq.com`, plus path internal `ai-job-search/agents`. **[V]**
- `GET /management/info` di `app`, `auth.service`, `resume.service`, `workstyles.service` → `403 Forbidden` (tidak terekspos publik — konfigurasi aman). **[V]**
- **[Gap]** Versi Spring Boot/JHipster, database (kemungkinan PostgreSQL/MySQL — tidak terverifikasi), message broker, dan detail API internal tidak bisa dilihat tanpa akses.

### 4.5 AI stack

- Daftar model yang ditemukan di `main.js` (dengan label UI): **[V]**

| Model ID | Label UI |
|---|---|
| `openai/gpt-5.6-sol` | ★ Strong |
| `openai/gpt-5.6-terra` | — |
| `anthropic/claude-opus-4.6` | ★ Premium |
| `anthropic/claude-sonnet-5` | ★ Recommended |

- Ada flag default `"at balance of quality and speed"` → model router dengan pemilihan berdasarkan kualitas/kecepatan/biaya. **[V]**
- **[I]** Format `provider/model` menandakan layer routing internal (bukan langsung ke satu vendor), memungkinkan ganti model tanpa ubah fitur.
- **Fitur AI yang tampak dari produk:** bullet generator, summary generator, cover letter generator, analysis mode, dan agent chat.

### 4.6 Integrasi pihak ketiga (terverifikasi dari HTML/bundle)

| Fungsi | Vendor | Bukti |
|---|---|---|
| Pembayaran | **Stripe** | `js.stripe.com/v3` + loader di bundle |
| Support chat | **Intercom** | `api-iam.intercom.io` (region us/eu/ap) + loader custom |
| Product analytics | **Amplitude** | SDK di app (86×) + script experiment khusus |
| A/B testing | **VWO** | account_id 854157 di HTML |
| Email lifecycle | **Customer.io** | tracker `47fa074b34c0445dc803` |
| Tag manager & ads | Google (GTM `GTM-MKVKQS9`, GA, Ads `AW-648264820`) | script HTML |
| Afiliasi | **ShareASale** | `dwin1.com/37884.js` |
| Gambar marketing | **Cloudflare Images** | `imagedelivery.net` |
| Polyfill | polyfill-fastly.io | HTML |

### 4.7 Infrastruktur & keamanan

- **Cloudflare** di depan semuanya: DNS, CDN, WAF, bot management (`cf-ray` SIN = edge Singapura; cookie `__cf_bm`). **[V]**
- **Bot management memblokir** curl & headless browser (403) — hanya client yang lolos skor bot yang dilayani. **[V]**
- BuiltWith mencatat riwayat **AWS Lambda** + Google Workspace (email) untuk domain ini. **[V-BuiltWith]**
- Header: `Referrer-Policy: same-origin`, `X-Frame-Options: SAMEORIGIN`, cookie `HttpOnly; Secure; SameSite=None`. Tidak ada kebocoran server stack di header. **[V]**

---

## 5. Teal Job Search Agent (`mcp.tealhq.com`) — sinyal paling modern

- Title: **"Teal Job Search Agent (Beta)"**; meta description: **"AI-powered chat agent built with Cloudflare Agents"**. `noindex,nofollow`. **[V]**
- SPA terpisah di path `/ai-job-search/` (build Vite `index-CGpw4jSD.js`), bukan bagian dari JHipster app. **[V]**
- Nama host `mcp.` + path `ai-job-search/agents` → **[I]** dibangun sebagai **agent + endpoint bergaya MCP (Model Context Protocol)** sehingga agent-nya bisa juga dipakai dari klien AI eksternal (Claude, ChatGPT, dsb.), bukan hanya UI chat mereka.
- Dibangun di atas **Cloudflare Agents** (runtime agent di Workers/Durable Objects — stateful, WebSocket, edge). **[V]**
- **[I]** Kemungkinan tool yang dimiliki agent: cari lowongan, simpan ke tracker, cek match score, draft lamaran — karena itu modul inti Teal.

---

## 6. Rekonstruksi cara kerja fitur inti (semua label [I] kecuali disebut lain)

- **Resume builder:** dokumen JSON terstruktur → dirender komponen React → export PDF di **server** (`resume.service`), bukan client (tidak ada `jspdf`/`html2canvas`/`pdf-lib` di bundle → **[V]** bahwa export PDF bukan di browser). Editor memakai TipTap.
- **Job tracker + extension:** ekstensi membaca halaman lowongan (mayoritas board punya JSON-LD `schema.org/JobPosting`) lalu POST ke API; tracker menyimpan tahapan. 40+ board = daftar domain yang diizinkan, bukan integrasi API per board.
- **Keyword match / ATS check:** ekstraksi keyword job description (NLP/LLM) → bandingkan dengan token resume → skor + saran; free dibatasi "Top 5".
- **Kredit AI:** metering per aksi (bullet 10 credit, summary 2, cover letter 2) → paywall Stripe saat habis.
- **Email per tahap lamaran:** template + otomasi (Customer.io untuk pengiriman lifecycle).

---

## 7. Blueprint: cara membangun produk serupa

> Bagian ini rekomendasi, bukan fakta tentang Teal. Disusun agar bisa dipakai langsung untuk proyek seperti Ai-Career-Hub.

### 7.1 Prinsip & urutan build

1. **Bangun funnel dulu, bukan fitur terdalam.** Ekstensi Chrome gratis → akun → tracker = mesin akuisisi Teal. Tanpa funnel, fitur bagus pun tak ada yang pakai.
2. **Konten SEO adalah moat.** Ribuan halaman contoh resume/cover letter/synonym per role & industri menarik trafik organik yang dikonversikan ke produk.
3. **Monetisasi = kredit AI + batas free.** Metering jelas, upgrade mulus (Stripe/local gateway).
4. **Jangan langsung microservices** kecuali tim besar. Teal pakai JHipster microservices — hasil warisan generator; untuk tim kecil, **monolith modular** lebih murah dioperasikan, dengan pemisahan service hanya untuk beban khusus (mis. render PDF).
5. **Rakit dari komponen teruji**: Radix/shadcn + Tailwind + TipTap + Recharts (persis pilihan Teal) — cepat, aksesibel, tidak terlihat generik kalau taste-nya dijaga.

### 7.2 Arsitektur rekomendasi (setara fungsi, lebih sederhana)

```
[Chrome Extension] --POST--> [API]
[Web App (SPA/SSR)] --REST--> [API: auth, jobs, resumes, ai]
[PDF Service terpisah] <---- render & storage
[AI Router: multi-provider] <-- OpenAI/Anthropic/Gemini
[Agent (opsional): Cloudflare Agents / Vercel AI SDK] --> tools ke API
[Cloudflare: WAF, bot mgmt, images] di depan semua
[Stripe/Midtrans] [Email lifecycle] [Analytics + A/B]
```

### 7.3 Data model inti (kerangka)

- `users`, `profiles`
- `resumes` (dokumen JSON: sections, style tokens; versi)
- `templates`, `designs`
- `jobs` (source_url, company, title, description, keywords[], saved_at)
- `applications` (job_id, stage: saved→applied→interview→offer→closed, notes)
- `contacts`, `activities`
- `cover_letters`
- `ai_credits` / `usage_events` (per aksi & model)
- `subscriptions`, `payments`
- `email_templates` (per tahap)
- `match_results` (score, missing_keywords[])
- Konten SEO: `career_paths`, `resume_examples` (halaman terprogram)

### 7.4 Fitur → implementasi teknis

- **Resume builder:** editor TipTap + schema tetap (kompatibel JSON Resume) → preview React → PDF render server-side (Node + Playwright/Chromium atau headless renderer) + storage.
- **Design Mode:** design token per template (font/ukuran/spacing/warna) + preset; simpan sebagai JSON.
- **Chrome extension:** Manifest V3; content script deteksi `JobPosting` JSON-LD; popup "Save to tracker"; auth via token; syarat store review disiapkan dari awal.
- **Keyword match:** pipeline: HTML job → teks bersih → ekstraksi skill/qualification (taxonomy + LLM) → scoring vs resume → output "missing keywords".
- **AI writer:** prompt template per use-case + **router multi-model** (kualitas/biaya/kecepatan) + credit metering + retry/fallback antar provider + redaksi PII saat mengirim ke model.
- **Agent chat:** bangun di runtime agent edge (Cloudflare Agents atau Vercel AI SDK di route handler) dengan tool: `search_jobs`, `save_job`, `match_score`, `draft_cover_letter`; **ekspos juga endpoint MCP** agar bisa dipakai dari klien AI eksternal — pembeda yang bisa diadopsi lebih awal.
- **Email per tahap:** lifecycle tool (Customer.io/alternatif lokal) + template per stage + reminder otomatis.

### 7.5 Roadmap MVP (estimasi kasar, 1–2 dev full-time; label perkiraan)

1. **Fase 0 (2–3 minggu):** auth, profil, simpan job manual, tracker sederhana, PDF export dasar.
2. **Fase 1 (4–6 minggu):** **ekstensi Chrome** + save-to-tracker, kanban pipeline, email templates per tahap.
3. **Fase 2 (4–6 minggu):** resume builder + design mode, keyword match, AI credits + paywall.
4. **Fase 3 (4–6 minggu):** cover letter generator, analysis mode, halaman SEO programmatic (contoh resume per role).
5. **Fase 4 (tanpa batas):** agent chat + MCP, multi-model routing lanjutan, program afiliasi.

---

## 8. Implikasi untuk Ai-Career-Hub (proyek Anda)

- Anda **sudah punya analog `resume.service`**: `pdf-server/` terpisah — pola yang sama dengan Teal. Pertahankan pemisahan itu.
- **Belum ada Chrome extension** — ini funnel terbesar Teal dan bisa jadi pembeda di pasar Indonesia yang belum jenuh.
- Aset SEO (blog, halaman karir) sudah ada; polanya bisa diperluas menjadi halaman **programmatic** (contoh resume per role/kota/industri).
- **Kredit AI + paket berbayar** (Midtrans) sejalan; pastikan metering per aksi seperti Teal (bullet/summary/cover letter) — granularitas ini memudahkan konversi.
- Pertimbangkan **router multi-model** sejak awal (abstraksi provider) — Teal mengganti/menambah model tanpa mengubah fitur.
- **Agent + MCP** masih "beta" bahkan di Teal (Okt 2026) — peluang menang lebih awal di segmen lokal.
- Pertimbangkan **Cloudflare** di depan app (WAF + bot management + Images) — murah, dan perilaku Teal menunjukkan bot management mereka efektif.
- Perhatikan pelajaran negatif juga: microservices JHipster membawa kompleksitas operasional besar; untuk tim kecil, monolith modular + 1–2 service khusus lebih realistis.

---

## 9. Gap riset & cara menutupnya

| Gap | Sebab | Cara menutup |
|---|---|---|
| Listing ekstensi Chrome (ID, permissions, jumlah install) | CWS butuh JS; mesin pencari & mirror pihak ketiga terblokir dari environment ini | Buka `chromewebstore.google.com` dari browser biasa, cari "Teal Resume Builder" |
| Nominal & tanggal pendanaan | Crunchbase/Product Hunt diblokir; Wayback kosong | Akses Crunchbase langsung; cari arsip artikel berita pendanaan |
| Isi produk pasca-login (API, data model asli) | Perlu akun; tidak dicoba (tidak etis/bypass) | Buat akun trial sendiri bila diperlukan untuk riset fitur |
| Versi Spring Boot/JHipster, DB, broker | Tidak terekspos (403 di management endpoints) | Tidak ada jalur publik — cukupkan sebagai inferensi |
| Daftar model AI & harga sepenuhnya lengkap | Bundle di-sample; harga bisa A/B | Pantau deploy bundle berikutnya; catat tanggal |

---

## Lampiran A — Inventaris bukti mentah

**HTML `app.tealhq.com` (7 Okt 2026):** `div#jhipster-error`; `link rel=manifest` → `manifest.webapp`; polyfill `es2018–es2022`; GTM `GTM-MKVKQS9`; Google Ads `AW-648264820`; VWO `account_id=854157`; Customer.io `47fa074b34c0445dc803`; ShareASale `dwin1.com/37884.js`; komentar `react-joyride > react-floater`; aset `assets/main-BzIxTDIx.js`, `assets/vendor-qlsOBgAj.js`, `assets/vendor-DVneG3Rq.css`, `assets/main-Gxkk6unj.css`.

**Bundle `vendor.js` + `main.js`:** `react-dom` renderer `version:"19.2.1"`; `__vite__`×69; Zod×299; Radix×118+16; Lucide×214; cmdk×54; Recharts×91; TipTap×22+3; ProseMirror×6; Yup×20; Redux; axios; moment×34; lodash; DOMPurify; Intercom (`api-iam.intercom.io`); Stripe (`js.stripe.com/v3`); Amplitude×86+12; model AI `openai/gpt-5.6-sol|terra`, `anthropic/claude-opus-4.6`, `anthropic/claude-sonnet-5`; host: `auth.service`, `resume.service`, `workstyles.service`, `locations.` , `mcp.`, `help.`; path `ai-job-search/agents`.

**CSS:** `--tw-`×1393; `ant-`/`Mui`/`col-md-`/`chakra`/`mantine` = 0.

**`mcp.tealhq.com`:** title "Teal Job Search Agent (Beta)"; desc "AI-powered chat agent built with Cloudflare Agents"; `noindex,nofollow`; SPA `/ai-job-search/assets/index-CGpw4jSD.js`.

**`www.tealhq.com`:** Webflow (`/vendor/webflow/jquery-3.5.1.min.js?site=62775a91cc3db44c787149de`, `thq-schunk-1/3.js`, `thq-main-2.js`, `gsap.min.js`), `imagedelivery.net`, Amplitude experiment.

**BuiltWith (tealhq.com):** 58 teknologi live; Amplitude, Facebook Pixel, GA/GTM, Google Ads, Cloudflare DNS/CDN/Hosting, AWS Lambda, Google Workspace, IPv6, SPF; AI Index 30/100.

**Header contoh (`app.tealhq.com` via curl):** `403` Cloudflare + `__cf_bm` cookie, `cf-ray: ...-SIN` (edge Singapura) — bot management aktif menolak client non-browser.

## Lampiran B — URL sumber utama

- `https://app.tealhq.com/` + aset `/assets/*` dan `/manifest.webapp`
- `https://www.tealhq.com/`, `/pricing`, `/about`, `/careers`
- `https://mcp.tealhq.com/`
- `https://api.ashbyhq.com/posting-api/job-board/tealhq`
- `https://builtwith.com/tealhq.com`
- Verifikasi silang harga/traction/investor: `www.tealhq.com/pricing` & `/about` (7 Okt 2026)
