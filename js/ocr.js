import {loadLib,readPdf,render} from './core.js?v=9';
const root=document.documentElement.dataset.base||'.';
const asset=p=>new URL(`${root}/${p}`,document.baseURI).href;
const isImage=f=>/\.(png|jpe?g)$/i.test(f.name);
async function loadOCRWorker(lang){
 const Tesseract=await loadLib('ocr');
 let local=false;
 try{const response=await fetch(asset('vendor/tesseract-worker.min.js'),{method:'HEAD',cache:'force-cache'});local=response.ok}catch{}
 const config=local?{workerPath:asset('vendor/tesseract-worker.min.js'),corePath:asset('vendor'),langPath:asset('vendor/tessdata'),gzip:true}:{};
 try{return await Tesseract.createWorker(lang,1,config)}catch(e){if(local&&navigator.onLine){return await Tesseract.createWorker(lang,1)}throw new Error(`OCR engine could not start: ${e.message||e}. Install the offline OCR files or connect once to download them.`)}
}
export async function runOCR(file,language='eng',update=()=>{}){
 if(!['eng','nep'].includes(language))throw Error('Choose English or Nepali OCR.');
 const worker=await loadOCRWorker(language);const pages=[];
 try{
  if(isImage(file)){const result=await worker.recognize(file);pages.push(result.data.text||'');update(1,1)}
  else if(/\.pdf$/i.test(file.name)){
   const pdf=await readPdf(file);try{if(pdf.numPages>120)throw Error('Please OCR fewer than 120 pages per batch to avoid device-memory problems.');for(let page=1;page<=pdf.numPages;page++){
    const canvas=await render(pdf,page,1.7);try{const result=await worker.recognize(canvas);pages.push(`--- Page ${page} ---\n${result.data.text||''}`)}finally{canvas.width=canvas.height=0}update(page,pdf.numPages)
   }}finally{await pdf.destroy()}
  }else throw Error('Choose a PDF, JPG or PNG file.');
  return pages.join('\n\n');
 }finally{await worker.terminate()}
}
