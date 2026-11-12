#!/usr/bin/env python3
from pathlib import Path
import html, re, json
BASE=Path(__file__).resolve().parent.parent
source=(BASE/'js/catalog.js').read_text()
arr=re.search(r'export const tools = \[(.*?)\]\.map',source,re.S).group(1)
entries=re.findall(r"\['([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)'\]",arr)
print('Found',len(entries),'tools')
for slug,title,category,description,icon,kind in entries:
 t=html.escape(title); desc=html.escape(description); name=html.escape(slug)
 metadata=f'{t} online free — no document upload | SUDYP PDF'
 what=f'Use {title.lower()} on files stored in your browser. Document processing runs on your device, without uploading to a file-processing service.'
 how=f'Choose your files, adjust options if needed, select Create output, and download the result.'
 faq=[{'@type':'Question','name':f'How do I use {title.lower()}?','acceptedAnswer':{'@type':'Answer','text':how}},{'@type':'Question','name':f'Are my files uploaded when I use {title.lower()}?','acceptedAnswer':{'@type':'Answer','text':'No. Files are read and processed locally in the browser. Some processing libraries may download from a CDN before use.'}}]
 jsonld=[{'@context':'https://schema.org','@type':'SoftwareApplication','name':f'{title} — SUDYP PDF','applicationCategory':'ProductivityApplication','operatingSystem':'Any modern browser','url':f'https://sudyp07.github.io/sudyp-pdf/tools/{slug}.html','description':description,'offers':{'@type':'Offer','price':'0','priceCurrency':'USD'},'isAccessibleForFree':True},{'@context':'https://schema.org','@type':'FAQPage','mainEntity':faq}]
 accept='.pdf,application/pdf'
 if kind=='images':accept='.png,.jpg,.jpeg,image/png,image/jpeg'
 if kind=='pdf-or-image':accept='.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'
 if kind=='single-docx':accept='.docx'
 if kind=='single-xlsx':accept='.xlsx'
 if kind=='single-pptx':accept='.pptx'
 if kind=='single-html':accept='.html,.htm'
 if slug=='unlock-pdf':accept='.pdf,.spdf'
 out=f'''<!doctype html>
<html lang="en" data-base=".." data-tool="{name}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#087858">
<title>{html.escape(metadata)}</title><meta name="description" content="{desc} Private, free PDF tools with local processing and no signup.">
<link rel="canonical" href="https://sudyp07.github.io/sudyp-pdf/tools/{name}.html">
<meta property="og:type" content="website"><meta property="og:site_name" content="SUDYP PDF"><meta property="og:title" content="{t} — Free PDF Tool"><meta property="og:description" content="{desc}"><meta property="og:image" content="https://sudyp07.github.io/sudyp-pdf/assets/og-cover.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml"><link rel="manifest" href="../manifest.json">
<link rel="stylesheet" href="../css/style.css?v=9"><link rel="stylesheet" href="../css/themes.css"><link rel="stylesheet" href="../css/components.css?v=9"><link rel="stylesheet" href="../css/tools.css?v=9"><link rel="stylesheet" href="../css/responsive.css?v=9"><link rel="stylesheet" href="../css/next.css?v=9">
<script type="application/ld+json">{json.dumps(jsonld,ensure_ascii=False).replace('</','<\\/')}</script></head>
<body><div id="site-header"></div><main>
<section class="container workspace-header"><div class="breadcrumbs"><a href="../index.html">Home</a> / <a href="../tools.html">PDF tools</a> / <span>{t}</span></div><span class="home-eyebrow">{html.escape(category).upper()} / PRIVATE WORKSPACE</span><h1 id="workspace-title">{t}</h1><p id="workspace-description">{desc}</p></section>
<section class="container workspace-layout"><div class="workspace-main">
<div class="workspace-card"><h2 data-i18n="selectFile">01. Choose your files</h2><p>Choose documents from your device. No uploads, no registration.</p>
<div class="dropzone" id="dropzone" tabindex="0" role="group" aria-label="Choose or drop files"><div class="dropzone-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 17V3m0 0-5 5m5-5 5 5M4 17v4h16v-4"/></svg></div><label id="drop-caption" for="file-input" class="drop-title">Choose files</label><p>Drop files here or choose them from your device.</p><small id="drop-hint">PDF files</small><input class="file-picker" id="file-input" type="file" multiple accept="{accept}" aria-label="Choose documents"></div><div class="file-list" id="file-list" aria-live="polite"></div></div>
<div class="workspace-card" id="workspace-extra" style="display:none"></div><div id="result-container"></div>
</div><aside class="workspace-side">
<div class="workspace-card"><h2 data-i18n="setOptions">02. Options &amp; export</h2><p>Adjust settings, then process your files locally.</p><div id="options-container" class="options"></div>
<div class="action-column" style="margin-top:20px"><button type="button" class="button button-primary" id="process-button">Create output →</button><button type="button" class="button button-secondary" id="reset-button">Clear workspace</button></div><div class="workspace-progress" id="workspace-progress" role="progressbar" aria-label="Processing progress"><i id="workspace-progress-fill"></i></div>
<p id="status" class="status-line" role="status" aria-live="polite" style="margin:14px 0 0">Ready for upload.</p></div>
<div class="workspace-card"><h3>🔒 0 bytes uploaded</h3><div class="privacy-note">Your file stays in your browser. <span id="workspace-local-count">0 files processed locally</span>. No document server or database.</div><p class="muted-small">Some document engines download once before offline processing works.</p></div>
<div class="workspace-card"><h3>Help &amp; limitations</h3><ol class="help-steps"><li>Choose or drop one or more files.</li><li>Review the available options.</li><li>Process and download your result.</li></ol><a class="inline-link" href="../help.html">Detailed guide →</a></div>
</aside></section>
<section class="container home-faq"><span class="home-eyebrow">ABOUT THIS TOOL</span><h2>How to use {t}</h2><p>{html.escape(what)}</p><details><summary>How do I use it?</summary><p>{html.escape(how)}</p></details><details><summary>Where do my files go?</summary><p>Your PDFs remain on this device. The browser may fetch processing libraries on first use, but it does not transmit the document to those services.</p></details></section>
</main><div id="site-footer"></div><div id="toasts" aria-live="polite"></div>
<script src="../js/upload-bridge.js?v=9" defer></script><script type="module" src="../js/workspace.js?v=9"></script>
</body></html>
'''
 (BASE/'tools'/f'{slug}.html').write_text(out)
print('Pages written.')
