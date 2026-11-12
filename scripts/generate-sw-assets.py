#!/usr/bin/env python3
"""Rebuild the PWA precache list using actual local files (safe to run repeatedly)."""
from pathlib import Path
import json
base=Path(__file__).resolve().parent.parent
accepted={'.html','.js','.css','.json','.png','.svg','.webp','.wasm','.gz'}
files=[]
for path in sorted(base.rglob('*')):
    if not path.is_file() or path.suffix not in accepted:continue
    rel=path.relative_to(base).as_posix()
    if rel.startswith(('.github/','scripts/')) or rel == 'sw-assets.js':continue
    # OCR is optional/larger and is cached on first use rather than at PWA installation.
    if rel.startswith('vendor/tesseract') or rel.startswith('vendor/tessdata/'):continue
    files.append('./'+rel)
(base/'sw-assets.js').write_text('self.SUDYP_ASSETS = '+json.dumps(files,ensure_ascii=False)+';\n')
print('Precached',len(files),'assets')
