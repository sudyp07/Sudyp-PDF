import {processFiles,makeZip} from './processors.js?v=9';
import {blobDownload,sizeLabel} from './core.js?v=9';
import {recordLocalJob,getLocalStats} from './local-stats.js?v=9';
import {locale} from './features.js?v=9';
const $=id=>document.getElementById(id);
if($('hero-run')){
 let files=[],operation='merge',result=null,busy=false,manualChoice=false;
 const status=message=>{$('hero-status').textContent=message};
 const progress=(value=null)=>{const bar=$('hero-progress'),fill=$('hero-progress-fill');bar.classList.add('is-visible');bar.classList.toggle('indeterminate',value===null);if(value!==null){fill.style.width=`${Math.min(100,Math.max(0,value))}%`;bar.setAttribute('aria-valuenow',String(Math.floor(value)))}else{fill.style.width='';bar.removeAttribute('aria-valuenow')}};
 const resetProgress=()=>{$('hero-progress').classList.remove('is-visible','indeterminate');$('hero-progress-fill').style.width='0'};
 const render=()=>{const holder=$('hero-upload-list');holder.replaceChildren();files.forEach((file,i)=>{const row=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=file.name;strong.title=file.name;small.textContent=sizeLabel(file.size);const remove=document.createElement('button');remove.type='button';remove.className='nav-mini';remove.textContent='×';remove.title='Remove file';remove.setAttribute('aria-label',`Remove ${file.name}`);remove.onclick=()=>{if(busy)return;files.splice(i,1);result=null;$('hero-result').classList.remove('is-visible');render()};row.append(strong,small,remove);holder.append(row)});if(files.length&&!result)status(`${files.length} PDF${files.length===1?'':'s'} selected · ${sizeLabel(files.reduce((n,f)=>n+f.size,0))}`);
  document.querySelectorAll('[data-quick]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.quick===operation)));
  $('pipeline-label').hidden=operation!=='merge';$('hero-run').textContent=locale()==='ne'?{merge:'PDF जोड्नुहोस् →',split:'पृष्ठ छुट्याउनुहोस् →',compress:'PDF सानो बनाउनुहोस् →'}[operation]:{merge:'Merge PDFs →',split:'Split PDF pages →',compress:'Compress PDFs →'}[operation];$('hero-run').disabled=busy;
 };
 function receive(incoming){if(busy)return;let added=0;for(const f of Array.from(incoming||[])){if(!/\.pdf$/i.test(f.name)||!f.size||f.size>200*1024*1024){status(`${f.name}: select a non-empty PDF under 200 MB.`);continue}files.push(f);added++}if(!added)return;if(!manualChoice)operation=files.length>1?'merge':'compress';result=null;$('hero-result').classList.remove('is-visible');if(files.length>1&&operation==='split')status('Each PDF will be split separately into a ZIP.');render()}
 window.SudypUpload?.onFiles(receive);
 document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{if(busy)return;operation=b.dataset.quick;manualChoice=true;result=null;$('hero-result').classList.remove('is-visible');render()}));
 function outputShape(r){const n=r.bytes instanceof Blob?r.bytes.size:r.bytes?.byteLength??(typeof r.bytes==='string'?new Blob([r.bytes]).size:0);return {...r,size:n}}
 $('hero-run').addEventListener('click',async()=>{
  if(busy)return;if(!files.length){status('Choose or drop one or more PDFs to begin.');$('file-input').focus();return}if(operation==='merge'&&files.length<2){status('Merge needs at least two PDFs. Choose another PDF or select Compress / Split.');return}
  busy=true;result=null;const output=$('hero-result');output.classList.remove('is-visible');render();progress();
  try{let done;if(operation==='merge'){
    status('Merging files in your browser…');done=await processFiles('merge',files,(n,total)=>{status(`Merging document ${n} of ${total}`);progress(n/total*100)});
    if($('pipeline-check').checked){status('Compressing merged document…');progress();const interim=new File([done.bytes],done.filename||'merged-document.pdf',{type:'application/pdf'});done=await processFiles('compress',[interim],(n,total)=>{progress(n/total*100);status(`Compressing page ${n} of ${total}`)});done.filename='merged-compressed.pdf';}
  }else if(files.length===1){status(`${operation==='split'?'Splitting':'Compressing'} your document…`);done=await processFiles(operation,files,(n,total)=>{progress(n/total*100);status(`${n} of ${total} pages processed`)})}
  else{const results=[];for(let i=0;i<files.length;i++){status(`${operation}: document ${i+1} of ${files.length}`);const r=await processFiles(operation,[files[i]]);results.push({name:r.filename,data:r.bytes});progress(((i+1)/files.length)*100)}done={bytes:await makeZip(results),filename:`${operation}-batch-results.zip`,mime:'application/zip',description:`${results.length} documents processed.`}}
  result=outputShape(done);recordLocalJob(files.length);const original=files.reduce((n,f)=>n+f.size,0);
  output.replaceChildren();const heading=document.createElement('strong');heading.textContent='Your file is ready';output.append(heading);
  const info=document.createElement('p');info.style.margin='7px 0';info.textContent=operation==='compress'||$('pipeline-check').checked&&operation==='merge'?`${sizeLabel(original)} → ${sizeLabel(result.size)} (${result.size<original?`${Math.round((1-result.size/original)*100)}% smaller`:'not smaller'})`:`${result.filename} · ${sizeLabel(result.size)}`;output.append(info);
  const button=document.createElement('button');button.className='button button-primary';button.textContent='↓ Download result';button.onclick=()=>void blobDownload(result.bytes,result.filename,result.mime||'application/pdf');output.append(button);output.classList.add('is-visible');status('Finished. Your document stayed on your device.');progress(100);
 }catch(error){status(error?.message||'Could not process the selected file.');resetProgress();console.error('PDF processing failed:',error)}finally{busy=false;render()}
 });
 const renderStats=()=>{$('processed-count').textContent=`${getLocalStats().files} files processed locally`};renderStats();document.addEventListener('sudyp:local-job',renderStats);
 async function readyStatus(){const indicator=$('offline-indicator');if(!('caches' in window)||!('serviceWorker' in navigator)){indicator.textContent='Offline support depends on browser';return}try{const pdf=await caches.match(new Request(new URL('./vendor/pdf-lib.min.js',location.href)));const viewer=await caches.match(new Request(new URL('./vendor/pdf.min.js',location.href)));indicator.textContent=pdf&&viewer?'Offline PDF engines ready':'Offline install: see Help';}catch{indicator.textContent='Offline install: see Help'}}readyStatus();
}
