# SUDYP PDF

A free, client-side PDF toolkit made with HTML5, CSS3 and vanilla JavaScript. No backend, database, Node.js, build step, login or tracking.

## Deploy on GitHub Pages

1. Create a **public** GitHub repository, for example `sudyp-pdf`.
2. Upload the **contents** of this folder directly into the repository root (so `index.html` is in the root).
3. Commit and push to `main`.
4. Open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, **main**, **/(root)** and **Save**.
5. Visit `https://YOUR-USERNAME.github.io/sudyp-pdf/`.

For a user/organization site named `YOUR-USERNAME.github.io`, use `https://YOUR-USERNAME.github.io/` instead. Relative file paths support either route.

## Develop locally

Always serve the directory over HTTP; do not double-click `index.html` using `file://`. In VS Code install Live Server, open this folder, and select **Go Live**. Alternatively run `py -m http.server 5500` in the project directory and visit `http://localhost:5500`. No Node build or dependency installation is required.

## Document processing and libraries

- **pdf-lib 1.17.1** is lazy-loaded from jsDelivr, for PDF creation and modification (MIT).
- **PDF.js 3.11.174** is lazy-loaded from cdnjs, for rendering and text extraction (Apache-2.0).
- **JSZip** is included under `vendor/` for ZIP and Office Open XML processing (MIT or GPLv3 dual-licensed; used under MIT).

Library delivery uses CDNs, but the application does not upload document contents, create remote accounts, or call processing APIs. A network connection is needed when a library is first loaded; offline app shell caching is not a guarantee of offline PDF processing.

## Functional scope

The PDF tools are browser-side implementations; processing libraries must load successfully for operations to complete. Some operations are deliberately **best effort**:
- DOCX, XLSX, PPTX and HTML → PDF extract readable text, not original complex layout, images, charts or fonts.
- PDF → DOCX extracts text into simple Word paragraphs. PDF → XLSX puts extracted lines into spreadsheet column A; table structure is not inferred.
- Compress/repair/grayscale rebuild rasterized pages: selectable text, hyperlinks, fields and layer data are lost and compression might not reduce size.
- The metadata cleaner clears common PDF metadata but does not guarantee deep forensic scrubbing.
- PDF comparison compares extracted text, not pixel differences.
- Signature tool adds a visual signature image, not a cryptographic digital signature.
- The editor supports selecting PDF text runs for visual replacement with inferred size and approximate font family. Replaced-text pages are rasterized so original text objects from those pages are not kept; other pages remain vector. Exact matching of every PDF embedded font, complex text layout, and native editing of the original PDF text structures is not possible in this browser-only build. Never use visual text replacement for secure redaction.
- Password-protected documents can be opened with a password you know using the Unlock tool; the new PDF is a flattened image copy. Password encryption, password cracking, full OCR and exact layout reconstruction are not implemented.
- Standard PDF fonts may replace unsupported non-Latin characters with `?` in newly generated documents.

Files are temporary in the browser. Only theme preference, favorite tool IDs, recently used tool IDs, and manually entered flashcards use localStorage.

## Static project layout

`index.html`, `tools.html`, `student-tools.html`, general pages, dedicated `/tools/` and `/student/` pages, `/css/`, `/js/`, `/assets/`, `/vendor/`, `sw.js`, and `manifest.json`.

© 2026 Sudip Nepal · https://github.com/sudyp07

## Upload and batch processing

- Tool pages use a visible native file picker and prevent PDF drops from navigating the browser away. Drop multiple files anywhere on a tool page or choose them together.
- Merge and image-to-PDF tools combine files in list order, which can be changed by dragging the rows. Compare accepts exactly two PDFs.
- Single-document operations that support batch processing package separate results in a ZIP when given more than one PDF.
- Organize, Reader, Sign, Edit and Form Filler use one PDF at a time so that per-document previews and forms remain understandable.
- If the PDF engine cannot load, selected files stay visible; processing reports a clear error instead of failing silently.
