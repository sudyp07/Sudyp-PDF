import {mountShell,tools,students,categories,renderCards,toolCard,icon,esc,url,getSetting} from './ui.js';
mountShell();
const $=id=>document.getElementById(id);
const matchesTask=(t,q)=>{const stop=new Set(['pdf','a','the','an','to','and','of','my','file','files','document','documents','please','convert','make','create','tool','for','i','want','need']);const words=q.trim().toLowerCase().split(/[^a-z0-9]+/).filter(w=>w&&!stop.has(w));const haystack=[t.title,t.description,t.category,t.slug].join(' ').toLowerCase();return !words.length||words.every(w=>haystack.includes(w))};
if($('popular-grid')){
  const popular=['merge','split','compress','pdf-to-word','jpg-to-pdf','organize','sign-pdf','pdf-to-jpg'];
  renderCards(popular.map(x=>tools.find(t=>t.slug===x)).filter(Boolean),$('popular-grid'));
  const feature=['assignment-maker','research-formatter','notes-to-pdf','image-notes'];
  $('student-grid').innerHTML=feature.map(x=>students.find(t=>t.slug===x)).map(t=>`<a class="student-mini" href="${url(t.path)}"><span>${icon(t.icon,23)}</span><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p></a>`).join('');
  let input=$('home-search'),box=$('home-results');const filter=()=>{let q=input.value.trim().toLowerCase();box.hidden=!q;if(q){box.innerHTML=`<div class="tool-grid">${tools.filter(t=>matchesTask(t,q)).slice(0,8).map(toolCard).join('')||'<p>No matches found.</p>'}</div>`}};
  input.addEventListener('input',filter);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const q=input.value.trim();location.href=url(`tools.html${q?'?q='+encodeURIComponent(q):''}`)}});
}
if($('directory-grid')){
let current='All tools',q=new URLSearchParams(location.search).get('q')||'';
const input=$('directory-search');input.value=q;
const filters=$('category-filters');filters.innerHTML=categories.map(c=>`<button type="button" data-category="${esc(c)}" class="${c===current?'active':''}">${esc(c)} <small>${c==='All tools'?tools.length:tools.filter(t=>t.category===c).length}</small></button>`).join('')+`<button type="button" data-category="Favorites">Favorites ${icon('star',14)}</button>`;
const refresh=()=>{const list=tools.filter(t=>(current==='All tools'||current==='Favorites'||t.category===current)&&matchesTask(t,input.value));const set=current==='Favorites'?list.filter(x=>getSetting('favorites',[]).includes(x.slug)):list;renderCards(set,$('directory-grid'));$('directory-count').textContent=`${set.length} available tools`};filters.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;current=b.dataset.category;filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));refresh()});input.addEventListener('input',refresh);refresh();
}
if($('student-directory')){renderCards(students,$('student-directory'))}
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){const input=$('directory-search')||$('home-search');if(input){e.preventDefault();input.focus();input.select()}}});

