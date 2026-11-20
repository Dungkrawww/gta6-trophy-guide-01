// Leonida Platinum — offline GTA VI trophy guide & tracker.
// All data comes from data/trophies.json (same folder). Progress lives in
// localStorage only; export/import move it as a file. No network requests.
const STORE_KEY = 'leonida-platinum-v1';
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', side: 'Side', collectible: 'Collectible', activity: 'Activity', combat: 'Combat', misc: 'Misc' };

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const byName = new Map(trophies.map((t) => [t.name, t]));

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: [], counters: {}, notes: {}, spoilers: true };
    const s = JSON.parse(raw);
    return { earned: Array.isArray(s.earned) ? s.earned : [], counters: s.counters || {}, notes: s.notes || {}, spoilers: s.spoilers !== false };
  } catch {
    return { earned: [], counters: {}, notes: {}, spoilers: true };
  }
}
let state = loadState();
let earned = new Set(state.earned.filter((n) => byName.has(n)));
let selectedId = null;
let currentView = 'checklist';

function saveState() {
  state = { earned: [...earned], counters: state.counters, notes: state.notes, spoilers: state.spoilers };
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

const $ = (id) => document.getElementById(id);
const els = {
  earnedCount: $('earnedCount'), barFill: $('barFill'), progressLine: $('progressLine'),
  gradeLine: $('gradeLine'), search: $('search'), gradeFilter: $('gradeFilter'),
  kindFilter: $('kindFilter'), earnedFilter: $('earnedFilter'), spoilerToggle: $('spoilerToggle'),
  listSummary: $('listSummary'), trophyList: $('trophyList'), detailPane: $('detailPane'),
  roadmapList: $('roadmapList'), missableList: $('missableList'), plannerList: $('plannerList'),
  missableCount: $('missableCount'), aboutText: $('aboutText'),
};
els.aboutText.textContent = doc.about || '';
els.spoilerToggle.checked = state.spoilers;

function isHiddenFromSpoilers(t) {
  return state.spoilers && t.hidden && !earned.has(t.name);
}
function displayName(t) {
  return isHiddenFromSpoilers(t) ? 'Hidden trophy — earn it to reveal' : t.name;
}
function displayDesc(t) {
  return isHiddenFromSpoilers(t) ? 'Hidden on PlayStation until earned.' : t.description;
}
function counterValue(t) {
  return Math.max(0, Math.min(t.target || 0, Number(state.counters[t.id] || 0)));
}
function fmtTarget(t, v) {
  if (t.target_label && t.target_label.startsWith('$')) return `$${Number(v).toLocaleString('en-US')} / $${t.target.toLocaleString('en-US')}`;
  return `${v} / ${t.target} ${t.target_label || ''}`.trim();
}

function renderHeader() {
  const total = trophies.length;
  const n = earned.size;
  els.earnedCount.textContent = n;
  els.barFill.style.width = `${Math.round((n / total) * 100)}%`;
  els.progressLine.textContent = `${n} of ${total} earned · ${Math.round((n / total) * 100)}% · ${total - n} to go`;
  const byGrade = {};
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const tot = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
    byGrade[g] = `${GRADE_LABEL[g]} ${got}/${tot}`;
  }
  els.gradeLine.textContent = Object.values(byGrade).join(' · ');
  const miss = trophies.filter((t) => t.missable);
  els.missableCount.textContent = miss.length;
}

function trophyMatches(t) {
  const q = els.search.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q))) return false;
  if (els.gradeFilter.value !== 'all' && t.grade !== els.gradeFilter.value) return false;
  if (els.kindFilter.value !== 'all' && t.category !== els.kindFilter.value) return false;
  const f = els.earnedFilter.value;
  if (f === 'earned' && !earned.has(t.name)) return false;
  if (f === 'unearned' && earned.has(t.name)) return false;
  if (f === 'missable' && !t.missable) return false;
  return true;
}

function renderList() {
  const shown = trophies.filter(trophyMatches);
  els.listSummary.textContent = `Showing ${shown.length} of ${trophies.length} trophies` +
    (state.spoilers ? ' · spoiler-safe on: story & hidden trophies stay hidden until earned' : ' · spoilers shown');
  els.trophyList.replaceChildren();
  if (!shown.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No trophies match these filters. Clear the search or widen a filter.';
    els.trophyList.append(p);
    return;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    if (selectedId === t.id) li.classList.add('selected');
    if (earned.has(t.name)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', (ev) => {
      ev.stopPropagation();
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveState(); renderAll();
    });
    const body = document.createElement('div');
    body.className = 'trophybody';
    const name = document.createElement('div');
    name.className = 'trophyname';
    name.textContent = displayName(t);
    const desc = document.createElement('div');
    desc.className = 'trophydesc';
    desc.textContent = displayDesc(t);
    const tags = document.createElement('div');
    tags.className = 'tags';
    const gradeTag = document.createElement('span');
    gradeTag.className = `tag ${t.grade}`;
    gradeTag.textContent = GRADE_LABEL[t.grade];
    tags.append(gradeTag);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = KIND_LABEL[t.category] || t.category;
    tags.append(kindTag);
    if (t.hidden) { const h = document.createElement('span'); h.className = 'tag'; h.textContent = 'Hidden'; tags.append(h); }
    if (t.missable) { const m = document.createElement('span'); m.className = 'tag missable'; m.textContent = '⚠ Missable'; tags.append(m); }
    if (t.target) { const c = document.createElement('span'); c.className = 'tag counter'; c.textContent = `◔ ${fmtTarget(t, counterValue(t))}`; tags.append(c); }
    if (state.notes[t.id]) { const nt = document.createElement('span'); nt.className = 'tag'; nt.textContent = '✎ Note'; tags.append(nt); }
    body.append(name, desc, tags);
    li.append(box, body);
    li.addEventListener('click', (ev) => {
      if (ev.target === box) return;
      selectedId = t.id;
      location.hash = `#/trophy/${t.id}`;
      renderList(); renderDetail();
    });
    els.trophyList.append(li);
  }
}

function renderDetail() {
  const pane = els.detailPane;
  pane.replaceChildren();
  const t = byId.get(selectedId) || trophies.find((x) => !earned.has(x.name)) || trophies[0];
  if (!t) return;
  selectedId = t.id;
  const h = document.createElement('h3');
  h.textContent = displayName(t);
  const d = document.createElement('p');
  d.className = 'desc';
  d.textContent = `“${displayDesc(t)}” — official description`;
  pane.append(h, d);
  const tags = document.createElement('div');
  tags.className = 'tags';
  for (const [cls, txt] of [[t.grade, GRADE_LABEL[t.grade]], ['', KIND_LABEL[t.category] || t.category], ...(t.hidden ? [['', 'Hidden on PlayStation']] : []), ...(t.missable ? [['missable', '⚠ Missable']] : [])]) {
    const s = document.createElement('span');
    s.className = `tag ${cls}`;
    s.textContent = txt;
    tags.append(s);
  }
  pane.append(tags);
  if (isHiddenFromSpoilers(t)) {
    const p = document.createElement('p');
    p.textContent = 'Spoiler-safe mode is on: this trophy stays hidden until you earn it. Turn the spoiler setting off to read its guide, or tick it earned.';
    pane.append(p);
  } else {
    if (t.missable && t.missable_note) {
      const w = document.createElement('p');
      w.className = 'warn';
      w.textContent = `Missable — ${t.missable_note}`;
      pane.append(w);
    }
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    pane.append(guide);
    if (t.steps && t.steps.length) {
      const ol = document.createElement('ol');
      for (const s of t.steps) { const li = document.createElement('li'); li.textContent = s; ol.append(li); }
      pane.append(ol);
    }
    if (t.target) {
      const box = document.createElement('div');
      box.className = 'counterbox';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−';
      const val = document.createElement('span'); val.className = 'count'; val.textContent = fmtTarget(t, counterValue(t));
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+';
      const lab = document.createElement('span'); lab.textContent = `Progress toward the PSN target (${t.target_label})`;
      const step = t.target >= 1000 ? 1000 : t.target >= 100 ? 10 : 1;
      minus.addEventListener('click', () => { state.counters[t.id] = Math.max(0, counterValue(t) - step); saveState(); renderAll(); });
      plus.addEventListener('click', () => { state.counters[t.id] = Math.min(t.target, counterValue(t) + step); saveState(); renderAll(); });
      box.append(minus, val, plus, lab);
      pane.append(box);
    }
    const src = document.createElement('p');
    src.className = 'sources';
    src.textContent = `Sources: ${t.sources}`;
    pane.append(src);
  }
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.textContent = earned.has(t.name) ? '✓ Earned — tick off to undo' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    saveState(); renderAll();
  });
  pane.append(earnedBtn);
  const noteLabel = document.createElement('p');
  noteLabel.className = 'hint';
  noteLabel.textContent = 'Your note for this trophy (saved in your browser):';
  const note = document.createElement('textarea');
  note.value = state.notes[t.id] || '';
  note.placeholder = 'e.g. where you found it, what worked…';
  note.addEventListener('input', () => { state.notes[t.id] = note.value; saveState(); });
  pane.append(noteLabel, note);
}

function renderRoadmap() {
  els.roadmapList.replaceChildren();
  for (const ph of doc.roadmap || []) {
    const inPhase = trophies.filter((t) => t.phase === ph.phase);
    const done = inPhase.filter((t) => earned.has(t.name)).length;
    const div = document.createElement('div');
    div.className = 'phase';
    const h = document.createElement('h3');
    h.textContent = `${ph.title} — ${done}/${inPhase.length} earned`;
    const bar = document.createElement('div');
    bar.className = 'pbar';
    const fill = document.createElement('div');
    fill.style.width = `${inPhase.length ? Math.round((done / inPhase.length) * 100) : 0}%`;
    bar.append(fill);
    const goal = document.createElement('p');
    goal.className = 'goal';
    goal.textContent = ph.goal;
    const detail = document.createElement('p');
    detail.textContent = ph.detail;
    const names = document.createElement('p');
    names.className = 'note';
    names.textContent = inPhase.map((t) => `${earned.has(t.name) ? '✓' : '○'} ${displayName(t)}`).join(' · ');
    div.append(h, bar, goal, detail, names);
    els.roadmapList.append(div);
  }
}

function renderMissables() {
  els.missableList.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const div = document.createElement('div');
    div.className = 'missable';
    const h = document.createElement('h3');
    h.textContent = `${earned.has(t.name) ? '✓ ' : ''}${displayName(t)} — ${GRADE_LABEL[t.grade]}`;
    const note = document.createElement('p');
    note.textContent = t.missable_note;
    const g = document.createElement('p');
    g.className = 'note';
    g.textContent = isHiddenFromSpoilers(t) ? 'Guide hidden by spoiler-safe mode.' : t.guide;
    div.append(h, note, g);
    div.addEventListener('click', () => { selectedId = t.id; switchView('checklist'); location.hash = `#/trophy/${t.id}`; renderAll(); });
    els.missableList.append(div);
  }
}

function plannerRank(t) {
  let score = 0;
  if (t.missable) score += 100;
  score += (6 - t.phase) * 10;
  if (t.target) score += 5;
  if (t.grade === 'bronze') score += 3;
  if (t.target && t.target >= 100) score -= 5;
  if (t.grade === 'platinum') score -= 50;
  return score;
}
function renderPlanner() {
  els.plannerList.replaceChildren();
  const next = trophies.filter((t) => !earned.has(t.name)).sort((a, b) => plannerRank(b) - plannerRank(a)).slice(0, 10);
  next.forEach((t, i) => {
    const li = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = `${i + 1}.`;
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = displayName(t);
    name.append(strong);
    const why = document.createElement('div');
    why.className = 'why';
    why.textContent = `${GRADE_LABEL[t.grade]} · ${KIND_LABEL[t.category]} · Phase ${t.phase}` +
      (t.missable ? ' · ⚠ missable — do it before its window closes' : '') +
      (t.target ? ` · PSN target: ${fmtTarget(t, counterValue(t))}` : '') +
      ` — ${isHiddenFromSpoilers(t) ? 'hidden until earned' : t.description}`;
    body.append(name, why);
    li.append(rank, body);
    li.addEventListener('click', () => { selectedId = t.id; switchView('checklist'); location.hash = `#/trophy/${t.id}`; renderAll(); });
    els.plannerList.append(li);
  });
}

function switchView(view) {
  currentView = view;
  for (const btn of document.querySelectorAll('.tab')) btn.classList.toggle('active', btn.dataset.view === view);
  for (const v of ['checklist', 'roadmap', 'missables', 'planner']) $('view-' + v).classList.toggle('hidden', v !== view);
}
function renderAll() {
  renderHeader(); renderList(); renderDetail(); renderRoadmap(); renderMissables(); renderPlanner();
}

for (const btn of document.querySelectorAll('.tab')) {
  btn.addEventListener('click', () => { switchView(btn.dataset.view); location.hash = `#/${btn.dataset.view}`; });
}
for (const [el, fn] of [[els.search, 'input'], [els.gradeFilter, 'change'], [els.kindFilter, 'change'], [els.earnedFilter, 'change']]) {
  el.addEventListener(fn, renderList);
}
els.spoilerToggle.addEventListener('change', () => { state.spoilers = els.spoilerToggle.checked; saveState(); renderAll(); });

$('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data.earned) ? data.earned.filter((n) => byName.has(n)) : [];
    earned = new Set(names);
    state.counters = data.counters || {};
    state.notes = data.notes || {};
    if (typeof data.spoilers === 'boolean') { state.spoilers = data.spoilers; els.spoilerToggle.checked = data.spoilers; }
    saveState(); renderAll();
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all saved progress, counters and notes?')) return;
  earned = new Set(); state.counters = {}; state.notes = {};
  saveState(); renderAll();
});

function routeFromHash() {
  const m = location.hash.match(/^#\/(checklist|roadmap|missables|planner)(?:\/.*)?$/);
  const tm = location.hash.match(/^#\/trophy\/(\d+)$/);
  if (tm && byId.has(Number(tm[1]))) { selectedId = Number(tm[1]); switchView('checklist'); return; }
  if (m) { switchView(m[1]); return; }
  switchView('checklist');
}
window.addEventListener('hashchange', () => { routeFromHash(); renderAll(); });
routeFromHash();
renderAll();
