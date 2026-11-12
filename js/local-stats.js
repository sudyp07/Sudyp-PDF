/** Anonymous local-only counters. Never save file contents, names, passwords or extracted text. */
const KEY='sudyp_local_stats_v2';
export function getLocalStats(){try{const s=JSON.parse(localStorage.getItem(KEY));return {jobs:Math.max(0,Number(s?.jobs)||0),files:Math.max(0,Number(s?.files)||0)}}catch{return {jobs:0,files:0}}}
export function recordLocalJob(fileCount=1){const s=getLocalStats();s.jobs+=1;s.files+=Math.max(1,Number(fileCount)||1);try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}document.dispatchEvent(new CustomEvent('sudyp:local-job',{detail:s}));return s}
