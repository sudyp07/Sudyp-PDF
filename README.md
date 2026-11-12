# 📄 SUDYP PDF

**A free, privacy-first, client-side PDF toolkit.** 
Built entirely with HTML5, CSS3, and Vanilla JavaScript. No backend, no database, no build step, no login, and absolutely zero tracking. 

🚀 **Try it live right now:** **[https://sudyp07.github.io/Sudyp-PDF/](https://sudyp07.github.io/Sudyp-PDF/)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen)](https://sudyp07.github.io/Sudyp-PDF/)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## ✨ Features & Capabilities

Sudyp PDF is a comprehensive suite of document tools that run **100% in your browser**. Your files never leave your device.

- **Convert:** Best-effort conversions between PDF and DOCX, XLSX, PPTX, HTML, and Images.
- **Edit & Organize:** Merge, split, organize pages, and visually replace text (with rasterization).
- **Optimize:** Compress, repair, grayscale, and clean metadata.
- **Batch Processing:** Drop multiple files to process them at once. Multi-document operations package the results into a convenient ZIP file.
- **Student Tools:** Includes flashcards and other dedicated tools (saved locally via `localStorage`).
- **Security:** Unlock password-protected PDFs (flattens to an image) and add visual signatures.

## ⚠️ Important Disclaimers

Because this is a fully client-side browser application, some operations are deliberately **best-effort**:
- **Conversions:** DOCX/PPTX/HTML to PDF extracts readable text, not complex layouts, images, or fonts. PDF to DOCX/XLSX extracts raw text into basic paragraphs/columns.
- **Compression & Repair:** Rebuilds rasterized pages. Selectable text, hyperlinks, and fields will be lost.
- **Security:** The Unlock tool creates a flattened image copy. Cryptographic encryption/cracking is not implemented. 
- **Editing:** Replacing text rasterizes the affected pages. **Never use this for secure redaction.**
- **Privacy:** Files are temporary in the browser. Only theme preference, recent tools, and manual flashcards are saved to `localStorage`.

## 💻 Local Development

Always serve the directory over HTTP; **do not** double-click `index.html` using the `file://` protocol, as the service workers and CORS policies require a local server.

- **VS Code:** Install the **Live Server** extension, open the project folder, and click **Go Live**.
- **Python:** Run `py -m http.server 5500` in the project directory and visit `http://localhost:5500`.
- **No build step or dependency installation is required.**

## 🚀 Deploy on GitHub Pages (For your own fork)

If you want to host this project yourself for free on GitHub Pages:

1. Create a **public** GitHub repository.
2. Upload the **contents** of this folder directly into the repository root (ensure `index.html` is in the root, not inside a subfolder).
3. Commit and push to the `main` branch.
4. Go to **Settings → Pages → Build and deployment**.
5. Choose **Deploy from a branch**, select **main**, and choose **/(root)**. Click **Save**.
6. Your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`.

## 📦 Tech Stack & Libraries

This project relies on lazy-loaded, client-side processing libraries:
- **[pdf-lib 1.17.1](https://github.com/Hopding/pdf-lib):** For PDF creation and modification (MIT).
- **[PDF.js 3.11.174](https://mozilla.github.io/pdf.js/):** For rendering and text extraction (Apache-2.0).
- **[JSZip](https://stuk.github.io/jszip/):** For ZIP and Office Open XML processing (MIT). Included locally under `vendor/`.

*Note: Libraries are loaded via CDNs. An internet connection is required when a library is first used. Offline caching does not guarantee offline PDF processing.*

## 📁 Project Structure

- `index.html`, `tools.html`, `student-tools.html` — Main entry points
- `/tools/` & `/student/` — Dedicated tool pages
- `/css/`, `/js/`, `/assets/`, `/vendor/` — Core files and local libraries
- `sw.js` & `manifest.json` — Service worker and PWA configuration

## 👨‍💻 Author

**Sudip Nepal**
- Live App: [https://sudyp07.github.io/Sudyp-PDF/](https://sudyp07.github.io/Sudyp-PDF/)
- GitHub: [@sudyp07](https://github.com/sudyp07)
- Project Repo: [https://github.com/sudyp07/Sudyp-PDF](https://github.com/sudyp07/Sudyp-PDF)

## 📄 License

© 2026 Sudip Nepal. 

*Please note that individual third-party libraries may have their own licenses (MIT, Apache-2.0) as noted in the Tech Stack section.*
