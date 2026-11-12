# SUDYP PDF

Free static PDF toolkit built using HTML, CSS, and vanilla JavaScript. No backend, database, account system, paid plan, user data collection, or cloud file processing. Theme: white / emerald / black / royal blue.

## What this edition adds

- Hero file drop zone with Merge / Split / Compress, multi-file picker, and Merge → Compress pipeline.
- Global Ctrl/Cmd+K command palette, recent tool shortcuts, favorites and anonymous local-only processed-file counters.
- Local progress states and real before/after file size information for compression. Optional best-effort compression target for university portals.
- AES-GCM .spdf file encryption and authenticating unlock; **.spdf is NOT a password-protected standard PDF**. Existing encrypted PDF files may be opened only with the known password and are rasterized on export. No password cracking.
- OCR workspace using Tesseract.js, English and Nepali when worker/core/language assets are installed.
- Student cover page generator with Tribhuvan University-style / University of the People-style / classic layouts (not official templates); APA/Harvard basic reference organiser; submission pack that merges and numbers PDFs.
- Nepali/English UI toggle for major navigation and homepage labels. Nepali PDF generation via browser-canvas Unicode rendering if the browser's Devanagari font works; these pages are image-based, not searchable.
- Manifest, service worker and precache; per-tool SEO titles, metadata, FAQs, `SoftwareApplication` structured data, sitemap and OG preview PNG.
- Optional GoatCounter page-view analytics, **disabled by default**. If enabled, it sends page-view data externally, never document files.

## GitHub Pages deployment — recommended for bundled offline libraries

1. Create a **public** GitHub repository, preferably named `sudyp-pdf`, under `sudyp07`.
2. Upload the **contents** of this project folder to the repository root (`index.html` must be in the root).
3. In **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
4. Go to **Actions → Publish SUDYP PDF to GitHub Pages** and run it if it hasn't started on your first push.
5. The workflow downloads the pinned `pdf-lib`, `PDF.js` and PDF worker assets, optionally OCR assets, rebuilds the PWA precache inventory, and deploys a fully static site. No runtime server/database is used.
6. Open `https://sudyp07.github.io/sudyp-pdf/` (adjust the path if you use another repository name).
7. Visit once online and allow the service worker to finish caching before going offline. OCR assets may first need to be opened/downloaded separately; larger assets are deliberately not pre-cached to keep the first visit fast.

**Important:** Due to unavailable outbound downloads in the archive-building environment, the supplied ZIP includes JSZip, all application code and a GitHub Actions downloader, but does **not** contain the large `pdf-lib`, `PDF.js` or Tesseract binaries. The GitHub Actions deployment fetches and bundles PDF engines in the published site. The ZIP itself needs a connection to load those engines until the optional local setup has completed.

### Run locally in VS Code

Open the extracted project root in VS Code and start Live Server, or run:

```powershell
py -m http.server 5500
```

Open `http://localhost:5500/`.

For offline development on Windows, first run from the project root (with an internet connection):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-offline.ps1
py -m http.server 5500
```

The optional setup downloads processing libraries to `vendor/` once. After installation, check that all requested `.js`, `.wasm`, and `.traineddata.gz` files exist. No `npm install` or build command is required for local preview.

### Use a custom domain

Purchase or use a domain you own, add its DNS records as instructed by GitHub Pages, and set the domain in repository **Settings → Pages → Custom domain**. Then update canonical URLs, `sitemap.xml`, and Open Graph image URLs from the default `sudyp07.github.io/sudyp-pdf` location. No custom domain was supplied, so this project has no `CNAME` entry.

### Analytics

Analytics are **off** by default. Optionally set `goatCounterUrl` to your own GoatCounter website in `js/site-config.js`. This introduces an external page-view request and should be disclosed in your site's privacy policy. File data is never included.

## Engineering notes and limits

- Only browser JavaScript libraries fetch across the network; document bytes are processed locally. The service worker caches app assets, not PDF contents. File data stays in memory.
- The homepage has zero uploaded document bytes; counters saved locally record only the number of successful jobs/files, never filenames, content, images, passwords, or metadata.
- PDF manipulation relies on pinned **pdf-lib 1.17.1** (MIT); render/extract on **PDF.js 3.11.174** (Apache-2.0); ZIP on local **JSZip**; OCR on optional **Tesseract.js 5.1.1** / core (Apache-2.0). These tools may fail for password-protected, corrupted or highly complex PDFs, and large files can exhaust browser memory.
- Text replacement in existing PDFs is visual. Edited pages are flattened to images; original embedded font/line breaks cannot be recreated exactly. Not suitable for secure redaction.
- DOCX/XLSX/PPTX/HTML conversions reconstruct readable text only, not native Office layout, charts, or full tables.
- Compression rasterizes pages and may **increase** size. Compression targets are best-effort and always report actual sizes.
- OCR accuracy varies; image resolution, script, scan quality and device memory matter. First OCR startup with large language assets can take time.
- `Protect PDF file` encrypts file contents as `.spdf` using PBKDF2 + AES-GCM. This is not compatible with PDF reader password prompts; users must unlock it here to recover the original PDF.
- Do not use this project as a substitute for specialised document redaction, forensic sanitisation or certified signature software.

## Verification

Code/lint-like JS syntax checks, page path checks, real browser file selection/drop tests, HTTPS service-worker paths, and client-side encryption round-trip can be checked with browser automation in local environment. Real vendor-engine processing requires the pinned library files to download; if network blocks installation, it cannot be verified end-to-end until those files are present.

© 2026 Sudip Nepal · https://github.com/sudyp07
