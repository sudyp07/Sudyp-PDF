import {recordLocalJob,getLocalStats} from './local-stats.js?v=9';
import {mountShell,icon,esc,notify,bySlug,recent,url} from './ui.js?v=9';
import {loadLib,loadPdf,readPdf,render,sizeLabel,blobDownload,basename,pagesFromSpec,canvasBlob} from './core.js?v=9';
import {processFiles,optionsFor,value,makeZip} from './processors.js?v=9';
mountShell();
const slug=document.documentElement.dataset.tool;
const tool=bySlug(slug);
const title=document.getElementById('workspace-title');
const subtitle=document.getElementById('workspace-description');
if(!tool){title.textContent='Tool unavailable';subtitle.textContent='This tool does not exist. Visit the tool directory.';throw Error('Unknown tool')}
document.title=`${tool.title} – Free Online Tool | SUDYP PDF`;
title.textContent=tool.title;subtitle.textContent=tool.description;
recent(slug);
const $=id=>document.getElementById(id);
const extra=$('workspace-extra'), fileInput=$('file-input'),drop=$('dropzone');
const interactive=new Set(['organize','edit-pdf','sign-pdf','reader','form-filler']);
const batchable=(tool.input==='single'||tool.input==='pdf-or-image')&&!interactive.has(slug);
const multiple=['multiple','multiple-two','images','pdf-or-image'].includes(tool.input)||batchable;
fileInput.multiple=multiple;fileInput.accept=({ 'single':'.pdf,application/pdf','multiple':'.pdf,application/pdf','multiple-two':'.pdf,application/pdf','images':'.jpg,.jpeg,.png,image/jpeg,image/png','single-docx':'.docx','single-xlsx':'.xlsx','single-pptx':'.pptx','single-html':'.html,.htm','pdf-or-image':'.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png' }[tool.input]||'.pdf');
if(slug==='jpg-to-pdf')fileInput.accept='.jpg,.jpeg,image/jpeg';
if(slug==='png-to-pdf')fileInput.accept='.png,image/png';
if(slug==='unlock-pdf')fileInput.accept='.pdf,.spdf';
fileInput.setAttribute('aria-label',`Select ${tool.title} input files`);
// Native label[for=file-input] opens the file chooser even if application code fails.
$('options-container').innerHTML=optionsFor(slug);
$('drop-caption').textContent=multiple?'Select one or several files':'Choose a document';
$('drop-hint').textContent=tool.input?.includes('docx')?'DOCX file only':tool.input?.includes('xlsx')?'XLSX file only':tool.input?.includes('pptx')?'PPTX file only':tool.input?.includes('html')?'HTML file only':tool.input==='images'?'JPG or PNG images':'PDF files · up to 200 MB per file';
let files=[],output=null,processing=false,organizePages=[],editorMarks=[],editorRedo=[],editorPage=1,editorPDF=null,readerPDF=null,readerPage=1,readerZoom=1,signatureDrawn=false;
const setStatus=(msg,error=false)=>{let e=$('status');e.textContent=msg;e.classList.toggle('error',error)};
const progress=(current=null,total=null)=>{const bar=$('workspace-progress'),fill=$('workspace-progress-fill');if(!bar||!fill)return;bar.classList.add('is-visible');bar.classList.toggle('indeterminate',current===null||!total);if(current!==null&&total){const pct=Math.max(0,Math.min(100,current/total*100));fill.style.width=pct+'%';bar.setAttribute('aria-valuenow',String(Math.floor(pct)))}else{fill.style.width='';bar.removeAttribute('aria-valuenow')}};
const clearProgress=()=>{$('workspace-progress')?.classList.remove('is-visible','indeterminate')};
const updateCounter=()=>{const el=$('workspace-local-count');if(el)el.textContent=getLocalStats().files+' files processed locally'};updateCounter();document.addEventListener('sudyp:local-job',updateCounter);
const list=$('file-list');
const loadFiles=async next=>{
  try{if(!next.length)return;for(let f of next){let ext=f.name.split('.').pop().toLowerCase();const types={'images':slug==='jpg-to-pdf'?['jpg','jpeg']:slug==='png-to-pdf'?['png']:['jpg','jpeg','png'],'pdf-or-image':['pdf','jpg','jpeg','png'],'single-docx':['docx'],'single-xlsx':['xlsx'],'single-pptx':['pptx'],'single-html':['html','htm']}[tool.input]||(slug==='unlock-pdf'?['pdf','spdf']:['pdf']);if(!types.includes(ext))throw Error(`Unsupported file: ${f.name}. Expected ${types.join(' or ').toUpperCase()}.`);if(f.size===0||f.size>200*1024*1024)throw Error('Files must be non-empty and no more than 200 MB each.')}
    if(tool.input==='multiple-two'&&[...files,...next].length>2)throw Error('This comparison accepts exactly two PDFs. Remove one before adding more.');
    files=multiple?[...files,...next]:[next[0]];
    output=null;$('result-container').innerHTML='';setStatus(`${files.length} file${files.length===1?'':'s'} ready. Choose options, then create output.`);renderFileList();$('process-button').disabled=false; 
    extra.innerHTML='';extra.style.display=['organize','edit-pdf','reader'].includes(slug)?'block':'none';if(slug==='sign-pdf')initSignature();if(slug==='organize')await initOrganize();if(slug==='edit-pdf')await initEditor();if(slug==='reader')await initReader();if(slug==='form-filler')await initFields();
    if(['analyzer','privacy-check','permission-check'].includes(slug))setStatus('Ready to inspect document.');
  }catch(e){setStatus(e.message,true);notify(e.message,'error')}
};
// The upload bridge receives native input changes and drops from anywhere on the page.
window.SudypUpload?.onFiles(selected => { void loadFiles(selected); });
async function addPageCounts(selected){for(const f of selected){if(!files.includes(f)||!/\.pdf$/i.test(f.name))continue;try{let d=await readPdf(f);const count=d.numPages;await d.destroy();if(!files.includes(f))continue;const idx=files.indexOf(f);const small=list.querySelector(`[data-index="${idx}"] .file-meta small`);if(small&&!small.textContent.includes('pages'))small.textContent+=` · ${count} page${count===1?'':'s'}`;}catch{/* Malformed PDFs are reported at processing time. */}}}
function renderFileList(){list.innerHTML=files.map((f,i)=>`<div class="file-item" draggable="${multiple}" data-index="${i}">${icon('file-text',19)}<div class="file-meta"><strong title="${esc(f.name)}">${esc(f.name)}</strong><small>${sizeLabel(f.size)}${multiple?' · drag to reorder':''}</small></div><button aria-label="Remove ${esc(f.name)}" data-remove="${i}" type="button">${icon('x',17)}</button></div>`).join('');list.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{files.splice(+b.dataset.remove,1);renderFileList();extra.innerHTML='';extra.style.display='none';output=null;$('result-container').innerHTML='';setStatus(files.length?`${files.length} file(s) selected.`:'Ready for upload.')}));list.querySelectorAll('[draggable="true"]').forEach(item=>{item.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',item.dataset.index);item.classList.add('is-dragging')});item.addEventListener('dragend',()=>item.classList.remove('is-dragging'));item.addEventListener('dragover',e=>e.preventDefault());item.addEventListener('drop',e=>{e.preventDefault();let from=+e.dataTransfer.getData('text/plain'),to=+item.dataset.index;if(!Number.isInteger(from)||from<0||from>=files.length||to<0||to>=files.length)return;let f=files.splice(from,1)[0];files.splice(to,0,f);renderFileList()})})}
// Global capture-phase drag handling stops the browser navigating to a dropped PDF.
drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click()}});
$('reset-button').addEventListener('click',()=>{files=[];output=null;organizePages=[];editorMarks=[];editorRedo=[];readerPDF=null;editorPDF=null;list.innerHTML='';extra.innerHTML='';extra.style.display='none';$('result-container').innerHTML='';$('form-fields')?.replaceChildren();setStatus('Workspace cleared. No files are retained.');fileInput.value='';});
$('process-button').addEventListener('click',async()=>{
  if(processing)return;if(!files.length){setStatus('Choose files first using the blue Choose files button.',true);notify('Select a file before processing.','error');return}if(tool.input==='multiple-two'&&files.length!==2){notify('Select two PDFs to compare.','error');return}processing=true;const button=$('process-button');button.disabled=true;button.innerHTML=`${icon('settings',18)} Working…`;setStatus('Processing locally in your browser…');$('result-container').innerHTML='';output=null;progress();
  try{let result;if(slug==='organize')result=await exportOrganized();else if(slug==='edit-pdf')result=await exportEdited();else if(slug==='sign-pdf')result=await exportSigned();else if(batchable&&files.length>1){
      const results=[];
      for(let i=0;i<files.length;i++){
        setStatus(`Processing file ${i+1} of ${files.length}: ${files[i].name}`);
        const item=await processFiles(slug,[files[i]]);progress(i+1,files.length);
        if(item.bytes==null)throw Error(`No downloadable output was generated for ${files[i].name}.`);
        results.push({name:item.filename,data:item.bytes});
      }
      result={bytes:await makeZip(results),filename:`${slug}-results.zip`,mime:'application/zip',description:`${results.length} processed files are ready in one ZIP.`};
    }else result=await processFiles(slug,files,(i,total)=>{progress(i,total);setStatus(`Processed ${i} of ${total} ${['jpg-to-pdf','png-to-pdf','image-to-pdf','merge'].includes(slug)?'files':'pages'}…`)});
    output=result;showResult(result);progress(1,1);recordLocalJob(files.length);setStatus('Completed successfully.');notify('File processed on your device.','success')
  }catch(e){let msg=String(e.message||e).replace(/Failed to parse PDF document.*/,'The PDF could not be read. It may be damaged or password-protected.');if(/encrypted|PasswordException|password.*incorrect/i.test(msg))msg='This PDF is password-protected or the password is incorrect. Try Unlock with password using the correct password.';setStatus(msg,true);notify(msg,'error')}
  finally{processing=false;button.disabled=false;button.innerHTML=`${icon('check',18)} Create output`;setTimeout(clearProgress,1700)}
});
function showResult(r){let elem=$('result-container');let desc=esc(r.description||'Processing completed.');let info=`<h3>${icon('check',18)} Finished</h3><p>${desc}</p>`;
if(r.stats?.Before&&r.stats?.After)info+=`<div class="result-numbers"><span><small>Before</small><strong>${esc(r.stats.Before)}</strong></span><span class="arrow">→</span><span><small>After</small><strong>${esc(r.stats.After)}</strong></span></div>`;
if(r.stats)info+=`<div class="table-output"><table><tbody>${Object.entries(r.stats).map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div>`;
if(r.searchResults)info+=`<div class="table-output"><table><thead><tr><th>Page</th><th>Matches</th><th>Excerpt</th></tr></thead><tbody>${r.searchResults.map(x=>`<tr><td>${x.page}</td><td>${x.count}</td><td>${esc(x.snippet)}</td></tr>`).join('')}</tbody></table></div>`;
if(r.diffs)info+=r.diffs.length?`<div class="compare-columns">${r.diffs.slice(0,5).map(d=>`<section><strong>Page ${d.page} · First</strong><pre>${esc(d.left.slice(0,1400))}</pre><strong>Second</strong><pre>${esc(d.right.slice(0,1400))}</pre></section>`).join('')}</div>`:'<p>No differences in extracted text were found.</p>';
if(r.viewer){info+=`<p>Use the reader controls below to navigate, search and zoom.</p>`;elem.className='result-box';elem.innerHTML=info;return}
info+=`<button type="button" class="button button-primary" id="download-output">${icon('download',18)} Download ${esc(r.filename)}</button>`;
elem.className='result-box';elem.innerHTML=info;elem.querySelector('#download-output')?.addEventListener('click',()=>{void blobDownload(r.bytes,r.filename,r.mime)});
}
async function initOrganize(){const file=files[0];if(!file)return;let pdf=await readPdf(file);organizePages=Array.from({length:pdf.numPages},(_,i)=>({index:i,angle:0,uid:`page${i}`}));extra.innerHTML='<h3>Arrange pages</h3><p class="muted-small">Drag cards to reorder. Duplicate, rotate, or remove pages before saving.</p><div class="thumb-grid" id="thumb-grid"></div><button class="button button-secondary button-small" id="load-thumbs" style="display:none">Show more thumbnails</button>';const grid=$('thumb-grid');let shown=0;
async function showMore(){let batch=organizePages.slice(shown,shown+12);for(const item of batch){if(!organizePages.includes(item))continue;const can=await render(pdf,item.index+1,.28);let card=document.createElement('div');card.className='page-thumb';card.draggable=true;card.dataset.uid=item.uid;card.innerHTML=`<div class="page-preview"></div><div class="thumb-foot"><span>Page ${item.index+1}</span><span><button data-op="rotate" aria-label="Rotate page">↻</button><button data-op="duplicate" aria-label="Duplicate page">+</button><button data-op="remove" aria-label="Remove page">×</button></span></div>`;card.querySelector('.page-preview').append(can);grid.append(card)}shown+=batch.length;$('load-thumbs').style.display=shown<organizePages.length?'inline-flex':'none';connectGrid()}
function connectGrid(){grid.querySelectorAll('.page-thumb').forEach(card=>{if(card.dataset.bound)return;card.dataset.bound='1';card.addEventListener('click',e=>{let b=e.target.closest('[data-op]');if(!b)return;let i=organizePages.findIndex(x=>x.uid===card.dataset.uid);if(i<0)return;const op=b.dataset.op;if(op==='remove'){if(organizePages.length<=1){notify('Keep at least one page.','error');return}organizePages.splice(i,1);card.remove();shown--;return}if(op==='rotate'){organizePages[i].angle=(organizePages[i].angle+90)%360;card.querySelector('canvas').style.transform=`rotate(${organizePages[i].angle}deg)`;return}const newItem={...organizePages[i],uid:`p${Date.now()}${Math.random()}`};organizePages.splice(i+1,0,newItem);let clone=card.cloneNode(true);clone.dataset.uid=newItem.uid;delete clone.dataset.bound;const src=card.querySelector('canvas'),dst=clone.querySelector('canvas');if(src&&dst)dst.getContext('2d').drawImage(src,0,0);card.after(clone);shown++;connectGrid()});card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',card.dataset.uid);card.classList.add('dragging')});card.addEventListener('dragend',()=>card.classList.remove('dragging'));card.addEventListener('dragover',e=>e.preventDefault());card.addEventListener('drop',e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');if(!from||from===card.dataset.uid)return;let a=organizePages.findIndex(x=>x.uid===from),b=organizePages.findIndex(x=>x.uid===card.dataset.uid);if(a<0||b<0)return;let item=organizePages.splice(a,1)[0];organizePages.splice(b,0,item);const moving=grid.querySelector(`[data-uid="${CSS.escape(from)}"]`);if(moving){const original=[...grid.children].indexOf(moving);const target=[...grid.children].indexOf(card);grid.insertBefore(moving,original<target?card.nextSibling:card)}})})}
$('load-thumbs').addEventListener('click',()=>void showMore());await showMore();setStatus(`${organizePages.length} pages loaded. Drag and edit thumbnails.`)}
async function exportOrganized(){if(!organizePages.length)throw Error('No pages selected.');const doc=await loadPdf(files[0]);const lib=await loadLib('pdf');const out=await lib.PDFDocument.create();for(const item of organizePages){let [page]=await out.copyPages(doc,[item.index]);page.setRotation(lib.degrees((page.getRotation().angle+item.angle)%360));out.addPage(page)}return {bytes:await out.save(),filename:`${basename(files[0])}-organized.pdf`,mime:'application/pdf',description:`${organizePages.length} pages exported in the selected order.`}}
function enableDrawing(canvas){const ctx=canvas.getContext('2d');ctx.strokeStyle='#1e293b';ctx.lineWidth=2.7;ctx.lineCap='round';let active=false;canvas.addEventListener('pointerdown',e=>{active=true;signatureDrawn=true;canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();ctx.beginPath();ctx.moveTo((e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height)});canvas.addEventListener('pointermove',e=>{if(!active)return;const r=canvas.getBoundingClientRect();ctx.lineTo((e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height);ctx.stroke()});canvas.addEventListener('pointerup',()=>active=false);canvas.addEventListener('pointercancel',()=>active=false)}
function initSignature(){const canvas=$('signature-canvas');if(!canvas)return;signatureDrawn=false;canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);enableDrawing(canvas);$('clear-signature').addEventListener('click',()=>{canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);signatureDrawn=false})}
async function exportSigned(){if(!signatureDrawn)throw Error('Draw your signature before exporting.');const lib=await loadLib('pdf');const d=await loadPdf(files[0]);const pageNum=+value('signature-page','1');if(pageNum<1||pageNum>d.getPageCount())throw Error('Signature page is outside this document.');let can=$('signature-canvas'),png=await d.embedPng(await (await canvasBlob(can,'image/png')).arrayBuffer());let p=d.getPage(pageNum-1);p.drawImage(png,{x:+value('signature-x','55'),y:+value('signature-y','75'),width:180,height:52});return {bytes:await d.save(),filename:`${basename(files[0])}-signed.pdf`,description:'Signature was placed as an image. This is not a cryptographic digital signature.'}}
// Text replacements are rendered into a fresh image of just the changed page.
// This does not claim the original PDF's font files are reusable or that PDF text
// objects can be edited natively. Other pages remain vector PDFs.
let selectedText=null, editorTextItems=[];
const editMode=()=>value('edit-mode','replace');
const editorNote=(message)=>{const el=$('editor-note');if(el)el.textContent=message;};
function guessFontFamily(style={}) {
 const name=String(style.fontFamily||'').toLowerCase();
 if(/times|serif|georgia|roman/.test(name)&&!/sans/.test(name))return 'Times New Roman';
 if(/courier|mono|consolas/.test(name))return 'Courier New';
 return 'Arial';
}
async function initEditor(){
 editorPDF=await readPdf(files[0]);editorMarks=[];editorRedo=[];editorPage=1;selectedText=null;
 extra.innerHTML=`<h3>Document preview</h3><p class="muted-small">Choose Replace existing text, then click a highlighted line. For other tools, drag on the page.</p>
 <div class="reader-toolbar"><button type="button" id="edit-prev" aria-label="Previous page">← Previous</button>
 <span>Page <span id="edit-page-num">1</span> / ${editorPDF.numPages}</span>
 <button type="button" id="edit-next" aria-label="Next page">Next →</button>
 <button type="button" id="edit-undo">Undo</button><button type="button" id="edit-redo">Redo</button></div>
 <div class="preview-panel"><div class="editor-holder" id="editor-holder"></div></div>
 <p class="muted-small" id="editor-note" role="status" aria-live="polite">Select a line of text to start editing.</p>`;
 $('edit-prev').onclick=()=>{if(editorPage>1){editorPage--;void drawEditorPage()}};
 $('edit-next').onclick=()=>{if(editorPage<editorPDF.numPages){editorPage++;void drawEditorPage()}};
 $('edit-undo').onclick=()=>{for(let i=editorMarks.length-1;i>=0;i--){if(editorMarks[i].page===editorPage){editorRedo.push(editorMarks.splice(i,1)[0]);break}}repaintEditor();editorNote('Last change undone.')};
 $('edit-redo').onclick=()=>{for(let i=editorRedo.length-1;i>=0;i--){if(editorRedo[i].page===editorPage){editorMarks.push(editorRedo.splice(i,1)[0]);break}}repaintEditor();editorNote('Change restored.')};
 $('edit-page')?.addEventListener('change',()=>{let page=+value('edit-page');if(page>=1&&page<=editorPDF.numPages){editorPage=page;void drawEditorPage()}});
 const toggleEditFields=()=>{
  const replacement=$('replace-fields');if(replacement)replacement.hidden=editMode()!=='replace';
  const imageField=$('edit-overlay-fields');if(imageField)imageField.hidden=editMode()!=='image';
  const textField=$('edit-text')?.closest('.field');if(textField)textField.hidden=editMode()!=='text';
};
 $('edit-mode')?.addEventListener('change',()=>{selectedText=null;updateTextHitboxes();toggleEditFields();editorNote(editMode()==='replace'?'Click existing text on the preview to select it.':'Drag on the document preview to place an annotation.')});toggleEditFields();
 $('apply-replacement')?.addEventListener('click',()=>{
  if(!selectedText){notify('Select a text line in the document preview first.','error');return}
  const text=$('edit-replacement').value;
  const fontSize=Number($('edit-size').value);
  if(!Number.isFinite(fontSize)||fontSize<3||fontSize>180){notify('Font size must be between 3 and 180 points.','error');return}
  const mark={page:editorPage,mode:'replace',...selectedText,text,fontSize,
    fontFamily:value('edit-font','Arial'),color:value('edit-color','#222222'),background:value('edit-background','#ffffff')};
  // Changing the same text again replaces the previous replacement in Undo history.
  editorMarks.push(mark);editorRedo=[];repaintEditor();
  editorNote(text?'Replacement preview updated. Choose Create output to save.':'Selected text masked. Choose Create output to save.');
  notify('Text change added to preview.','success');
 });
 await drawEditorPage();
}
async function drawEditorPage(){
 const currentPage=editorPage;const viewer=await editorPDF.getPage(currentPage);
 const scale=1.3,viewport=viewer.getViewport({scale});
 const back=await render(editorPDF,currentPage,scale);
 const holder=$('editor-holder');if(!holder||currentPage!==editorPage)return;
 holder.replaceChildren();back.className='editor-back';holder.append(back);holder.style.width=`${back.width}px`;
 const overlay=document.createElement('canvas');overlay.id='annotation-layer';overlay.className='editor-canvas';overlay.width=back.width;overlay.height=back.height;holder.append(overlay);
 const hits=document.createElement('div');hits.id='editor-hitboxes';hits.className='editor-hitboxes';holder.append(hits);
 $('edit-page-num').textContent=editorPage;if($('edit-page'))$('edit-page').value=editorPage;
 selectedText=null;
 // PDF.js supplies baseline positions and font metrics for selectable text runs.
 const content=await viewer.getTextContent();editorTextItems=[];
 const lib=await loadLib('viewer');
 for(const item of content.items){
  if(!item.str?.trim()||!item.transform||!item.width)continue;
  const t=lib.Util.transform(viewport.transform,item.transform);
  const fontPx=Math.hypot(t[2],t[3]);
  if(fontPx<3||!Number.isFinite(fontPx))continue;
  const style=content.styles[item.fontName]||{},ascent=Number.isFinite(style.ascent)?style.ascent:.85;
  const x=t[4],baseline=t[5],top=baseline-fontPx*ascent;
  const width=Math.max(5,item.width*scale),height=Math.max(8,fontPx*1.16);
  // Rotated text and vertical scripts cannot be matched safely by this editor.
  if(Math.abs(t[1])>0.25||Math.abs(t[2])>0.25)continue;
  const rect={page:currentPage,x:x/back.width,y:(top-2)/back.height,
   w:Math.min(1,width/back.width),h:height/back.height,
   baseline:(baseline/back.height),original:item.str,originalFont:guessFontFamily(style),
   detectedSize:Math.max(3,Math.round(fontPx/scale*10)/10),previewWidth:back.width,previewScale:scale};
  editorTextItems.push(rect);
  const hit=document.createElement('button');hit.type='button';hit.className='editor-text-hit';
  hit.style.left=(rect.x*100)+'%';hit.style.top=(rect.y*100)+'%';hit.style.width=(rect.w*100)+'%';hit.style.height=(rect.h*100)+'%';
  hit.title='Edit: '+item.str.slice(0,90);hit.setAttribute('aria-label','Edit text '+item.str.slice(0,90));
  hit.addEventListener('click',event=>{event.stopPropagation();selectedText=rect;
   $('edit-original').value=rect.original;$('edit-replacement').value=rect.original;
   $('edit-size').value=rect.detectedSize;$('edit-font').value=rect.originalFont;
   const sampled=sampleEditorColors(back,rect);$('edit-color').value=sampled.ink;$('edit-background').value=sampled.paper;
   updateTextHitboxes(hit);editorNote('Edit this line in the fields, then select Apply text change.');
  });hits.append(hit);
 }
 updateTextHitboxes();repaintEditor();
 if(!editorTextItems.length){editorNote('No editable text runs were detected on this page. Image-only scans cannot be edited as text; you can still add annotations.');}
 else editorNote(`${editorTextItems.length} selectable text segment(s) found. Click the text to edit it.`);
 let start=null,points=[];
 const coords=e=>{const rect=overlay.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))}};
 overlay.addEventListener('pointerdown',e=>{if(editMode()==='replace')return;start=coords(e);points=[start];overlay.setPointerCapture(e.pointerId)});
 overlay.addEventListener('pointermove',e=>{if(!start||editMode()!=='draw')return;points.push(coords(e));repaintEditor({page:editorPage,mode:'draw',points})});
 overlay.addEventListener('pointerup',async e=>{
  if(!start)return;const end=coords(e),mode=editMode();
  if(mode==='replace'){start=null;return}
  if(mode==='text'&&!value('edit-text').trim()){notify('Enter text to add.','error');start=null;return}
  const mark={page:editorPage,mode,x:start.x,y:start.y,w:end.x-start.x,h:end.y-start.y,text:value('edit-text')};
  if(mode==='draw'){points.push(end);mark.points=points.slice()}
  if(mode==='image'){let f=$('edit-image')?.files[0];if(!f||!['image/png','image/jpeg'].includes(f.type)){notify('Choose a PNG or JPG image first.','error');start=null;return}try{mark.img=await createImageBitmap(f)}catch{notify('Could not decode the image.','error');start=null;return}}
  if(!['text','draw'].includes(mode)&&(Math.abs(mark.w)<.008||Math.abs(mark.h)<.008)){mark.w=.24;mark.h=.12}
  editorMarks.push(mark);editorRedo=[];start=null;points=[];repaintEditor();
 });
}
function sampleEditorColors(canvas,rect){
 try{
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const x=Math.max(0,Math.floor(rect.x*canvas.width)),y=Math.max(0,Math.floor(rect.y*canvas.height));
  const w=Math.min(canvas.width-x,Math.ceil(rect.w*canvas.width)),h=Math.min(canvas.height-y,Math.ceil(rect.h*canvas.height));
  if(w<2||h<2)return {ink:'#222222',paper:'#ffffff'};
  const pixels=ctx.getImageData(x,y,w,h).data;
  let darkest=[255,255,255],minimum=999,lightest=[255,255,255],maximum=-1;
  for(let i=0;i<pixels.length;i+=Math.max(4,Math.floor(pixels.length/2500/4)*4)){
   const red=pixels[i],green=pixels[i+1],blue=pixels[i+2];
   const luminance=.2126*red+.7152*green+.0722*blue;
   if(luminance<minimum){minimum=luminance;darkest=[red,green,blue]}
   if(luminance>maximum){maximum=luminance;lightest=[red,green,blue]}
  }
  const hex=rgb=>'#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  return {ink:minimum<190?hex(darkest):'#222222',paper:maximum>150?hex(lightest):'#ffffff'};
 }catch{return {ink:'#222222',paper:'#ffffff'}}
}
function updateTextHitboxes(selected=null){
 const hits=$('editor-hitboxes');if(!hits)return;
 hits.classList.toggle('is-active',editMode()==='replace');
 hits.querySelectorAll('.editor-text-hit').forEach(x=>x.classList.toggle('is-selected',x===selected));
}
function markPaint(canvas,marks){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
 for(const m of marks){const x=m.x*w,y=m.y*h;
  if(m.mode==='replace'){
   const width=m.w*w,height=m.h*h;
   ctx.fillStyle=m.background||'#fff';ctx.fillRect(x-2,y-2,width+4,height+5);
   if(m.text){// PDF points to displayed pixels (preview has a 1.3× viewport).
    const pointScale=w/(m.previewWidth||w);
    const fontSizePx=m.fontSize*pointScale*(m.previewScale||1.3);
    ctx.fillStyle=m.color||'#222';ctx.textBaseline='alphabetic';
    ctx.font=`${fontSizePx}px "${m.fontFamily||'Arial'}"`;
    const desiredWidth=ctx.measureText(m.text).width;
    if(desiredWidth>width+12){ctx.save();ctx.translate(x,m.baseline*h);ctx.scale((width+12)/desiredWidth,1);ctx.fillText(m.text,0,0);ctx.restore()}
    else ctx.fillText(m.text,x,m.baseline*h);
   }
  }
  else if(m.mode==='text'){ctx.fillStyle='#6e4e33';ctx.font=`bold ${Math.max(12,17*w/700)}px Arial,sans-serif`;ctx.fillText(m.text,x,y)}
  else if(m.mode==='draw'){ctx.beginPath();ctx.strokeStyle='#72533d';ctx.lineWidth=Math.max(2,w/380);ctx.lineCap='round';(m.points||[]).forEach((pt,i)=>i?ctx.lineTo(pt.x*w,pt.y*h):ctx.moveTo(pt.x*w,pt.y*h));ctx.stroke()}
  else if(m.mode==='image'&&m.img){ctx.drawImage(m.img,x,y,Math.max(12,Math.abs(m.w*w)),Math.max(12,Math.abs(m.h*h)))}
  else if(m.mode==='underline'||m.mode==='strike'){ctx.strokeStyle='#795d43';ctx.lineWidth=Math.max(2,w/350);ctx.beginPath();const lineY=m.mode==='underline'?y+m.h*h:y+(m.h*h)/2;ctx.moveTo(x,lineY);ctx.lineTo(x+m.w*w,lineY);ctx.stroke()}
  else{ctx.fillStyle=m.mode==='highlight'?'rgba(225,181,74,.32)':'rgba(115,83,55,.06)';ctx.strokeStyle=m.mode==='highlight'?'rgba(173,126,40,.44)':'#72533d';ctx.lineWidth=2;ctx.fillRect(x,y,m.w*w,m.h*h);ctx.strokeRect(x,y,m.w*w,m.h*h)}
 }
}
function repaintEditor(temp=null){const can=$('annotation-layer');if(can)markPaint(can,[...editorMarks.filter(m=>m.page===editorPage),...(temp?[temp]:[])])}
async function exportEdited(){
 if(!editorMarks.length)throw Error('Select text to replace or add an annotation before exporting.');
 const original=await loadPdf(files[0]),lib=await loadLib('pdf');
 const toRasterize=new Set(editorMarks.filter(m=>m.mode==='replace').map(m=>m.page));
 if(!toRasterize.size){
  for(const pageNum of [...new Set(editorMarks.map(x=>x.page))]){
   const viewport=(await editorPDF.getPage(pageNum)).getViewport({scale:1.3});
   const c=document.createElement('canvas');c.width=Math.round(viewport.width);c.height=Math.round(viewport.height);
   markPaint(c,editorMarks.filter(x=>x.page===pageNum));
   const png=await original.embedPng(await (await canvasBlob(c,'image/png')).arrayBuffer());
   const p=original.getPage(pageNum-1);p.drawImage(png,{x:0,y:0,width:p.getWidth(),height:p.getHeight()});c.width=c.height=0;
  }
  return {bytes:await original.save(),filename:`${basename(files[0])}-edited.pdf`,mime:'application/pdf',description:`${editorMarks.length} annotation(s) added; existing page content remains.`};
 }
 // Rasterize only changed-text pages. The unchanged PDF pages remain untouched.
 const output=await lib.PDFDocument.create();
 for(let i=0;i<original.getPageCount();i++){
  const n=i+1,page=original.getPage(i);
  if(!toRasterize.has(n)){
   const [copied]=await output.copyPages(original,[i]);output.addPage(copied);continue;
  }
  const viewerPage=await editorPDF.getPage(n),v=viewerPage.getViewport({scale:2});
  const canvas=await render(editorPDF,n,2);
  // Add the flattened correction to the visible page image, not on top of live PDF text.
  const annotation=document.createElement('canvas');annotation.width=canvas.width;annotation.height=canvas.height;
  markPaint(annotation,editorMarks.filter(m=>m.page===n));
  canvas.getContext('2d').drawImage(annotation,0,0);annotation.width=annotation.height=0;
  const png=await output.embedPng(await (await canvasBlob(canvas,'image/png')).arrayBuffer());
  const outPage=output.addPage([page.getWidth(),page.getHeight()]);
  outPage.drawImage(png,{x:0,y:0,width:outPage.getWidth(),height:outPage.getHeight()});
  canvas.width=canvas.height=0;
 }
 return {bytes:await output.save(),filename:`${basename(files[0])}-edited.pdf`,mime:'application/pdf',description:`${toRasterize.size} page(s) updated. Text replacements are visually positioned and pages with replaced text are flattened; exact embedded font matching and selectable text on those pages cannot be guaranteed.`};
}
async function initReader(){readerPDF=await readPdf(files[0]);readerPage=1;readerZoom=1;extra.innerHTML='<h3>Document reader</h3><div class="reader-toolbar"><button id="reader-prev" aria-label="Previous page">←</button><input id="reader-page" type="number" min="1" value="1" aria-label="Current page"><span>/ '+readerPDF.numPages+'</span><button id="reader-next" aria-label="Next page">→</button><button id="reader-zoom-out">−</button><button id="reader-zoom-in">+</button><button id="reader-open">Open / Print</button></div><div id="reader-preview" class="preview-panel"></div>';const draw=async()=>{const can=await render(readerPDF,readerPage,Math.min(2.4,Math.max(.35,readerZoom)));$('reader-preview').replaceChildren(can);$('reader-page').value=readerPage};$('reader-prev').onclick=()=>{readerPage=Math.max(1,readerPage-1);void draw()};$('reader-next').onclick=()=>{readerPage=Math.min(readerPDF.numPages,readerPage+1);void draw()};$('reader-page').onchange=()=>{readerPage=Math.min(readerPDF.numPages,Math.max(1,+$('reader-page').value||1));void draw()};$('reader-zoom-in').onclick=()=>{readerZoom=Math.min(2.4,readerZoom+.2);void draw()};$('reader-zoom-out').onclick=()=>{readerZoom=Math.max(.35,readerZoom-.2);void draw()};$('reader-open').onclick=()=>{const blob=new Blob([files[0]],{type:'application/pdf'}),o=URL.createObjectURL(blob);window.open(o,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(o),60000)};await draw();setStatus(`Reader loaded ${readerPDF.numPages} pages.`)}
async function initFields(){let container=$('form-fields');if(!container)return;const d=await loadPdf(files[0]),fields=d.getForm().getFields();if(!fields.length){container.textContent='No supported interactive form fields were found.';return}container.innerHTML=fields.map((f,i)=>{const label=esc(f.getName());if(typeof f.getText==='function')return `<div class="field"><label for="form-input-${i}">${label}</label><input id="form-input-${i}" type="text" value="${esc(f.getText()||'')}"></div>`;if(typeof f.isChecked==='function')return `<label class="check-row"><input type="checkbox" id="form-input-${i}" ${f.isChecked()?'checked':''}>${label}</label>`;if(typeof f.getOptions==='function')return `<div class="field"><label for="form-input-${i}">${label}</label><select id="form-input-${i}"><option value="">— Select —</option>${f.getOptions().map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>`;return `<div class="muted-small">${label} — unsupported field type</div>`}).join('')}
