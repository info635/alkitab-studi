/* ─────────────────────────────────────────
   ALKITAB STUDI — MAIN APP JS v2
   NIV + TB Parallel | Full Bible Auto-Load
   ───────────────────────────────────────── */
'use strict';

const BOOKS = {
  ot:[{n:'Kejadian',a:'Kej',ch:50},{n:'Keluaran',a:'Kel',ch:40},{n:'Imamat',a:'Im',ch:27},{n:'Bilangan',a:'Bil',ch:36},{n:'Ulangan',a:'Ul',ch:34},{n:'Yosua',a:'Yos',ch:24},{n:'Hakim-hakim',a:'Hak',ch:21},{n:'Rut',a:'Rut',ch:4},{n:'1 Samuel',a:'1Sam',ch:31},{n:'2 Samuel',a:'2Sam',ch:24},{n:'1 Raja-raja',a:'1Raj',ch:22},{n:'2 Raja-raja',a:'2Raj',ch:25},{n:'Mazmur',a:'Mzm',ch:150},{n:'Amsal',a:'Ams',ch:31},{n:'Yesaya',a:'Yes',ch:66},{n:'Yeremia',a:'Yer',ch:52},{n:'Daniel',a:'Dan',ch:12}],
  nt:[{n:'Matius',a:'Mat',ch:28},{n:'Markus',a:'Mrk',ch:16},{n:'Lukas',a:'Luk',ch:24},{n:'Yohanes',a:'Yoh',ch:21},{n:'Kisah Para Rasul',a:'Kis',ch:28},{n:'Roma',a:'Rom',ch:16},{n:'1 Korintus',a:'1Kor',ch:16},{n:'2 Korintus',a:'2Kor',ch:13},{n:'Galatia',a:'Gal',ch:6},{n:'Efesus',a:'Ef',ch:6},{n:'Filipi',a:'Flp',ch:4},{n:'Kolose',a:'Kol',ch:4},{n:'1 Tesalonika',a:'1Tes',ch:5},{n:'1 Timotius',a:'1Tim',ch:6},{n:'Ibrani',a:'Ibr',ch:13},{n:'Yakobus',a:'Yak',ch:5},{n:'1 Petrus',a:'1Pet',ch:5},{n:'Wahyu',a:'Why',ch:22}]
};

const BOOK_EN={'Matius':'Matthew','Markus':'Mark','Lukas':'Luke','Yohanes':'John','Kisah Para Rasul':'Acts','Roma':'Romans','1 Korintus':'1 Corinthians','2 Korintus':'2 Corinthians','Galatia':'Galatians','Efesus':'Ephesians','Filipi':'Philippians','Kolose':'Colossians','1 Tesalonika':'1 Thessalonians','1 Timotius':'1 Timothy','Ibrani':'Hebrews','Yakobus':'James','1 Petrus':'1 Peter','Wahyu':'Revelation','Kejadian':'Genesis','Keluaran':'Exodus','Mazmur':'Psalms','Amsal':'Proverbs','Yesaya':'Isaiah','Yeremia':'Jeremiah','Daniel':'Daniel'};

const BOOK_META={'Matius:5':'Sermon on the Mount — Beatitudes / Khotbah di Bukit','Matius:6':'Lord\'s Prayer / Doa Bapa Kami','Matius:28':'Great Commission / Amanat Agung','Yohanes:1':'The Word Became Flesh / Firman Menjadi Manusia','Yohanes:3':'Born Again — Nicodemus / Lahir Baru','Yohanes:10':'The Good Shepherd / Gembala yang Baik','Yohanes:14':'The Way, Truth, Life / Jalan, Kebenaran, Hidup','Roma:1':'Power of the Gospel / Kekuatan Injil','Roma:3':'Justified by Faith / Pembenaran oleh Iman','Roma:5':'Peace with God / Damai dengan Allah','Roma:8':'Life in the Spirit — Predestination / Hidup dalam Roh','Efesus:1':'Spiritual Blessings / Berkat Rohani','Efesus:2':'Saved by Grace / Diselamatkan oleh Anugerah','Efesus:6':'Armor of God / Perlengkapan Senjata Allah','Filipi:2':'Humility of Christ / Kerendahan Hati Kristus','Filipi:4':'Peace of God / Damai Sejahtera Allah','Kejadian:1':'Creation / Penciptaan'};

const S={book:'Matius',ch:5,v:3,testament:'nt',commOn:{mh:true,jfb:true,jg:true},view:'commentary',fontSize:17,redLetters:true,parallel:true,tbData:{},nivData:{},commData:{mh:{},jfb:{},jg:{}},notes:{},highlights:{},loading:false};

async function init(){
  renderBookGrid('nt');
  loadPrefs();
  setupOffline();
  await loadAllData();
  injectParallelToggle();
  loadPassage();
  setupKeys();
  if('serviceWorker'in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  checkInstall();
}

function injectParallelToggle(){
  const tbar=document.querySelector('.tbar');
  if(!tbar)return;
  const d=document.createElement('div');
  d.className='tbar-group';d.style.marginLeft='auto';
  d.innerHTML=`<span class="tbar-label">View:</span>
    <button class="tb${S.parallel?' active':''}" id="btn-par" onclick="setPar(true)">NIV + TB</button>
    <button class="tb${!S.parallel?' active':''}" id="btn-sin" onclick="setPar(false)">TB Only</button>`;
  tbar.appendChild(d);
}
function setPar(v){
  S.parallel=v;
  document.getElementById('btn-par').classList.toggle('active',v);
  document.getElementById('btn-sin').classList.toggle('active',!v);
  renderChapter();savePrefs();
}

async function loadAllData(){
  const bFiles=[{f:'matius',b:'Matius'},{f:'yohanes',b:'Yohanes'},{f:'roma',b:'Roma'},{f:'efesus',b:'Efesus'},{f:'filipi',b:'Filipi'}];
  for(const x of bFiles){try{const r=await fetch(`data/bible/${x.f}.json`);if(r.ok){const d=await r.json();S.tbData[d.book]=d.chapters;}}catch(e){}}
  try{const r=await fetch('data/bible/niv.json');if(r.ok){const d=await r.json();for(const[b,chs]of Object.entries(d.books)){S.nivData[b]={};for(const[c,vs]of Object.entries(chs))S.nivData[b][c]=vs;}}}catch(e){}
  const cFiles=[{id:'mh',f:'matthew-henry'},{id:'jfb',f:'jfb'},{id:'jg',f:'john-gill'}];
  for(const c of cFiles){try{const r=await fetch(`data/commentary/${c.f}.json`);if(r.ok){const d=await r.json();S.commData[c.id]=d.entries||{};}}catch(e){}}
  setStatus('Ready',true);updateCacheInfo();
}

function loadPrefs(){
  const p=JSON.parse(localStorage.getItem('alkitab-prefs')||'{}');
  if(p.fontSize)S.fontSize=p.fontSize;
  if(p.redLetters!==undefined)S.redLetters=p.redLetters;
  if(p.commOn)S.commOn=p.commOn;
  if(p.book)S.book=p.book;
  if(p.ch)S.ch=p.ch;
  if(p.v)S.v=p.v;
  if(p.parallel!==undefined)S.parallel=p.parallel;
  S.notes=JSON.parse(localStorage.getItem('alkitab-notes')||'{}');
  S.highlights=JSON.parse(localStorage.getItem('alkitab-highlights')||'{}');
  document.getElementById('sel-book').value=S.book;
  document.getElementById('sel-ch').value=S.ch;
  document.getElementById('sel-v').value=S.v;
  if(document.getElementById('red-letters'))document.getElementById('red-letters').checked=S.redLetters;
  for(const[id,on]of Object.entries(S.commOn)){const p=document.getElementById(`pill-${id}`);if(p){if(on)p.classList.add('active');else p.classList.remove('active');}}
}
function savePrefs(){localStorage.setItem('alkitab-prefs',JSON.stringify({fontSize:S.fontSize,redLetters:S.redLetters,commOn:S.commOn,book:S.book,ch:S.ch,v:S.v,parallel:S.parallel}));}

function renderBookGrid(t){
  S.testament=t;
  const books=BOOKS[t];
  const secs=t==='ot'?[['Torah / Taurat',5],['History / Sejarah',8],['Poetry / Puisi',3],['Prophets / Nubuat',4]]:[['Gospels / Injil',4],['History / Sejarah',1],["Paul's Letters / Surat Paulus",9],['General / Surat Umum',5]];
  let html='',idx=0;
  for(const[lbl,n]of secs){
    html+=`<div class="bk-section-label">${lbl}</div><div class="bk-row">`;
    for(let i=0;i<n&&idx<books.length;i++,idx++){const b=books[idx];const abbr=b.n.length>9?b.n.slice(0,7)+'…':b.n;html+=`<button class="bk-btn${b.n===S.book?' active':''}" title="${b.n}" onclick="selectBook('${b.n}')">${abbr}</button>`;}
    html+='</div>';
  }
  document.getElementById('sb-body').innerHTML=html;
}
function showTestament(t,btn){document.querySelectorAll('.t-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderBookGrid(t);}
function selectBook(book){S.book=book;document.getElementById('sel-book').value=book;showChGrid(book);}
function showChGrid(book){
  const all=[...BOOKS.ot,...BOOKS.nt];const m=all.find(b=>b.n===book);const total=m?m.ch:50;
  let html=`<div class="bk-section-label">${book} — Chapters</div><div class="ch-grid">`;
  for(let i=1;i<=total;i++)html+=`<button class="ch-btn${i===S.ch?' active':''}" onclick="selectChapter(${i})">${i}</button>`;
  html+='</div>';document.getElementById('sb-body').innerHTML=html;
}
function selectChapter(ch){S.ch=ch;S.v=1;document.getElementById('sel-ch').value=ch;document.getElementById('sel-v').value=1;loadPassage();}
function onBookSelectChange(){S.book=document.getElementById('sel-book').value;showChGrid(S.book);}
function navigate(){S.book=document.getElementById('sel-book').value;S.ch=parseInt(document.getElementById('sel-ch').value)||1;S.v=parseInt(document.getElementById('sel-v').value)||1;loadPassage();}

async function loadPassage(){
  if(S.loading)return;
  const key=`${S.book}:${S.ch}`;
  document.getElementById('bp-title').textContent=`${S.book} ${S.ch}`;
  document.getElementById('bp-meta').textContent=BOOK_META[key]||'';
  document.getElementById('notes-ref-label').textContent=`${S.book} ${S.ch}`;
  document.getElementById('ask-ctx').textContent=`${S.book} ${S.ch}:${S.v}`;
  document.getElementById('notes-area').value=S.notes[key]||'';
  savePrefs();
  const tbV=S.tbData[S.book]&&S.tbData[S.book][S.ch];
  if(tbV){renderChapter();selectVerse(S.v,false);}
  else await loadFromAI(S.book,S.ch);
}

function renderChapter(){
  const tbV=S.tbData[S.book]&&S.tbData[S.book][S.ch];
  const kjvV=S.nivData[S.book]&&S.nivData[S.book][S.ch];
  if(!tbV)return;
  if(S.parallel&&kjvV)renderParallel(tbV,kjvV);
  else renderSingle(tbV);
}

function renderParallel(tbV,kjvV){
  const bt=document.getElementById('bible-text');
  const hl=S.highlights[`${S.book}:${S.ch}`]||{};
  const kjvMap={};for(const v of kjvV)kjvMap[v.v]=v;
  let html=`<div class="parallel-header"><div class="ph-col">📖 NIV (English)</div><div class="ph-col">📖 TB (Bahasa Indonesia)</div></div>`;
  for(const v of tbV){
    const act=v.v===S.v?' active':'';const hlc=hl[v.v]?' highlighted':'';
    const kjv=kjvMap[v.v];
    const tbTxt=S.redLetters&&v.red?`<span class="red">${esc(v.t)}</span>`:esc(v.t);
    const kjvTxt=kjv?(S.redLetters&&kjv.red?`<span class="red">${esc(kjv.t)}</span>`:esc(kjv.t)):`<span style="color:var(--brown-l);font-style:italic">—</span>`;
    html+=`<div class="verse-parallel${act}${hlc}" id="vr-${v.v}" onclick="selectVerse(${v.v})">
      <div class="vp-num">${v.v}</div>
      <div class="vp-niv"><span class="vtext" style="font-size:${S.fontSize-1}px">${kjvTxt}</span></div>
      <div class="vp-tb"><span class="vtext" style="font-size:${S.fontSize-1}px">${tbTxt}</span></div>
      <div class="verse-btns">
        <button class="vbtn" title="Copy" onclick="event.stopPropagation();copyV(${v.v},'${escA(v.t)}')">📋</button>
        <button class="vbtn" title="Highlight" onclick="event.stopPropagation();hlV(${v.v})">🔖</button>
        <button class="vbtn" title="Notes" onclick="event.stopPropagation();noteV(${v.v},'${escA(v.t)}')">✏️</button>
      </div></div>`;
  }
  bt.innerHTML=html;
}

function renderSingle(verses){
  const bt=document.getElementById('bible-text');
  const hl=S.highlights[`${S.book}:${S.ch}`]||{};
  let html='';
  for(const v of verses){
    const act=v.v===S.v?' active':'';const hlc=hl[v.v]?' highlighted':'';
    const txt=S.redLetters&&v.red?`<span class="red">${esc(v.t)}</span>`:esc(v.t);
    html+=`<div class="verse${act}${hlc}" id="vr-${v.v}" onclick="selectVerse(${v.v})">
      <span class="vnum">${v.v}</span>
      <span class="vtext" style="font-size:${S.fontSize}px">${txt}</span>
      <div class="verse-btns">
        <button class="vbtn" onclick="event.stopPropagation();copyV(${v.v},'${escA(v.t)}')">📋</button>
        <button class="vbtn" onclick="event.stopPropagation();hlV(${v.v})">🔖</button>
        <button class="vbtn" onclick="event.stopPropagation();noteV(${v.v},'${escA(v.t)}')">✏️</button>
      </div></div>`;
  }
  bt.innerHTML=html;
}

async function loadFromAI(book,ch){
  S.loading=true;
  document.getElementById('bible-text').innerHTML=`<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Loading ${book} ${ch}…</div></div>`;
  setStatus(`Loading ${book} ${ch}…`,true);
  const en=BOOK_EN[book]||book;
  try{
    const [r1,r2]=await Promise.all([
      fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2000,system:'Provide complete Indonesian Bible text (Terjemahan Baru TB). Return ONLY a JSON array: [{"v":1,"t":"verse text","red":false}]. Set red:true for Jesus direct speech. All verses of the chapter. Raw JSON only.',messages:[{role:'user',content:`Complete ${book} chapter ${ch} in Indonesian TB. All verses. JSON array.`}]})}),
      fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2000,system:'Provide complete NIV (New International Version) Bible text. Return ONLY a JSON array: [{"v":1,"t":"verse text","red":false}]. Set red:true for Jesus direct speech. All verses of the chapter. Raw JSON only.',messages:[{role:'user',content:`Complete NIV ${en} chapter ${ch}. All verses. JSON array.`}]})})
    ]);
    if(r1.ok){const d=await r1.json();const raw=d.content[0].text.replace(/```json|```/g,'').trim();const vs=JSON.parse(raw);if(!S.tbData[book])S.tbData[book]={};S.tbData[book][ch]=vs;}
    if(r2.ok){const d=await r2.json();const raw=d.content[0].text.replace(/```json|```/g,'').trim();const vs=JSON.parse(raw);if(!S.nivData[book])S.nivData[book]={};S.nivData[book][ch]=vs;}
    renderChapter();selectVerse(S.v,false);setStatus(`${book} ${ch} loaded`,true);
  }catch(e){
    document.getElementById('bible-text').innerHTML=`<div class="chapter-loading"><p style="font-family:var(--font-bible);font-style:italic;color:var(--brown-l);font-size:14px;line-height:1.8">Could not load ${book} ${ch}.<br>Check internet connection.<br><br><strong>Available offline:</strong><br>Matthew / Matius · John / Yohanes · Romans / Roma · Ephesians / Efesus · Philippians / Filipi</p></div>`;
    setStatus('Offline — limited chapters',false);
  }
  S.loading=false;
}

function selectVerse(v,scroll=true){
  S.v=v;document.getElementById('sel-v').value=v;document.getElementById('ask-ctx').textContent=`${S.book} ${S.ch}:${v}`;
  document.querySelectorAll('.verse,.verse-parallel').forEach(el=>el.classList.remove('active'));
  const row=document.getElementById(`vr-${v}`);
  if(row){row.classList.add('active');if(scroll)row.scrollIntoView({block:'nearest',behavior:'smooth'});}
  document.getElementById('cp-title').textContent=`Commentary — ${S.book} ${S.ch}:${v}`;
  showComm(S.book,S.ch,v);savePrefs();
}

function showComm(book,ch,v){
  const ref=`${book}:${ch}:${v}`;
  const scroll=document.getElementById('comm-scroll');
  if(S.view!=='commentary')return;
  const authors=[{id:'mh',name:'Matthew Henry',year:'1706',badge:'MH',bc:'badge-mh'},{id:'jfb',name:'Jamieson, Fausset & Brown',year:'1871',badge:'JFB',bc:'badge-jfb'},{id:'jg',name:'John Gill',year:'1748',badge:'JG',bc:'badge-jg'}];
  const cnt=Object.values(S.commOn).filter(Boolean).length;
  document.getElementById('cp-meta').textContent=`${cnt} Reformed commentaries active`;
  let html='',has=false;
  for(const a of authors){
    if(!S.commOn[a.id])continue;const c=S.commData[a.id][ref];if(!c)continue;has=true;
    html+=`<div class="comm-block"><div class="comm-auth-bar"><div class="comm-badge ${a.bc}">${a.badge}</div><span class="comm-author">${a.name}</span><span class="comm-year">${a.year} · Public Domain</span></div><div class="comm-ref">${book} ${ch}:${v}</div><div class="comm-text">${c}</div></div>`;
  }
  if(!has){
    const refs=Object.keys(S.commData.mh||{}).slice(0,8).map(r=>{const p=r.split(':');return`<a href="#" onclick="event.preventDefault();goRef('${r}')">${p[0]} ${p[1]}:${p[2]}</a>`;}).join(' · ');
    html=`<div class="comm-notfound"><p><strong>${book} ${ch}:${v}</strong> — No pre-loaded commentary.</p><p style="margin-top:8px;font-size:11px">Available: ${refs}</p><p style="margin-top:10px"><a href="#" onclick="event.preventDefault();loadCommAI('${book}',${ch},${v})">→ Load AI-generated Reformed commentary</a></p></div>`;
  }
  scroll.innerHTML=html;
}
function goRef(ref){const p=ref.split(':');S.book=p[0];S.ch=parseInt(p[1]);S.v=parseInt(p[2]);document.getElementById('sel-book').value=S.book;document.getElementById('sel-ch').value=S.ch;document.getElementById('sel-v').value=S.v;loadPassage();}

async function loadCommAI(book,ch,v){
  const scroll=document.getElementById('comm-scroll');
  scroll.innerHTML=`<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Loading commentary…</div></div>`;
  const names=Object.entries(S.commOn).filter(([k,on])=>on).map(([k])=>({mh:'Matthew Henry',jfb:'Jamieson Fausset Brown',jg:'John Gill'}[k])).join(', ');
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1500,system:`Reformed Evangelical (Calvinist) Bible commentary. Provide summaries from ${names} for the given verse. Write BILINGUAL: English paragraph then Indonesian translation. Each commentary 2-3 paragraphs. Return ONLY valid JSON with keys mh, jfb, jg — HTML strings with <p><strong><em> only. Raw JSON.`,messages:[{role:'user',content:`Reformed commentary for ${book} ${ch}:${v}. Keys: mh, jfb, jg. JSON.`}]})});
    const d=await r.json();const raw=d.content[0].text.replace(/```json|```/g,'').trim();
    const obj=JSON.parse(raw);const ref=`${book}:${ch}:${v}`;
    for(const id of Object.keys(obj))if(S.commData[id])S.commData[id][ref]=obj[id];
    showComm(book,ch,v);
  }catch(e){scroll.innerHTML=`<div class="comm-notfound"><p>Failed to load. Check internet.</p></div>`;}
}

function toggleComm(id,el){S.commOn[id]=!S.commOn[id];if(S.commOn[id])el.classList.add('active');else el.classList.remove('active');showComm(S.book,S.ch,S.v);savePrefs();}

function setView(view,btn){
  S.view=view;document.querySelectorAll('.tb[data-view]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  if(view==='commentary')showComm(S.book,S.ch,S.v);
  else if(view==='parallel')showParallelRefs();
  else if(view==='outline')showOutline();
}

function showParallelRefs(){
  const data={'Matius:5:3':[{ref:'Luke 6:20',t:'Blessed be ye poor: for yours is the kingdom of God.'},{ref:'James 2:5',t:'Hath not God chosen the poor of this world rich in faith?'}],'Yohanes:3:16':[{ref:'Romans 5:8',t:'God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.'},{ref:'1 John 4:9',t:'God sent his only begotten Son into the world, that we might live through him.'}],'Roma:8:28':[{ref:'Ephesians 1:11',t:'In whom also we have obtained an inheritance, being predestinated according to his purpose.'},{ref:'Romans 8:38-39',t:'Neither death, nor life... shall be able to separate us from the love of God.'}],'Efesus:2:8':[{ref:'Romans 3:24',t:'Being justified freely by his grace through the redemption that is in Christ Jesus.'},{ref:'Titus 3:5',t:'Not by works of righteousness which we have done, but according to his mercy he saved us.'}]};
  const ref=`${S.book}:${S.ch}:${S.v}`;const scroll=document.getElementById('comm-scroll');
  const items=data[ref];
  if(items)scroll.innerHTML=`<div class="comm-block"><div class="comm-ref">Parallel Verses / Ayat Paralel — ${S.book} ${S.ch}:${S.v}</div>${items.map(i=>`<div style="margin-bottom:10px;padding:10px;background:var(--gold-pale);border-radius:var(--radius);border-left:3px solid var(--gold)"><div style="font-size:11px;font-weight:600;color:var(--gold);margin-bottom:4px">${i.ref}</div><div class="comm-text"><p>${i.t}</p></div></div>`).join('')}</div>`;
  else scroll.innerHTML=`<div class="comm-notfound"><p>No pre-loaded parallel verses.<br><a href="#" onclick="event.preventDefault();loadParAI()">→ Load with AI</a></p></div>`;
}
async function loadParAI(){
  const scroll=document.getElementById('comm-scroll');scroll.innerHTML=`<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Finding parallel verses…</div></div>`;
  try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:700,system:'Provide 5-6 parallel/cross-reference verses. Format as HTML divs. Bilingual English/Indonesian.',messages:[{role:'user',content:`Parallel verses for ${S.book} ${S.ch}:${S.v}`}]})});const d=await r.json();scroll.innerHTML=`<div class="comm-block"><div class="comm-ref">Parallel Verses — ${S.book} ${S.ch}:${S.v}</div><div class="comm-text">${d.content[0].text}</div></div>`;}
  catch(e){scroll.innerHTML=`<div class="comm-notfound"><p>Failed.</p></div>`;}
}

function showOutline(){
  const data={'Matius:5':`<div class="comm-block"><div class="comm-ref">Outline — Matthew/Matius 5</div><div class="comm-text"><p><strong>I. Citizens of the Kingdom (v.3-12)</strong><br>A. Eight Beatitudes / Ucapan Bahagia (3-10)<br>B. Blessing for Persecuted (11-12)</p><p><strong>II. Influence of Kingdom Citizens (v.13-16)</strong><br>A. Salt of the Earth (13)<br>B. Light of the World (14-16)</p><p><strong>III. Christ and the Law (v.17-20)</strong><br>A. Fulfillment of the Law (17-18)<br>B. Greater Righteousness (19-20)</p></div></div>`,'Yohanes:3':`<div class="comm-block"><div class="comm-ref">Outline — John/Yohanes 3</div><div class="comm-text"><p><strong>I. The New Birth (v.1-15)</strong><br>A. Necessity of Regeneration (1-8)<br>B. The Son of Man Lifted Up (9-15)</p><p><strong>II. God's Saving Love (v.16-21)</strong><br>A. The Gift of Love (16-17)<br>B. Believe or Perish (18-21)</p></div></div>`,'Efesus:2':`<div class="comm-block"><div class="comm-ref">Outline — Ephesians/Efesus 2</div><div class="comm-text"><p><strong>I. Man Without Christ (v.1-3)</strong><br>A. Dead in Sin<br>B. Following Darkness</p><p><strong>II. God's Saving Action (v.4-10)</strong><br>A. Mercy and Grace (4-7)<br>B. Sola Gratia, Sola Fide (8-9)<br>C. Created for Good Works (10)</p></div></div>`};
  const key=`${S.book}:${S.ch}`;const scroll=document.getElementById('comm-scroll');
  if(data[key])scroll.innerHTML=data[key];
  else scroll.innerHTML=`<div class="comm-notfound"><p>No pre-loaded outline for ${S.book} ${S.ch}.<br><a href="#" onclick="event.preventDefault();loadOutAI()">→ Generate with AI</a></p></div>`;
}
async function loadOutAI(){
  const scroll=document.getElementById('comm-scroll');scroll.innerHTML=`<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Generating outline…</div></div>`;
  try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:'Reformed homiletician. Create 3-4 point expository sermon outline. Bilingual English/Indonesian. HTML using p,strong,em.',messages:[{role:'user',content:`Expository outline for ${S.book} chapter ${S.ch}`}]})});const d=await r.json();scroll.innerHTML=`<div class="comm-block"><div class="comm-ref">Outline — ${S.book} ${S.ch}</div><div class="comm-text">${d.content[0].text}</div></div>`;}
  catch(e){scroll.innerHTML=`<div class="comm-notfound"><p>Failed.</p></div>`;}
}

function setTrans(btn){document.querySelectorAll('.trans-pill').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}

async function askAI(){
  const inp=document.getElementById('ask-input');const resp=document.getElementById('ask-response');const btn=document.querySelector('.ask-btn');
  const q=inp.value.trim();if(!q)return;
  resp.style.display='block';resp.textContent='Thinking…';btn.disabled=true;
  try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:`Reformed Evangelical (Calvinist) theology consultant. Context: studying ${S.book} ${S.ch}:${S.v}. Answer concisely from a Reformed perspective. Respond BILINGUAL — English first, then Indonesian. For pastors and seminary students.`,messages:[{role:'user',content:q}]})});const d=await r.json();resp.textContent=d.content[0].text;inp.value='';}
  catch(e){resp.textContent='AI requires internet. Offline commentaries available above.';}
  btn.disabled=false;
}

function toggleNotes(){const o=document.getElementById('notes-overlay');const b=document.getElementById('btn-notes');o.classList.toggle('open');b.classList.toggle('active');}
function saveNotes(){const key=`${S.book}:${S.ch}`;S.notes[key]=document.getElementById('notes-area').value;localStorage.setItem('alkitab-notes',JSON.stringify(S.notes));const s=document.getElementById('notes-saved');s.textContent='✓ Saved — '+new Date().toLocaleTimeString();setTimeout(()=>s.textContent='',3000);}
function exportNotes(){const key=`${S.book}:${S.ch}`;const blob=new Blob([`# Notes — ${S.book} ${S.ch}\n\n${S.notes[key]||''}`],{type:'text/plain'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`notes-${S.book}-${S.ch}.txt`;a.click();URL.revokeObjectURL(u);}
function insertNoteFormat(pre,suf=''){const ta=document.getElementById('notes-area');const s=ta.selectionStart,e=ta.selectionEnd;const sel=ta.value.slice(s,e);ta.value=ta.value.slice(0,s)+pre+sel+suf+ta.value.slice(e);ta.selectionStart=ta.selectionEnd=s+pre.length+sel.length+suf.length;ta.focus();}
function insertSermonTemplate(){const ta=document.getElementById('notes-area');ta.value+=(ta.value?'\n\n':'')+`## Sermon Outline — ${S.book} ${S.ch}\n\n**Text:** ${S.book} ${S.ch}:___\n**Theme:** \n**Proposition:** \n\n---\n\n### I. [First Point]\n- Sub-point A\n- Sub-point B\n\n### II. [Second Point]\n- Sub-point A\n- Sub-point B\n\n### III. [Third Point]\n- Sub-point A\n- Sub-point B\n\n---\n\n**Conclusion:** \n**Application:** \n`;ta.focus();}
setInterval(()=>{const key=`${S.book}:${S.ch}`;const cur=document.getElementById('notes-area')&&document.getElementById('notes-area').value;if(cur!==undefined&&cur!==(S.notes[key]||''))saveNotes();},30000);

function toggleSearch(){const o=document.getElementById('search-overlay');o.classList.toggle('open');if(o.classList.contains('open'))setTimeout(()=>document.getElementById('search-input').focus(),100);}
function doSearch(q){const res=document.getElementById('search-results');if(!q||q.length<2){res.innerHTML='<div class="search-hint">Type to search loaded chapters…</div>';return;}const matches=[];const ql=q.toLowerCase();for(const[b,chs]of Object.entries(S.tbData)){for(const[c,vs]of Object.entries(chs)){for(const v of vs){if(v.t.toLowerCase().includes(ql)){matches.push({book:b,ch:parseInt(c),v:v.v,t:v.t});if(matches.length>=12)break;}}if(matches.length>=12)break;}if(matches.length>=12)break;}if(!matches.length){res.innerHTML='<div class="search-hint">No results in loaded chapters.</div>';return;}const hl=t=>t.replace(new RegExp(q,'gi'),m=>`<em>${esc(m)}</em>`);res.innerHTML=matches.map(m=>`<div class="search-item" onclick="gotoSearch('${m.book}',${m.ch},${m.v})"><div class="si-ref">${m.book} ${m.ch}:${m.v}</div><div class="si-text">${hl(esc(m.t)).slice(0,140)}${m.t.length>140?'…':''}</div></div>`).join('');}
function gotoSearch(b,c,v){S.book=b;S.ch=c;S.v=v;document.getElementById('sel-book').value=b;document.getElementById('sel-ch').value=c;document.getElementById('sel-v').value=v;loadPassage();toggleSearch();}

function toggleSettings(){document.getElementById('settings-overlay').classList.toggle('open');document.getElementById('btn-settings').classList.toggle('active');}
function setFontSize(size){S.fontSize=size;document.querySelectorAll('.vtext').forEach(el=>el.style.fontSize=size+'px');document.querySelectorAll('.sp-btn').forEach(b=>b.classList.remove('active'));if(event&&event.target)event.target.classList.add('active');savePrefs();}
function toggleRedLetters(cb){S.redLetters=cb.checked;renderChapter();savePrefs();}
function updateCacheInfo(){const el=document.getElementById('cache-info');if(el)el.textContent=`${Object.keys(S.tbData).length} TB books · ${Object.keys(S.nivData).length} NIV books · ${Object.keys(S.commData.mh||{}).length} commentaries cached`;}
function clearCache(){if(!confirm('Clear cached data? Notes preserved.'))return;localStorage.removeItem('alkitab-prefs');S.tbData={};S.nivData={};S.commData={mh:{},jfb:{},jg:{}};location.reload();}

function copyV(v,t){navigator.clipboard.writeText(`${S.book} ${S.ch}:${v} — ${t}`).catch(()=>{});}
function hlV(v){const key=`${S.book}:${S.ch}`;if(!S.highlights[key])S.highlights[key]={};S.highlights[key][v]=!S.highlights[key][v];localStorage.setItem('alkitab-highlights',JSON.stringify(S.highlights));const row=document.getElementById(`vr-${v}`);if(row)row.classList.toggle('highlighted',S.highlights[key][v]);}
function noteV(v,t){const ta=document.getElementById('notes-area');ta.value+=`\n> **${S.book} ${S.ch}:${v}** — ${t}\n`;if(!document.getElementById('notes-overlay').classList.contains('open'))toggleNotes();}
function copyComm(){navigator.clipboard.writeText(document.getElementById('comm-scroll').innerText).catch(()=>{});}

function setStatus(msg,ok=true){const d=document.getElementById('status-dot');const t=document.getElementById('status-text');if(d)d.className='sb-dot'+(ok?'':' offline');if(t)t.textContent=msg;}
function setupOffline(){const u=()=>{const off=!navigator.onLine;const n=document.getElementById('offline-notice');if(n)n.classList.toggle('hidden',!off);setStatus(off?'Offline — limited mode':'Online',!off);};window.addEventListener('online',u);window.addEventListener('offline',u);u();}

let deferredInstall=null;
function checkInstall(){window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(!localStorage.getItem('install-dismissed'))document.getElementById('install-banner').classList.remove('hidden');});}
function installApp(){if(deferredInstall){deferredInstall.prompt();deferredInstall=null;}document.getElementById('install-banner').classList.add('hidden');}
function dismissInstall(){localStorage.setItem('install-dismissed','1');document.getElementById('install-banner').classList.add('hidden');}

function setupKeys(){document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();toggleSearch();}if(e.key==='Escape'){document.getElementById('search-overlay').classList.remove('open');document.getElementById('settings-overlay').classList.remove('open');}});}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escA(s){return String(s).replace(/'/g,"\\'").replace(/\n/g,' ');}

document.addEventListener('DOMContentLoaded',init);
