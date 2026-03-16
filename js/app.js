/* ─────────────────────────────────────────
   ALKITAB STUDI — MAIN APP JS
   ───────────────────────────────────────── */

'use strict';

// ── BOOK METADATA ──
const BOOKS = {
  ot: [
    {n:'Kejadian',a:'Kej',ch:50},{n:'Keluaran',a:'Kel',ch:40},{n:'Imamat',a:'Im',ch:27},
    {n:'Bilangan',a:'Bil',ch:36},{n:'Ulangan',a:'Ul',ch:34},{n:'Yosua',a:'Yos',ch:24},
    {n:'Hakim-hakim',a:'Hak',ch:21},{n:'Rut',a:'Rut',ch:4},{n:'1 Samuel',a:'1Sam',ch:31},
    {n:'2 Samuel',a:'2Sam',ch:24},{n:'1 Raja-raja',a:'1Raj',ch:22},{n:'2 Raja-raja',a:'2Raj',ch:25},
    {n:'Mazmur',a:'Mzm',ch:150},{n:'Amsal',a:'Ams',ch:31},{n:'Yesaya',a:'Yes',ch:66},
    {n:'Yeremia',a:'Yer',ch:52},{n:'Daniel',a:'Dan',ch:12}
  ],
  nt: [
    {n:'Matius',a:'Mat',ch:28},{n:'Markus',a:'Mrk',ch:16},{n:'Lukas',a:'Luk',ch:24},
    {n:'Yohanes',a:'Yoh',ch:21},{n:'Kisah Para Rasul',a:'Kis',ch:28},{n:'Roma',a:'Rom',ch:16},
    {n:'1 Korintus',a:'1Kor',ch:16},{n:'2 Korintus',a:'2Kor',ch:13},{n:'Galatia',a:'Gal',ch:6},
    {n:'Efesus',a:'Ef',ch:6},{n:'Filipi',a:'Flp',ch:4},{n:'Kolose',a:'Kol',ch:4},
    {n:'1 Tesalonika',a:'1Tes',ch:5},{n:'1 Timotius',a:'1Tim',ch:6},{n:'Ibrani',a:'Ibr',ch:13},
    {n:'Yakobus',a:'Yak',ch:5},{n:'1 Petrus',a:'1Pet',ch:5},{n:'Wahyu',a:'Why',ch:22}
  ]
};

const BOOK_FILES = {
  'Matius':'matius','Yohanes':'yohanes','Roma':'roma','Efesus':'efesus','Filipi':'filipi'
};

const BOOK_META = {
  'Matius:5':'Khotbah di Bukit — Ucapan Bahagia',
  'Matius:6':'Khotbah di Bukit — Doa dan Kekhawatiran',
  'Matius:11':'Yesus dan Yohanes Pembaptis',
  'Matius:28':'Amanat Agung',
  'Yohanes:1':'Firman Menjadi Manusia',
  'Yohanes:3':'Lahir Baru — Nikodemus',
  'Yohanes:10':'Gembala yang Baik',
  'Yohanes:14':'Jalan, Kebenaran, dan Hidup',
  'Roma:1':'Kekuatan Injil',
  'Roma:3':'Pembenaran oleh Iman',
  'Roma:5':'Damai dengan Allah',
  'Roma:8':'Hidup dalam Roh — Predestinasi',
  'Roma:9':'Kedaulatan Allah dalam Pemilihan',
  'Roma:10':'Keselamatan melalui Iman',
  'Efesus:1':'Berkat Rohani dalam Kristus',
  'Efesus:2':'Keselamatan oleh Anugerah',
  'Efesus:6':'Perlengkapan Senjata Allah',
  'Filipi:1':'Hidup adalah Kristus',
  'Filipi:2':'Kerendahan Hati Kristus',
  'Filipi:4':'Damai Sejahtera dalam Kristus',
  'Kejadian:1':'Penciptaan Langit dan Bumi'
};

// ── STATE ──
const S = {
  book: 'Matius', ch: 5, v: 3,
  testament: 'nt',
  commOn: { mh: true, jfb: true, jg: true },
  view: 'commentary',
  fontSize: 18,
  redLetters: true,
  bibleData: {},    // book -> chapter -> verses[]
  commData: { mh: {}, jfb: {}, jg: {} },
  notes: {},
  highlights: {},
  dataLoaded: false
};

// ── DATA LOADING ──
async function loadData() {
  try {
    // Load bible data
    const bibleFiles = ['matius','yohanes','roma','efesus','filipi'];
    for (const f of bibleFiles) {
      try {
        const r = await fetch(`data/bible/${f}.json`);
        if (r.ok) {
          const d = await r.json();
          S.bibleData[d.book] = d.chapters;
        }
      } catch(e) { /* skip */ }
    }

    // Load commentary data
    const commFiles = [
      { id:'mh', file:'matthew-henry' },
      { id:'jfb', file:'jfb' },
      { id:'jg', file:'john-gill' }
    ];
    for (const c of commFiles) {
      try {
        const r = await fetch(`data/commentary/${c.file}.json`);
        if (r.ok) {
          const d = await r.json();
          S.commData[c.id] = d.entries || {};
        }
      } catch(e) { /* skip */ }
    }

    S.dataLoaded = true;
    setStatus('Semua data dimuat', true);
    updateCacheInfo();
  } catch(e) {
    setStatus('Mode offline', false);
  }
}

// ── INIT ──
async function init() {
  renderBookGrid('nt');
  loadPreferences();
  setupOfflineDetection();
  await loadData();
  loadPassage();
  setupKeyboard();
  registerServiceWorker();
  checkInstallPrompt();
}

function loadPreferences() {
  const prefs = JSON.parse(localStorage.getItem('alkitab-prefs') || '{}');
  if (prefs.fontSize) S.fontSize = prefs.fontSize;
  if (prefs.redLetters !== undefined) S.redLetters = prefs.redLetters;
  if (prefs.commOn) S.commOn = prefs.commOn;
  if (prefs.book) S.book = prefs.book;
  if (prefs.ch) S.ch = prefs.ch;
  if (prefs.v) S.v = prefs.v;
  S.notes = JSON.parse(localStorage.getItem('alkitab-notes') || '{}');
  S.highlights = JSON.parse(localStorage.getItem('alkitab-highlights') || '{}');

  // Restore UI
  document.getElementById('sel-book').value = S.book;
  document.getElementById('sel-ch').value = S.ch;
  document.getElementById('sel-v').value = S.v;
  document.documentElement.style.setProperty('--v-font-size', S.fontSize + 'px');
  document.getElementById('red-letters').checked = S.redLetters;

  // Restore pill states
  for (const [id, on] of Object.entries(S.commOn)) {
    const pill = document.getElementById(`pill-${id}`);
    if (pill) { if (on) pill.classList.add('active'); else pill.classList.remove('active'); }
  }
}

function savePreferences() {
  localStorage.setItem('alkitab-prefs', JSON.stringify({
    fontSize: S.fontSize, redLetters: S.redLetters,
    commOn: S.commOn, book: S.book, ch: S.ch, v: S.v
  }));
}

// ── BOOK GRID ──
function renderBookGrid(testament) {
  S.testament = testament;
  const books = BOOKS[testament];
  const sections = testament === 'ot'
    ? [['Taurat',5],['Sejarah',8],['Puisi',3],['Nubuat',4]]
    : [['Injil',4],['Sejarah',1],['Surat Paulus',9],['Surat Umum & Nubuat',5]];

  let html = '', idx = 0;
  for (const [label, count] of sections) {
    html += `<div class="bk-section-label">${label}</div><div class="bk-row">`;
    for (let i = 0; i < count && idx < books.length; i++, idx++) {
      const b = books[idx];
      const active = b.n === S.book ? ' active' : '';
      const abbr = b.n.length > 9 ? b.n.slice(0,7)+'…' : b.n;
      html += `<button class="bk-btn${active}" title="${b.n}" onclick="selectBook('${b.n}')">${abbr}</button>`;
    }
    html += '</div>';
  }
  document.getElementById('sb-body').innerHTML = html;
}

function showTestament(t, btn) {
  document.querySelectorAll('.t-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBookGrid(t);
}

function selectBook(book) {
  S.book = book;
  document.getElementById('sel-book').value = book;
  showChapterGrid(book);
}

function showChapterGrid(book) {
  const all = [...BOOKS.ot, ...BOOKS.nt];
  const meta = all.find(b => b.n === book);
  const total = meta ? meta.ch : 50;

  let html = `<div class="bk-section-label">Pasal — ${book}</div><div class="ch-grid">`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="ch-btn${i === S.ch ? ' active' : ''}" onclick="selectChapter(${i})">${i}</button>`;
  }
  html += '</div>';
  document.getElementById('sb-body').innerHTML = html;
}

function selectChapter(ch) {
  S.ch = ch;
  S.v = 1;
  document.getElementById('sel-ch').value = ch;
  document.getElementById('sel-v').value = 1;
  loadPassage();
}

function onBookSelectChange() {
  S.book = document.getElementById('sel-book').value;
  showChapterGrid(S.book);
}

// ── NAVIGATION ──
function navigate() {
  S.book = document.getElementById('sel-book').value;
  S.ch = parseInt(document.getElementById('sel-ch').value) || 1;
  S.v = parseInt(document.getElementById('sel-v').value) || 1;
  loadPassage();
}

// ── LOAD PASSAGE ──
async function loadPassage() {
  const key = `${S.book}:${S.ch}`;
  document.getElementById('bp-title').textContent = `${S.book} ${S.ch}`;
  document.getElementById('bp-meta').textContent = BOOK_META[key] || '';
  document.getElementById('notes-ref-label').textContent = `${S.book} ${S.ch}`;
  document.getElementById('ask-ctx').textContent = `${S.book} ${S.ch}:${S.v}`;
  savePreferences();

  // Check if we have data
  const verses = S.bibleData[S.book] && S.bibleData[S.book][S.ch];
  if (verses) {
    renderVerses(verses);
    selectVerse(S.v);
  } else if (!S.dataLoaded) {
    showLoading();
  } else {
    // Try to load from AI
    await loadFromAI(S.book, S.ch);
  }

  // Load notes
  const notesKey = `${S.book}:${S.ch}`;
  document.getElementById('notes-area').value = S.notes[notesKey] || '';
}

function showLoading() {
  document.getElementById('bible-text').innerHTML = `
    <div class="chapter-loading">
      <div class="spinner"></div>
      <div class="loading-label">Memuat ${S.book} ${S.ch}...</div>
    </div>`;
}

async function loadFromAI(book, chapter) {
  showLoading();
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Berikan teks Alkitab Terjemahan Baru (TB) Indonesia. Kembalikan HANYA JSON array: [{"v":1,"t":"teks","red":false}]. Untuk perkataan langsung Yesus set red:true. Tidak ada teks lain selain JSON murni.',
        messages: [{ role: 'user', content: `${book} pasal ${chapter} lengkap dalam TB Indonesia. JSON array.` }]
      })
    });
    const data = await resp.json();
    const raw = data.content[0].text.replace(/```json|```/g, '').trim();
    const verses = JSON.parse(raw);
    if (!S.bibleData[book]) S.bibleData[book] = {};
    S.bibleData[book][chapter] = verses;
    renderVerses(verses);
    selectVerse(1);
    setStatus(`${book} ${chapter} dimuat`, true);
  } catch(e) {
    document.getElementById('bible-text').innerHTML = `
      <div class="chapter-loading">
        <p style="font-family:var(--font-bible);font-style:italic;color:var(--brown-l);font-size:14px;line-height:1.7;">
          Teks ${book} ${chapter} belum tersedia secara offline.<br>
          Hubungkan internet untuk memuat dari API.
        </p>
      </div>`;
  }
}

// ── RENDER VERSES ──
function renderVerses(verses) {
  const bt = document.getElementById('bible-text');
  const hlKey = `${S.book}:${S.ch}`;
  const highlights = S.highlights[hlKey] || {};

  let html = '';
  for (const v of verses) {
    const active = v.v === S.v ? ' active' : '';
    const hl = highlights[v.v] ? ' highlighted' : '';
    const text = S.redLetters && v.red
      ? `<span class="red">${escHtml(v.t)}</span>`
      : escHtml(v.t);
    html += `
      <div class="verse${active}${hl}" id="vr-${v.v}" onclick="selectVerse(${v.v})" style="--vfs:${S.fontSize}px">
        <span class="vnum">${v.v}</span>
        <span class="vtext" style="font-size:var(--vfs)">${text}</span>
        <div class="verse-btns">
          <button class="vbtn" title="Salin" onclick="event.stopPropagation();copyVerse(${v.v},'${escAttr(v.t)}')">📋</button>
          <button class="vbtn" title="Highlight" onclick="event.stopPropagation();toggleHighlight(${v.v})">🔖</button>
          <button class="vbtn" title="Tambah ke catatan" onclick="event.stopPropagation();addToNotes(${v.v},'${escAttr(v.t)}')">✏️</button>
        </div>
      </div>`;
  }
  bt.innerHTML = html;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s).replace(/'/g,"\\'").replace(/\n/g,' ');
}

// ── SELECT VERSE ──
function selectVerse(v) {
  S.v = v;
  document.getElementById('sel-v').value = v;
  document.getElementById('ask-ctx').textContent = `${S.book} ${S.ch}:${v}`;

  document.querySelectorAll('.verse').forEach(el => el.classList.remove('active'));
  const row = document.getElementById(`vr-${v}`);
  if (row) {
    row.classList.add('active');
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  document.getElementById('cp-title').textContent = `Tafsiran — ${S.book} ${S.ch}:${v}`;
  showCommentary(S.book, S.ch, v);
  savePreferences();
}

// ── COMMENTARY ──
function showCommentary(book, ch, v) {
  const ref = `${book}:${ch}:${v}`;
  const scroll = document.getElementById('comm-scroll');
  const authors = [
    { id:'mh', name:'Matthew Henry', year:'1706', badge:'MH', bc:'badge-mh' },
    { id:'jfb', name:'Jamieson, Fausset & Brown', year:'1871', badge:'JFB', bc:'badge-jfb' },
    { id:'jg', name:'John Gill', year:'1748', badge:'JG', bc:'badge-jg' }
  ];

  const activeCount = Object.values(S.commOn).filter(Boolean).length;
  document.getElementById('cp-meta').textContent = `${activeCount} sumber tafsiran Reformed aktif`;

  if (S.view !== 'commentary') return;

  let html = '';
  let hasContent = false;

  for (const a of authors) {
    if (!S.commOn[a.id]) continue;
    const content = S.commData[a.id][ref];
    if (!content) continue;
    hasContent = true;
    html += `
      <div class="comm-block">
        <div class="comm-auth-bar">
          <div class="comm-badge ${a.bc}">${a.badge}</div>
          <span class="comm-author">${a.name}</span>
          <span class="comm-year">${a.year} · Domain Publik</span>
        </div>
        <div class="comm-ref">${book} ${ch}:${v}</div>
        <div class="comm-text">${content}</div>
      </div>`;
  }

  if (!hasContent) {
    const availableRefs = Object.keys(S.commData.mh || {});
    const suggestions = availableRefs.slice(0, 6).map(r => {
      const parts = r.split(':');
      const label = `${parts[0]} ${parts[1]}:${parts[2]}`;
      return `<a href="#" onclick="event.preventDefault();goToRef('${r}')">${label}</a>`;
    }).join(' · ');

    html = `<div class="comm-notfound">
      <p>Tafsiran untuk <strong>${book} ${ch}:${v}</strong> belum tersedia dalam data offline.</p>
      <p style="margin-top:8px;">Ayat dengan tafsiran lengkap:<br>${suggestions}</p>
      ${S.dataLoaded ? `<p style="margin-top:8px;"><a href="#" onclick="event.preventDefault();loadCommFromAI('${book}',${ch},${v})">Muat dari AI →</a></p>` : ''}
    </div>`;
  }

  scroll.innerHTML = html;
}

function goToRef(ref) {
  const parts = ref.split(':');
  S.book = parts[0];
  S.ch = parseInt(parts[1]);
  S.v = parseInt(parts[2]);
  document.getElementById('sel-book').value = S.book;
  document.getElementById('sel-ch').value = S.ch;
  document.getElementById('sel-v').value = S.v;
  loadPassage();
}

async function loadCommFromAI(book, ch, v) {
  const scroll = document.getElementById('comm-scroll');
  scroll.innerHTML = `<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Memuat tafsiran...</div></div>`;

  const activeNames = Object.entries(S.commOn)
    .filter(([k,on]) => on)
    .map(([k]) => ({ mh:'Matthew Henry', jfb:'Jamieson Fausset Brown', jg:'John Gill' }[k]))
    .join(', ');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Kamu adalah pakar tafsiran Alkitab Reformed Evangelikal (Calvinis). Berikan ringkasan tafsiran dari ${activeNames} untuk ayat yang diminta, dalam Bahasa Indonesia. Format: JSON dengan key mh, jfb, jg, masing-masing berisi HTML string dengan tag <p><strong><em> saja. Hanya JSON murni tanpa markdown.`,
        messages: [{ role: 'user', content: `Tafsiran Reformed untuk ${book} ${ch}:${v} dari ${activeNames}. JSON format.` }]
      })
    });
    const data = await resp.json();
    const raw = data.content[0].text.replace(/```json|```/g,'').trim();
    const commObj = JSON.parse(raw);
    const ref = `${book}:${ch}:${v}`;
    for (const id of Object.keys(commObj)) {
      if (S.commData[id]) S.commData[id][ref] = commObj[id];
    }
    showCommentary(book, ch, v);
  } catch(e) {
    scroll.innerHTML = `<div class="comm-notfound"><p>Gagal memuat. Periksa koneksi internet.</p></div>`;
  }
}

function toggleComm(id, el) {
  S.commOn[id] = !S.commOn[id];
  if (S.commOn[id]) el.classList.add('active'); else el.classList.remove('active');
  showCommentary(S.book, S.ch, S.v);
  savePreferences();
}

// ── VIEWS ──
function setView(view, btn) {
  S.view = view;
  document.querySelectorAll('.tb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (view === 'commentary') {
    showCommentary(S.book, S.ch, S.v);
  } else if (view === 'parallel') {
    showParallel();
  } else if (view === 'outline') {
    showOutline();
  }
}

function showParallel() {
  const parallels = {
    'Matius:5:3': [
      { ref:'Lukas 6:20', t:'Berbahagialah, hai kamu yang miskin, karena kamulah yang empunya Kerajaan Allah.' },
      { ref:'Yakobus 2:5', t:'Bukankah Allah memilih orang-orang yang dianggap miskin oleh dunia ini untuk menjadi kaya dalam iman?' }
    ],
    'Yohanes:3:16': [
      { ref:'Roma 5:8', t:'Allah menunjukkan kasih-Nya kepada kita, oleh karena Kristus telah mati untuk kita, ketika kita masih berdosa.' },
      { ref:'1 Yohanes 4:9', t:'Dalam hal inilah kasih Allah dinyatakan di tengah-tengah kita, yaitu bahwa Allah telah mengutus Anak-Nya yang tunggal ke dalam dunia.' }
    ],
    'Roma:8:28': [
      { ref:'Roma 8:38-39', t:'Aku yakin bahwa baik maut, maupun hidup... tidak akan dapat memisahkan kita dari kasih Allah.' },
      { ref:'Efesus 1:11', t:'Di dalam Dialah kami mendapat bagian yang dijanjikan, kami yang dari semula ditentukan untuk itu.' }
    ],
    'Efesus:2:8': [
      { ref:'Roma 3:24', t:'Oleh kasih karunia telah dibenarkan dengan cuma-cuma karena penebusan dalam Kristus Yesus.' },
      { ref:'Titus 3:5', t:'Pada waktu itu Dia telah menyelamatkan kita, bukan karena perbuatan baik yang telah kita lakukan.' }
    ]
  };

  const ref = `${S.book}:${S.ch}:${S.v}`;
  const items = parallels[ref];
  const scroll = document.getElementById('comm-scroll');

  if (items) {
    scroll.innerHTML = `<div class="comm-block">
      <div class="comm-ref">Ayat Paralel — ${S.book} ${S.ch}:${S.v}</div>
      ${items.map(i => `<div style="margin-bottom:10px;padding:10px;background:var(--gold-pale);border-radius:var(--radius);border-left:3px solid var(--gold)">
        <div style="font-size:11px;font-weight:600;color:var(--gold);margin-bottom:4px">${i.ref}</div>
        <div class="comm-text"><p>${i.t}</p></div>
      </div>`).join('')}
    </div>`;
  } else {
    scroll.innerHTML = `<div class="comm-notfound"><p>Pilih ayat yang tersedia untuk melihat referensi paralel.<br>
      <a href="#" onclick="event.preventDefault();loadParallelFromAI()">Muat referensi paralel dari AI →</a></p></div>`;
  }
}

async function loadParallelFromAI() {
  const scroll = document.getElementById('comm-scroll');
  scroll.innerHTML = `<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Mencari ayat paralel...</div></div>`;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: 'Berikan 4-6 ayat paralel untuk ayat Alkitab yang diberikan, dalam HTML. Gunakan format: <div class="comm-block"><div class="comm-ref">...</div>...</div>. Bahasa Indonesia.',
        messages: [{ role: 'user', content: `Ayat paralel untuk ${S.book} ${S.ch}:${S.v}` }]
      })
    });
    const data = await resp.json();
    scroll.innerHTML = data.content[0].text;
  } catch(e) {
    scroll.innerHTML = `<div class="comm-notfound"><p>Gagal memuat.</p></div>`;
  }
}

function showOutline() {
  const outlines = {
    'Matius:5': `<div class="comm-block">
      <div class="comm-ref">Garis Besar Khotbah — Matius 5</div>
      <div class="comm-text">
        <p><strong>I. Karakter Warga Kerajaan (ay. 3-12)</strong><br>
        A. Delapan Ucapan Bahagia (3-10)<br>B. Berkat bagi yang Dianiaya (11-12)</p>
        <p><strong>II. Pengaruh Warga Kerajaan (ay. 13-16)</strong><br>
        A. Garam Dunia (13)<br>B. Terang Dunia (14-16)</p>
        <p><strong>III. Kristus dan Hukum Taurat (ay. 17-20)</strong><br>
        A. Penggenapan Hukum (17-18)<br>B. Kebenaran yang Melampaui Farisi (19-20)</p>
      </div></div>`,
    'Yohanes:3': `<div class="comm-block">
      <div class="comm-ref">Garis Besar Khotbah — Yohanes 3</div>
      <div class="comm-text">
        <p><strong>I. Percakapan dengan Nikodemus (ay. 1-15)</strong><br>
        A. Kebutuhan Lahir Baru (1-8)<br>B. Anak Manusia Ditinggikan (9-15)</p>
        <p><strong>II. Kasih Allah yang Menyelamatkan (ay. 16-21)</strong><br>
        A. Kasih Allah dalam Pengorbanan (16-17)<br>B. Respons Manusia (18-21)</p>
      </div></div>`,
    'Efesus:2': `<div class="comm-block">
      <div class="comm-ref">Garis Besar Khotbah — Efesus 2</div>
      <div class="comm-text">
        <p><strong>I. Kondisi Manusia Tanpa Kristus (ay. 1-3)</strong><br>
        A. Mati dalam Dosa<br>B. Ikut Penguasa Kegelapan</p>
        <p><strong>II. Tindakan Penyelamatan Allah (ay. 4-10)</strong><br>
        A. Kasih dan Anugerah Allah (4-7)<br>B. <em>Sola Gratia, Sola Fide</em> (8-9)<br>C. Diciptakan untuk Perbuatan Baik (10)</p>
      </div></div>`
  };

  const key = `${S.book}:${S.ch}`;
  const scroll = document.getElementById('comm-scroll');
  if (outlines[key]) {
    scroll.innerHTML = outlines[key];
  } else {
    scroll.innerHTML = `<div class="comm-notfound"><p>Garis besar untuk ${S.book} ${S.ch} belum tersedia.<br>
      <a href="#" onclick="event.preventDefault();loadOutlineFromAI()">Buat garis besar khotbah dengan AI →</a></p></div>`;
  }
}

async function loadOutlineFromAI() {
  const scroll = document.getElementById('comm-scroll');
  scroll.innerHTML = `<div class="chapter-loading"><div class="spinner"></div><div class="loading-label">Membuat garis besar...</div></div>`;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        system: 'Kamu adalah homiletician Reformed. Buat garis besar khotbah ekspositori 3-4 poin untuk pasal yang diberikan. Format HTML dengan tag p, strong, em. Perspektif Calvinis. Bahasa Indonesia.',
        messages: [{ role: 'user', content: `Garis besar khotbah ekspositori untuk ${S.book} pasal ${S.ch}` }]
      })
    });
    const data = await resp.json();
    scroll.innerHTML = `<div class="comm-block"><div class="comm-ref">Garis Besar — ${S.book} ${S.ch}</div><div class="comm-text">${data.content[0].text}</div></div>`;
  } catch(e) {
    scroll.innerHTML = `<div class="comm-notfound"><p>Gagal memuat.</p></div>`;
  }
}

// ── TRANSLATION ──
function setTrans(btn) {
  document.querySelectorAll('.trans-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const trans = btn.dataset.trans;
  if (trans !== 'TB') {
    loadTranslation(trans);
  } else {
    loadPassage();
  }
}

async function loadTranslation(trans) {
  showLoading();
  const transNames = { BIS:'Bahasa Indonesia Sehari-hari (BIS)', TL:'Terjemahan Lama (TL)' };
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Berikan teks Alkitab. HANYA JSON array: [{"v":1,"t":"teks","red":false}]. Tidak ada teks lain.',
        messages: [{ role: 'user', content: `${S.book} ${S.ch} dalam ${transNames[trans]}. JSON array.` }]
      })
    });
    const data = await resp.json();
    const raw = data.content[0].text.replace(/```json|```/g,'').trim();
    const verses = JSON.parse(raw);
    renderVerses(verses);
    selectVerse(1);
  } catch(e) { loadPassage(); }
}

// ── ASK AI ──
async function askAI() {
  const input = document.getElementById('ask-input');
  const resp = document.getElementById('ask-response');
  const btn = document.querySelector('.ask-btn');
  const q = input.value.trim();
  if (!q) return;

  resp.style.display = 'block';
  resp.textContent = 'Sedang memproses...';
  btn.disabled = true;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Kamu adalah konsultan teologi Reformed Evangelikal (Calvinis). Konteks: sedang mempelajari ${S.book} ${S.ch}:${S.v}. Jawab ringkas (3-4 paragraf), akademis tapi praktis untuk pendeta dan mahasiswa teologi Indonesia. Perspektif Reformed/Calvinis. Bahasa Indonesia yang baik.`,
        messages: [{ role: 'user', content: q }]
      })
    });
    const data = await r.json();
    resp.textContent = data.content[0].text;
    input.value = '';
  } catch(e) {
    resp.textContent = 'Fitur AI membutuhkan koneksi internet. Tafsiran offline tetap tersedia di atas.';
  }

  btn.disabled = false;
}

// ── NOTES ──
function toggleNotes() {
  const overlay = document.getElementById('notes-overlay');
  const btn = document.getElementById('btn-notes');
  overlay.classList.toggle('open');
  btn.classList.toggle('active');
}

function saveNotes() {
  const key = `${S.book}:${S.ch}`;
  S.notes[key] = document.getElementById('notes-area').value;
  localStorage.setItem('alkitab-notes', JSON.stringify(S.notes));
  const saved = document.getElementById('notes-saved');
  saved.textContent = '✓ Catatan tersimpan — ' + new Date().toLocaleTimeString('id-ID');
  setTimeout(() => saved.textContent = '', 3000);
}

function exportNotes() {
  const key = `${S.book}:${S.ch}`;
  const content = `# Catatan — ${S.book} ${S.ch}\n\n${S.notes[key] || ''}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `catatan-${S.book}-${S.ch}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

function insertNoteFormat(prefix, suffix = '') {
  const ta = document.getElementById('notes-area');
  const start = ta.selectionStart, end = ta.selectionEnd;
  const selected = ta.value.slice(start, end);
  const replacement = prefix + selected + suffix;
  ta.value = ta.value.slice(0, start) + replacement + ta.value.slice(end);
  ta.selectionStart = ta.selectionEnd = start + prefix.length + selected.length + suffix.length;
  ta.focus();
}

function insertSermonTemplate() {
  const ta = document.getElementById('notes-area');
  const tmpl = `## Outline Khotbah — ${S.book} ${S.ch}

**Teks Utama:** ${S.book} ${S.ch}:___
**Tema:** 
**Proposisi:** 

---

### I. [Poin Pertama]
- Sub-poin A
- Sub-poin B

### II. [Poin Kedua]
- Sub-poin A
- Sub-poin B

### III. [Poin Ketiga]
- Sub-poin A
- Sub-poin B

---

**Kesimpulan:** 

**Aplikasi:** 

**Doa Penutup:** 
`;
  ta.value = (ta.value ? ta.value + '\n\n' : '') + tmpl;
  ta.focus();
}

// Auto-save notes every 30s
setInterval(() => {
  const key = `${S.book}:${S.ch}`;
  const current = document.getElementById('notes-area').value;
  if (current !== (S.notes[key] || '')) saveNotes();
}, 30000);

// ── SEARCH ──
function toggleSearch() {
  const overlay = document.getElementById('search-overlay');
  overlay.classList.toggle('open');
  if (overlay.classList.contains('open')) {
    setTimeout(() => document.getElementById('search-input').focus(), 100);
  }
}

function doSearch(q) {
  const results = document.getElementById('search-results');
  if (!q || q.length < 2) {
    results.innerHTML = '<div class="search-hint">Mulai mengetik untuk mencari dalam teks yang telah dimuat...</div>';
    return;
  }

  const matches = [];
  const ql = q.toLowerCase();

  for (const [book, chapters] of Object.entries(S.bibleData)) {
    for (const [ch, verses] of Object.entries(chapters)) {
      for (const v of verses) {
        if (v.t.toLowerCase().includes(ql)) {
          matches.push({ book, ch: parseInt(ch), v: v.v, t: v.t });
          if (matches.length >= 12) break;
        }
      }
      if (matches.length >= 12) break;
    }
    if (matches.length >= 12) break;
  }

  if (!matches.length) {
    results.innerHTML = '<div class="search-hint">Tidak ditemukan dalam data yang dimuat.</div>';
    return;
  }

  const hl = t => t.replace(new RegExp(q, 'gi'), m => `<em>${escHtml(m)}</em>`);
  results.innerHTML = matches.map(m => `
    <div class="search-item" onclick="gotoSearch('${m.book}',${m.ch},${m.v})">
      <div class="si-ref">${m.book} ${m.ch}:${m.v}</div>
      <div class="si-text">${hl(escHtml(m.t)).slice(0, 140)}${m.t.length > 140 ? '…' : ''}</div>
    </div>`).join('');
}

function gotoSearch(book, ch, v) {
  S.book = book; S.ch = ch; S.v = v;
  document.getElementById('sel-book').value = book;
  document.getElementById('sel-ch').value = ch;
  document.getElementById('sel-v').value = v;
  loadPassage();
  toggleSearch();
}

// ── SETTINGS ──
function toggleSettings() {
  const overlay = document.getElementById('settings-overlay');
  overlay.classList.toggle('open');
  document.getElementById('btn-settings').classList.toggle('active');
}

function setFontSize(size) {
  S.fontSize = size;
  document.documentElement.style.setProperty('--v-font-size', size + 'px');
  document.querySelectorAll('.vtext').forEach(el => el.style.fontSize = size + 'px');
  document.querySelectorAll('.sp-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  savePreferences();
}

function toggleRedLetters(cb) {
  S.redLetters = cb.checked;
  loadPassage();
  savePreferences();
}

function updateCacheInfo() {
  const books = Object.keys(S.bibleData);
  document.getElementById('cache-info').textContent =
    `${books.length} kitab dimuat · ${Object.keys(S.commData.mh).length} tafsiran tersimpan`;
}

function clearCache() {
  if (!confirm('Hapus semua data tersimpan? Catatan khotbah akan tetap tersimpan.')) return;
  localStorage.removeItem('alkitab-prefs');
  S.bibleData = {}; S.commData = { mh:{}, jfb:{}, jg:{} };
  location.reload();
}

// ── VERSE ACTIONS ──
function copyVerse(v, text) {
  navigator.clipboard.writeText(`${S.book} ${S.ch}:${v} — ${text}`).catch(() => {});
}

function toggleHighlight(v) {
  const key = `${S.book}:${S.ch}`;
  if (!S.highlights[key]) S.highlights[key] = {};
  S.highlights[key][v] = !S.highlights[key][v];
  localStorage.setItem('alkitab-highlights', JSON.stringify(S.highlights));
  const row = document.getElementById(`vr-${v}`);
  if (row) row.classList.toggle('highlighted', S.highlights[key][v]);
}

function addToNotes(v, text) {
  const ta = document.getElementById('notes-area');
  const ref = `${S.book} ${S.ch}:${v}`;
  ta.value += `\n> **${ref}** — ${text}\n`;
  if (!document.getElementById('notes-overlay').classList.contains('open')) toggleNotes();
}

function copyComm() {
  const scroll = document.getElementById('comm-scroll');
  navigator.clipboard.writeText(scroll.innerText).catch(() => {});
}

// ── STATUS ──
function setStatus(msg, online = true) {
  document.getElementById('status-text').textContent = msg;
  document.getElementById('status-dot').className = 'sb-dot' + (online ? '' : ' offline');
}

// ── OFFLINE ──
function setupOfflineDetection() {
  const updateOnline = () => {
    const offline = !navigator.onLine;
    document.getElementById('offline-notice').classList.toggle('hidden', !offline);
    document.getElementById('status-dot').className = 'sb-dot' + (offline ? ' offline' : '');
    document.getElementById('status-text').textContent = offline ? 'Offline' : 'Online';
  };
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();
}

// ── SERVICE WORKER ──
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ── INSTALL PROMPT ──
let deferredInstall = null;
function checkInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstall = e;
    if (!localStorage.getItem('install-dismissed')) {
      document.getElementById('install-banner').classList.remove('hidden');
    }
  });
}
function installApp() {
  if (deferredInstall) {
    deferredInstall.prompt();
    deferredInstall.userChoice.then(() => { deferredInstall = null; });
  }
  document.getElementById('install-banner').classList.add('hidden');
}
function dismissInstall() {
  localStorage.setItem('install-dismissed', '1');
  document.getElementById('install-banner').classList.add('hidden');
}

// ── KEYBOARD ──
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggleSearch(); }
    if (e.key === 'Escape') {
      document.getElementById('search-overlay').classList.remove('open');
      document.getElementById('settings-overlay').classList.remove('open');
    }
  });
}

// ── START ──
document.addEventListener('DOMContentLoaded', init);
