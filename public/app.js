(function(){
  const app = document.getElementById('app');

  const TIERS = { VIEWER:1, GRADER:2, ADMIN:3 };
  const TIER_LABEL = { 1:'Viewer', 2:'Instructor', 3:'Admin' };
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const ICON_FOR_TAB = { curriculum:'bookOpen', master:'file', grade:'clipboardCheck', survey:'messageSquare', analytics:'barChart3', feedback:'inbox', access:'shield' };
  const TAB_DEFS = [
    { key:'curriculum', label:'Curriculum', minTier:1 },
    { key:'master', label:'Master Document', minTier:1 },
    { key:'grade', label:'Grade Work', minTier:2 },
    { key:'survey', label:'Survey', minTier:2 },
    { key:'analytics', label:'Analytics', minTier:3 },
    { key:'feedback', label:'Instructor Feedback', minTier:3 },
    { key:'access', label:'Access', minTier:3 }
  ];
  const SUBJECT_FALLBACK = { bg:'var(--slate-100)', bd:'var(--slate-300)', bar:'var(--slate-500)' };
  const COHORT_FALLBACK = ["var(--viz-1)","var(--viz-2)","var(--viz-3)","var(--viz-4)"];

  const ICONS = {
    bookOpen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c2.2-1 5-1 8 .5 3-1.5 5.8-1.5 8-.5v13c-2.2-1-5-1-8 .5-3-1.5-5.8-1.5-8-.5Z"/><path d="M12 6v13"/></svg>',
    clipboardCheck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z"/><path d="m9 13 2.2 2.2L15.5 11"/></svg>',
    messageSquare:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4.5 4V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/></svg>',
    barChart3:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="20" x2="5" y2="11"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="19" y1="20" x2="19" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>',
    inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l2 3h4l2-3h4"/><path d="M5 4h14l3 8v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7Z"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6Z"/></svg>',
    alertTriangle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 9.5v5M12 17.5v.01"/></svg>',
    checkCircle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9.5"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    trash2:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16.5 3.5 4 4L8 20H4v-4Z"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    paperclip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12.5 12.5 20a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.3l-7.8 7.8a1.5 1.5 0 0 1-2.1-2.1L15.5 8"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    externalLink:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>',
    file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/></svg>'
  };

  // ---------------- state ----------------
  let user = null;
  let publicRoster = [];
  const D = { curriculum: [], cohorts: [], submissions: [], surveys: [], roster: [] };
  let activeTab = null;
  let currSubjectFilter = 'All';
  let currSearch = '';
  let sortCol = 'date', sortDir = 'desc';
  let studentSortCol = 'avg', studentSortDir = 'desc';
  let lastResult = null;
  let showNewUnitForm = false;
  let editingUnitId = null;
  let expandedDocId = null;
  let overridingSubId = null;
  let surveyAuthorFilter = 'All';
  let pendingUnitFile = null;
  let pendingSubFile = null;
  let masterDoc = null;
  let masterDocLoaded = false;

  // ---------------- helpers ----------------
  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function unitById(id){ return D.curriculum.find(u => u.id === id); }
  function cohortById(id){ return D.cohorts.find(c => c.id === id); }
  function cohortColor(id){ const i = D.cohorts.findIndex(c=>c.id===id); return COHORT_FALLBACK[i % COHORT_FALLBACK.length] || COHORT_FALLBACK[0]; }
  const SUBJECT_PALETTE = ['sky','plum','teal','gold','slate'];
  const subjectStyleCache = {};
  function subjectStyle(s){
    if(!subjectStyleCache[s]){
      const idx = Object.keys(subjectStyleCache).length % SUBJECT_PALETTE.length;
      const hue = SUBJECT_PALETTE[idx];
      subjectStyleCache[s] = hue === 'slate' ? SUBJECT_FALLBACK : { bg:`var(--${hue}-100)`, bd:`var(--${hue}-300)`, bar:`var(--${hue}-500)` };
    }
    return subjectStyleCache[s];
  }
  function fmtDate(d){ if(!d) return ''; const dt = new Date(String(d).slice(0,10)+"T12:00:00"); return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
  function fmtBytes(n){ return n>900000 ? (n/1e6).toFixed(1)+' MB' : Math.round(n/1000)+' KB'; }
  function statusForPct(p){
    if(p>=85) return {tone:'pass', label:'On track'};
    if(p>=65) return {tone:'caution', label:'Watch'};
    return {tone:'critical', label:'Needs support'};
  }
  function statusBadge(pct){
    const s = statusForPct(pct);
    const icon = s.tone==='pass' ? ICONS.checkCircle : ICONS.alertTriangle;
    return `<span class="badge badge-${s.tone}">${icon}${s.label}</span>`;
  }
  function effective(sub){
    if(sub.override) return { pct: sub.override.overallPct, feedback: sub.override.feedback, overridden:true, by: sub.override.by, date: sub.override.date };
    return { pct: sub.overallPct, feedback: sub.feedback, overridden:false };
  }
  function markSVG(size){
    return `<svg width="${size}" height="${size}" viewBox="0 0 30 30" fill="none" class="mark"><rect width="30" height="30" rx="8" fill="var(--navy-700)"/><path d="M7 21V9l8 7 8-7v12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function attachmentChipPending(file, onRemove){
    return `<span class="attachment-chip">${ICONS.paperclip}<span class="fname" title="${esc(file.name)}">${esc(file.name)}</span><span class="mono muted small">${fmtBytes(file.size)}</span><button type="button" data-remove-pending aria-label="Remove ${esc(file.name)}">${ICONS.x}</button></span>`;
  }
  function attachmentChipSaved(att, delUrl){
    return `<span class="attachment-chip"><a href="/api/attachments/${att.id}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;color:inherit;text-decoration:none;">${ICONS.paperclip}<span class="fname" title="${esc(att.name)}">${esc(att.name)}</span></a>${delUrl?`<button type="button" data-del-attachment="${delUrl}">${ICONS.x}</button>`:''}</span>`;
  }
  function moodleLinkHTML(url){
    if(!url) return '';
    return `<a class="moodle-link" href="${esc(url)}" target="_blank" rel="noopener">${ICONS.externalLink}Moodle</a>`;
  }

  function snapshotFormRaw(ids){
    const vals = {};
    ids.forEach(id => { const el = document.getElementById(id); if(el) vals[id] = el.value; });
    return vals;
  }
  function restoreFormRaw(vals){
    Object.keys(vals).forEach(id => { const el = document.getElementById(id); if(el) el.value = vals[id]; });
  }
  const UNIT_FORM_FIELD_IDS = ['uf-subject','uf-grade','uf-title','uf-standard','uf-duration-hours','uf-duration-minutes','uf-summary','uf-tags','uf-assignment','uf-moodle','uf-doc'];
  const GRADE_FORM_FIELD_IDS = ['gw-student','gw-unit','gw-cohort','gw-assignment','gw-text','gw-moodle'];

  function toast(msg){
    let t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ---------------- API ----------------
  async function apiJSON(method, url, body){
    const res = await fetch(url, {
      method, credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try{ data = await res.json(); }catch(e){ data = null; }
    if(!res.ok) throw Object.assign(new Error((data && data.error) || 'request_failed'), { status: res.status, code: data && data.error });
    return data;
  }
  async function apiForm(method, url, formData){
    const res = await fetch(url, { method, credentials: 'same-origin', body: formData });
    let data = null;
    try{ data = await res.json(); }catch(e){ data = null; }
    if(!res.ok) throw Object.assign(new Error((data && data.error) || 'request_failed'), { status: res.status, code: data && data.error });
    return data;
  }
  function errorToast(e, fallback){
    toast(({
      not_signed_in: 'Please sign in again.',
      insufficient_tier: "You don't have access to do that.",
      unit_not_found: 'That unit no longer exists.',
      cannot_revoke_self: "You can't revoke your own access.",
    })[e && e.code] || fallback || 'Something went wrong.');
  }

  // ---------------- Sign-in ----------------
  async function loadPublicRoster(){
    const { roster } = await apiJSON('GET', '/api/roster/public');
    publicRoster = roster;
  }
  function renderSignIn(){
    const options = publicRoster.slice().sort((a,b)=> a.name.localeCompare(b.name))
      .map(r => `<option value="${r.id}">${esc(r.name)} — ${TIER_LABEL[r.tier]}</option>`).join('');
    app.innerHTML = `
      <div class="signin-shell">
        <div class="signin-wrap">
          <div class="signin-brand">
            ${markSVG(48)}
            <h1 style="font-size:1.5rem;">GW Training Center Curriculum</h1>
            <p class="muted">Sign in to continue — your access level controls what you can see and do.</p>
          </div>
          <div class="card card-pad">
            <form id="signin-form">
              <div class="field"><label for="si-name">Your name</label>
                <select id="si-name" required><option value="" disabled selected>Choose your name…</option>${options}</select>
              </div>
              <div class="field"><label for="si-pin">PIN</label><input id="si-pin" type="password" inputmode="numeric" placeholder="••••" required></div>
              <button type="submit" class="btn btn-primary btn-md btn-full">Enter</button>
            </form>
            <p class="signin-hint">Don't see your name, or forgot your PIN? Ask an admin to add or reset you from the Access tab.</p>
          </div>
        </div>
      </div>
    `;
    document.getElementById('signin-form').addEventListener('submit', async e => {
      e.preventDefault();
      const userId = document.getElementById('si-name').value;
      const pin = document.getElementById('si-pin').value;
      try{
        const { user: u } = await apiJSON('POST', '/api/login', { userId, pin });
        user = u;
        await afterSignIn();
      }catch(err){
        toast("That name and PIN don't match.");
      }
    });
  }

  // ---------------- Shell ----------------
  function visibleTabs(){ return TAB_DEFS.filter(t => user && user.tier >= t.minTier); }
  function tabCount(key){
    if(key==='curriculum') return D.curriculum.length;
    if(key==='grade') return D.submissions.length;
    if(key==='feedback') return D.surveys.length;
    if(key==='access') return D.roster.length;
    return '';
  }
  function shellHTML(){
    const tabs = visibleTabs();
    return `
      <div class="portal">
        <nav class="sidenav">
          <div class="sidenav-header">${markSVG(30)}<div><div class="name">GW Training Center</div><div class="sub">Curriculum portal</div></div></div>
          <div class="sidenav-items">
            ${tabs.map(t => `<button class="sidenav-item" data-tab="${t.key}">${ICONS[ICON_FOR_TAB[t.key]]}<span class="label">${t.label}</span><span class="count">${tabCount(t.key)}</span></button>`).join('')}
          </div>
          <div class="sidenav-footer">
            <div class="avatar">${esc(user.name.slice(0,1))}</div>
            <div class="who"><span class="who-name">${esc(user.name)}</span><span class="who-tier">${TIER_LABEL[user.tier]}</span></div>
            <button class="switch-link" id="switch-user-btn">Switch</button>
          </div>
        </nav>
        <div class="main-col">
          <header class="topbar-portal">
            <div><div class="crumb">GW Training Center Curriculum</div><h2 id="page-title"></h2></div>
            <span class="status-pill"><span class="dot"></span> Live — real accounts &amp; database</span>
          </header>
          <main class="scroll"><div class="content-max">
            ${tabs.map(t => `<div class="view" id="${t.key}-view" style="display:none;"></div>`).join('')}
            <div class="footnote">${ICONS.checkCircle}<span>This is the real, deployed version — curriculum, grades, surveys, and access changes are saved to a live database, not just this screen.</span></div>
          </div></main>
        </div>
      </div>
    `;
  }

  async function afterSignIn(){
    await Promise.all([
      apiJSON('GET', '/api/curriculum').then(r => D.curriculum = r.units),
      apiJSON('GET', '/api/cohorts').then(r => D.cohorts = r.cohorts)
    ]);
    boot();
  }

  function boot(){
    if(!user){ renderSignIn(); return; }
    app.innerHTML = shellHTML();
    document.getElementById('switch-user-btn').addEventListener('click', async () => {
      await apiJSON('POST', '/api/logout');
      user = null;
      await loadPublicRoster();
      boot();
    });
    document.querySelectorAll('.sidenav-item').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.tab; rerenderAll(); });
    });
    rerenderAll();
  }

  async function rerender(which){
    const el = document.getElementById(which+'-view');
    if(!el) return;
    if(which==='curriculum'){ el.innerHTML = renderCurriculum(); wireCurriculum(); }
    if(which==='master'){ await ensureMaster(); el.innerHTML = renderMasterDoc(); wireMasterDoc(); }
    if(which==='grade'){ await ensureSubmissions(); el.innerHTML = renderGradeWork(); wireGradeWork(); }
    if(which==='survey'){ el.innerHTML = renderSurvey(); wireSurvey(); }
    if(which==='analytics'){ await ensureAnalytics(); el.innerHTML = renderAnalytics(); wireAnalytics(); }
    if(which==='feedback'){ await ensureSurveys(); el.innerHTML = renderFeedback(); wireFeedback(); }
    if(which==='access'){ await ensureRoster(); el.innerHTML = renderAccess(); wireAccess(); }
  }
  async function ensureMaster(){ const r = await apiJSON('GET','/api/master'); masterDoc = r.document; masterDocLoaded = true; }
  async function ensureSubmissions(){ const r = await apiJSON('GET','/api/submissions'); D.submissions = r.submissions; }
  async function ensureAnalytics(){ const r = await apiJSON('GET','/api/analytics'); D.submissions = r.submissions; D.curriculum = D.curriculum.length ? D.curriculum : r.units; }
  async function ensureSurveys(){ const r = await apiJSON('GET','/api/surveys'); D.surveys = r.surveys.map(s => ({ id:s.id, author:s.author, date:s.survey_date, wentWell:s.went_well, didntGoWell:s.didnt_go_well, feedback:s.feedback })); }
  async function ensureRoster(){ const r = await apiJSON('GET','/api/roster'); D.roster = r.roster; }

  async function rerenderAll(){
    const tabs = visibleTabs();
    if(!tabs.find(t=>t.key===activeTab)) activeTab = tabs[0] ? tabs[0].key : null;
    document.querySelectorAll('.sidenav-item').forEach(b => b.classList.toggle('active', b.dataset.tab===activeTab));
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const activeDef = TAB_DEFS.find(t=>t.key===activeTab);
    const titleEl = document.getElementById('page-title');
    if(titleEl && activeDef) titleEl.textContent = activeDef.label;
    if(activeTab){ const el = document.getElementById(activeTab+'-view'); if(el) el.style.display = 'block'; }
    for(const t of tabs) await rerender(t.key);
  }

  // ---------------- Curriculum ----------------
  function formatDuration(u){
    const h = u.durationHours || 0, m = u.durationMinutes || 0;
    if(!h && !m) return null;
    const parts = [];
    if(h) parts.push(`${h} hr`);
    if(m) parts.push(`${m} min`);
    return parts.join(' ');
  }
  function unitFormHTML(unit){
    const u = unit || { subject:'', grade:null, title:'', standard:'', durationHours:0, durationMinutes:0, summary:'', tags:[], assignment:'', doc:'', moodleUrl:'', attachments:[] };
    const isEdit = !!unit;
    return `
      <form id="unit-form" class="card card-pad" style="margin-bottom:16px;">
        <h3 style="margin-bottom:14px;">${isEdit?'Edit unit':'New curriculum unit'}</h3>
        <div class="field-row">
          <div class="field"><label>Subject</label><input id="uf-subject" value="${esc(u.subject)}" required></div>
          <div class="field"><label>Grade / level (optional)</label><input id="uf-grade" type="number" min="0" max="20" value="${u.grade ?? ''}" placeholder="e.g. 6"></div>
        </div>
        <div class="field"><label>Unit title</label><input id="uf-title" value="${esc(u.title)}" required></div>
        <div class="field-row">
          <div class="field"><label>Standard / cert code</label><input id="uf-standard" value="${esc(u.standard)}"></div>
          <div class="field">
            <label>Duration</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="uf-duration-hours" type="number" min="0" max="999" value="${u.durationHours || 0}" style="width:88px;" aria-label="Hours">
              <span class="small muted">hr</span>
              <input id="uf-duration-minutes" type="number" min="0" max="59" value="${u.durationMinutes || 0}" style="width:88px;" aria-label="Minutes">
              <span class="small muted">min</span>
            </div>
          </div>
        </div>
        <div class="field"><label>Summary</label><textarea id="uf-summary" required>${esc(u.summary)}</textarea></div>
        <div class="field"><label>Keywords (comma-separated — used by the grading heuristic)</label><input id="uf-tags" value="${esc((u.tags||[]).join(', '))}"></div>
        <div class="field"><label>Default assignment title</label><input id="uf-assignment" value="${esc(u.assignment)}"></div>
        <div class="field"><label>Moodle course link (optional)</label><input id="uf-moodle" type="url" placeholder="https://…" value="${esc(u.moodleUrl||'')}"></div>
        <div class="field"><label>Curriculum document / lesson plan (text)</label><textarea id="uf-doc" style="min-height:110px;">${esc(u.doc||'')}</textarea></div>
        <div class="field">
          <label>Attach a document (PDF, image, or text — max 5 MB)</label>
          <div class="file-drop"><input type="file" id="uf-file"></div>
          ${pendingUnitFile ? `<div class="attachment-row">${attachmentChipPending(pendingUnitFile)}</div>` : ''}
          ${(isEdit && u.attachments && u.attachments.length) ? `<div class="attachment-row">${u.attachments.map(a=>attachmentChipSaved(a, `/api/curriculum/${u.id}/attachments/${a.id}`)).join('')}</div>` : ''}
        </div>
        <div style="display:flex; gap:10px; margin-top:6px;">
          <button type="submit" class="btn btn-secondary btn-md">${isEdit?'Save changes':'Add unit'}</button>
          <button type="button" class="btn btn-outline btn-md" id="unit-form-cancel">Cancel</button>
        </div>
      </form>
    `;
  }
  function filteredCurriculum(){
    return D.curriculum.filter(u => {
      if(currSubjectFilter !== 'All' && u.subject !== currSubjectFilter) return false;
      if(!currSearch) return true;
      const hay = `${u.title} ${u.standard} ${(u.tags||[]).join(' ')}`.toLowerCase();
      return hay.includes(currSearch.toLowerCase());
    });
  }
  function renderCurriculum(){
    const subjects = ['All', ...Array.from(new Set(D.curriculum.map(u=>u.subject)))];
    const list = filteredCurriculum();
    const isAdmin = user.tier >= TIERS.ADMIN;
    const canGrade = user.tier >= TIERS.GRADER;
    return `
      <div class="toolbar">
        <input class="search-input" id="curr-search" type="text" placeholder="Search units, standards, or keywords…" value="${esc(currSearch)}">
        <div class="chip-row" id="subject-chips">
          ${subjects.map(s => `<button class="chip ${s===currSubjectFilter?'active':''}" data-subject="${esc(s)}">${esc(s)}</button>`).join('')}
        </div>
      </div>
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;">
        <h2>Curriculum library</h2>
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="small muted">${list.length} of ${D.curriculum.length} unit${D.curriculum.length===1?'':'s'}</span>
          ${isAdmin ? `<button class="btn btn-secondary btn-sm" id="new-unit-btn">${ICONS.plus}${showNewUnitForm?'Close form':'New unit'}</button>` : ''}
        </div>
      </div>
      ${isAdmin && showNewUnitForm ? unitFormHTML(null) : ''}
      <div class="curr-grid">
        ${list.map(u => {
          const st = subjectStyle(u.subject);
          return `
          <div class="card card-pad unit-card">
            ${editingUnitId===u.id ? unitFormHTML(u) : `
            <div class="tags" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <span class="subject-tag" style="background:${st.bg};border-color:${st.bd};color:var(--text-heading);">${esc(u.subject)}</span>
              ${(u.grade !== null && u.grade !== undefined) ? `<span class="tag" style="padding:2px 8px;">Level ${u.grade}</span>` : ''}
            </div>
            <h3>${esc(u.title)}</h3>
            <div class="standard">${[esc(u.standard), formatDuration(u)].filter(Boolean).join(' · ')}</div>
            <div class="summary">${esc(u.summary)}</div>
            ${expandedDocId===u.id ? `<div class="doc-box">${esc(u.doc||'No document on file yet.')}</div>` : ''}
            ${(u.attachments&&u.attachments.length) ? `<div class="attachment-row">${u.attachments.map(a=>attachmentChipSaved(a)).join('')}</div>` : ''}
            <div class="foot">
              <span class="small muted">${esc(u.assignment)}</span>
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                ${u.moodleUrl ? moodleLinkHTML(u.moodleUrl) : ''}
                <button class="link-btn" data-doc-toggle="${u.id}">${expandedDocId===u.id?'Hide document':'View document'}</button>
                ${canGrade ? `<button class="link-btn" data-grade-unit="${u.id}">Grade work →</button>` : ''}
              </div>
            </div>
            ${isAdmin ? `<div class="admin-row"><button class="link-btn" data-edit-unit="${u.id}">${ICONS.pencil}Edit</button><button class="link-btn danger" data-delete-unit="${u.id}">${ICONS.trash2}Delete</button></div>` : ''}
            `}
          </div>
        `;}).join('') || `<p class="muted">No units match that search.</p>`}
      </div>
    `;
  }
  function unitFormData(){
    const fd = new FormData();
    fd.append('subject', document.getElementById('uf-subject').value.trim() || 'General');
    fd.append('grade', document.getElementById('uf-grade').value);
    fd.append('title', document.getElementById('uf-title').value.trim());
    fd.append('standard', document.getElementById('uf-standard').value.trim());
    fd.append('durationHours', document.getElementById('uf-duration-hours').value || '0');
    fd.append('durationMinutes', document.getElementById('uf-duration-minutes').value || '0');
    fd.append('summary', document.getElementById('uf-summary').value.trim());
    fd.append('tags', document.getElementById('uf-tags').value);
    fd.append('assignment', document.getElementById('uf-assignment').value.trim());
    fd.append('moodleUrl', document.getElementById('uf-moodle').value.trim());
    fd.append('doc', document.getElementById('uf-doc').value.trim());
    if(pendingUnitFile) fd.append('file', pendingUnitFile);
    return fd;
  }
  function wireCurriculum(){
    const search = document.getElementById('curr-search');
    if(search) search.addEventListener('input', e => { currSearch = e.target.value; rerender('curriculum'); const el=document.getElementById('curr-search'); if(el){ el.focus(); el.selectionStart=el.selectionEnd=el.value.length; } });
    document.querySelectorAll('#subject-chips [data-subject]').forEach(btn => {
      btn.addEventListener('click', () => { currSubjectFilter = btn.dataset.subject; rerender('curriculum'); });
    });
    document.querySelectorAll('[data-grade-unit]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = 'grade';
        rerenderAll().then(() => { const sel = document.getElementById('gw-unit'); if(sel) sel.value = btn.dataset.gradeUnit; });
      });
    });
    document.querySelectorAll('[data-doc-toggle]').forEach(btn => {
      btn.addEventListener('click', () => { expandedDocId = expandedDocId===btn.dataset.docToggle ? null : btn.dataset.docToggle; rerender('curriculum'); });
    });
    const newBtn = document.getElementById('new-unit-btn');
    if(newBtn) newBtn.addEventListener('click', () => { showNewUnitForm = !showNewUnitForm; editingUnitId = null; pendingUnitFile = null; rerender('curriculum'); });
    document.querySelectorAll('[data-edit-unit]').forEach(btn => {
      btn.addEventListener('click', () => { editingUnitId = parseInt(btn.dataset.editUnit,10); showNewUnitForm = false; pendingUnitFile = null; rerender('curriculum'); });
    });
    document.querySelectorAll('[data-delete-unit]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = unitById(parseInt(btn.dataset.deleteUnit,10));
        if(!u) return;
        if(!confirm(`Delete "${u.title}"? This can't be undone.`)) return;
        try{
          await apiJSON('DELETE', `/api/curriculum/${u.id}`);
          D.curriculum = D.curriculum.filter(x => x.id !== u.id);
          toast('Unit deleted.');
          rerender('curriculum');
        }catch(e){ errorToast(e); }
      });
    });
    document.querySelectorAll('[data-del-attachment]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try{
          await apiJSON('DELETE', btn.dataset.delAttachment);
          const r = await apiJSON('GET', '/api/curriculum'); D.curriculum = r.units;
          toast('Attachment removed.');
          rerender('curriculum');
        }catch(e){ errorToast(e); }
      });
    });
    const fileInput = document.getElementById('uf-file');
    if(fileInput){
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if(!file) return;
        if(file.size > MAX_FILE_BYTES){ toast('That file is too large (max 5 MB).'); fileInput.value=''; return; }
        pendingUnitFile = file;
        const snap = snapshotFormRaw(UNIT_FORM_FIELD_IDS);
        await rerender('curriculum');
        restoreFormRaw(snap);
      });
    }
    document.querySelectorAll('#curriculum-view [data-remove-pending]').forEach(btn => {
      btn.addEventListener('click', async () => {
        pendingUnitFile = null;
        const snap = snapshotFormRaw(UNIT_FORM_FIELD_IDS);
        await rerender('curriculum');
        restoreFormRaw(snap);
      });
    });
    const form = document.getElementById('unit-form');
    if(form){
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const title = document.getElementById('uf-title').value.trim();
        const summary = document.getElementById('uf-summary').value.trim();
        if(!title || !summary){ toast('Give the unit a title and summary first.'); return; }
        try{
          const fd = unitFormData();
          if(editingUnitId){
            const { unit } = await apiForm('PUT', `/api/curriculum/${editingUnitId}`, fd);
            const idx = D.curriculum.findIndex(x => x.id === editingUnitId);
            if(idx>-1) D.curriculum[idx] = unit;
            toast('Unit updated.');
            editingUnitId = null;
          } else {
            const { unit } = await apiForm('POST', '/api/curriculum', fd);
            D.curriculum.push(unit);
            toast('Unit added.');
            showNewUnitForm = false;
          }
          pendingUnitFile = null;
          const r2 = await apiJSON('GET', '/api/curriculum'); D.curriculum = r2.units;
          rerender('curriculum');
        }catch(err){ errorToast(err, "Couldn't save that unit."); }
      });
      const cancel = document.getElementById('unit-form-cancel');
      if(cancel) cancel.addEventListener('click', () => { editingUnitId = null; showNewUnitForm = false; pendingUnitFile = null; rerender('curriculum'); });
    }
  }

  // ---------------- Master Document ----------------
  function fmtDateTime(iso){
    if(!iso) return '';
    return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' });
  }
  function renderMasterDoc(){
    const isAdmin = user.tier >= TIERS.ADMIN;
    return `
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;">
        <h2>Curriculum master document</h2>
        <span class="small muted">The single source of truth — everyone with access can view or download it</span>
      </div>
      <div class="card card-pad" style="max-width:640px;">
        ${masterDoc ? `
          <div class="attachment-row" style="margin-bottom:10px;">${attachmentChipSaved({ id: masterDoc.id, name: masterDoc.filename })}</div>
          <p class="small muted">Uploaded by ${esc(masterDoc.uploadedBy || 'Unknown')} · ${fmtDateTime(masterDoc.uploadedAt)}</p>
        ` : `<p class="muted">No master document has been uploaded yet.</p>`}
        ${isAdmin ? `
          <form id="master-form" style="margin-top:${masterDoc?'20px':'6px'};">
            <div class="field">
              <label>${masterDoc ? 'Upload a new version (replaces the current file)' : 'Upload the master document'}</label>
              <div class="file-drop"><input type="file" id="mf-file" required></div>
            </div>
            <div style="display:flex; gap:10px; margin-top:6px;">
              <button type="submit" class="btn btn-secondary btn-md">${masterDoc ? 'Upload new version' : 'Upload'}</button>
              ${masterDoc ? `<button type="button" class="btn btn-outline btn-md" id="master-remove-btn">Remove</button>` : ''}
            </div>
          </form>
        ` : ''}
      </div>
    `;
  }
  function wireMasterDoc(){
    const form = document.getElementById('master-form');
    if(form) form.addEventListener('submit', async e => {
      e.preventDefault();
      const fileInput = document.getElementById('mf-file');
      const file = fileInput.files[0];
      if(!file){ toast('Choose a file first.'); return; }
      if(file.size > MAX_FILE_BYTES){ toast('That file is larger than 5 MB.'); return; }
      const fd = new FormData();
      fd.append('file', file);
      try{
        const { document: doc } = await apiForm('POST', '/api/master', fd);
        masterDoc = doc;
        toast('Master document updated.');
        rerender('master');
      }catch(err){ errorToast(err, "Couldn't upload that file."); }
    });
    const removeBtn = document.getElementById('master-remove-btn');
    if(removeBtn) removeBtn.addEventListener('click', async () => {
      if(!confirm('Remove the master document? This can\'t be undone.')) return;
      try{
        await apiJSON('DELETE', '/api/master');
        masterDoc = null;
        toast('Master document removed.');
        rerender('master');
      }catch(err){ errorToast(err); }
    });
  }

  // ---------------- Grade Work ----------------
  function renderResult(res){
    return `
      ${res.rubric.map(c => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:var(--fs-body-sm);font-weight:var(--fw-semibold);margin-bottom:5px;"><span>${esc(c.criterion)}</span><span class="mono">${c.score}/${c.max}</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${c.score/c.max*100}%"></div></div>
          <div class="small muted" style="margin-top:4px;">${esc(c.note)}</div>
        </div>
      `).join('')}
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border-subtle);margin-top:6px;">
        <div><div class="small muted">Overall</div><div class="mono" style="font-size:1.6rem;">${res.overall}/${res.overallMax} <span style="font-size:0.95rem;color:var(--text-muted);">(${res.overallPct}%)</span></div></div>
        ${statusBadge(res.overallPct)}
      </div>
      <div class="small" style="background:var(--surface-sunken);border-radius:var(--radius-md);padding:12px 14px;color:var(--text-body);margin-top:12px;">${esc(res.feedback)}</div>
      <div class="small muted" style="margin-top:10px;">Saved to the gradebook.</div>
    `;
  }
  function renderGradeWork(){
    const units = D.curriculum;
    const isAdmin = user.tier >= TIERS.ADMIN;
    let rows = D.submissions.slice();
    rows.sort((a,b) => {
      let av = sortCol==='date' ? a.date : sortCol==='student' ? a.student : effective(a).pct;
      let bv = sortCol==='date' ? b.date : sortCol==='student' ? b.student : effective(b).pct;
      if(av<bv) return sortDir==='asc'?-1:1;
      if(av>bv) return sortDir==='asc'?1:-1;
      return 0;
    });
    return `
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;"><h2>Grade student work</h2><span class="small muted">${D.submissions.length} graded so far</span></div>
      <div style="display:grid; grid-template-columns:minmax(300px,1fr) minmax(320px,1.1fr); gap:20px; align-items:start;">
        <div class="card card-pad">
          <div class="alert alert-caution" style="margin-bottom:16px;">${ICONS.alertTriangle}<div><div class="alert-title">Prototype grading model</div><div class="alert-body">Scores below come from a lightweight heuristic, not a live Claude call — it shows the workflow shape while the real thing gets wired up. An admin can override any grade if it looks off.</div></div></div>
          <form id="grade-form">
            <div class="field"><label for="gw-student">Student name</label><input id="gw-student" type="text" placeholder="e.g. Jordan Kim" required></div>
            <div class="field-row">
              <div class="field"><label for="gw-unit">Unit</label>
                <select id="gw-unit" required><option value="" disabled selected>Choose a unit…</option>${units.map(u => `<option value="${u.id}">${esc(u.subject)}${(u.grade!==null&&u.grade!==undefined)?' · Level '+u.grade:''} — ${esc(u.title)}</option>`).join('')}</select>
              </div>
              <div class="field"><label for="gw-cohort">Cohort</label>
                <select id="gw-cohort" required><option value="" disabled selected>Choose a cohort…</option>${D.cohorts.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
              </div>
            </div>
            <div class="field"><label for="gw-assignment">Assignment title</label><input id="gw-assignment" type="text" placeholder="Pulled from the unit, or edit it"></div>
            <div class="field"><label for="gw-text">Submission text (or attach a file below)</label><textarea id="gw-text" placeholder="Paste or type the student's response here…" style="min-height:120px;"></textarea></div>
            <div class="field">
              <label>Attach the student's work (optional — PDF, image, or doc, max 5 MB)</label>
              <div class="file-drop"><input type="file" id="gw-file"></div>
              ${pendingSubFile ? `<div class="attachment-row">${attachmentChipPending(pendingSubFile)}</div>` : ''}
            </div>
            <div class="field"><label for="gw-moodle">Moodle gradebook link (optional)</label><input id="gw-moodle" type="url" placeholder="https://…"></div>
            <button type="submit" class="btn btn-primary btn-md">Run AI-assisted grading</button>
          </form>
        </div>
        <div class="card card-pad" id="result-panel">
          ${lastResult ? renderResult(lastResult) : `<p class="muted" style="text-align:center;padding:40px 20px;">Grade a submission to see the rubric breakdown here — results are ready right away.</p>`}
        </div>
      </div>
      <div class="card-header" style="background:none;border:none;padding:28px 0 14px;"><h2>Gradebook</h2><span class="small muted">Click a column to sort${isAdmin?' · admins can override a grade':''}</span></div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th><button data-sort="date">Date</button></th>
          <th><button data-sort="student">Student</button></th>
          <th>Unit</th><th>Cohort</th>
          <th><button data-sort="pct">Score</button></th>
          <th>Status</th><th>Links</th>${isAdmin?'<th>Actions</th>':''}
        </tr></thead>
        <tbody>${rows.map(r => submissionRowsHTML(r, isAdmin, units.length + (isAdmin?1:0) + 5)).join('')}</tbody>
      </table></div>
    `;
  }
  function submissionRowsHTML(r, isAdmin, cols){
    const unit = unitById(r.unitId);
    const eff = effective(r);
    let out = `<tr>
      <td class="mono">${fmtDate(r.date)}</td><td>${esc(r.student)}</td>
      <td>${esc(unit ? unit.title : '—')}</td>
      <td>${esc(cohortById(r.cohort) ? cohortById(r.cohort).name : r.cohort)}</td>
      <td class="mono">${eff.pct}%${eff.overridden?` ${ICONS.pencil}`:''}</td>
      <td>${statusBadge(eff.pct)}</td>
      <td style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">${r.attachment?attachmentChipSaved(r.attachment):''}${moodleLinkHTML(r.moodleUrl)}</td>
      ${isAdmin ? `<td><button class="link-btn" data-override="${r.id}">${overridingSubId===r.id?'Close':'Override'}</button></td>` : ''}
    </tr>`;
    if(isAdmin && overridingSubId===r.id){
      out += `<tr class="override-row"><td colspan="8">
        <form class="override-form" data-override-form="${r.id}">
          ${eff.overridden ? `<span class="small muted">Currently overridden by ${esc(eff.by)} on ${fmtDate(eff.date)}</span>` : `<span class="small muted">AI-assisted score: ${r.overallPct}%</span>`}
          <div class="field"><label>New score (%)</label><input type="number" min="0" max="100" name="pct" value="${eff.pct}"></div>
          <div class="field" style="flex:1;"><label>Feedback</label><textarea name="feedback">${esc(eff.feedback)}</textarea></div>
          <div class="field"><label>Moodle link</label><input type="url" name="moodle" value="${esc(r.moodleUrl||'')}" placeholder="https://…"></div>
          <button type="submit" class="btn btn-secondary btn-sm">Save override</button>
          ${eff.overridden ? `<button type="button" class="btn btn-outline btn-sm" data-clear-override="${r.id}">Revert to AI score</button>` : ''}
        </form>
      </td></tr>`;
    }
    return out;
  }
  function submissionFormData(){
    const fd = new FormData();
    fd.append('student', document.getElementById('gw-student').value.trim());
    fd.append('unitId', document.getElementById('gw-unit').value);
    fd.append('cohortId', document.getElementById('gw-cohort').value);
    fd.append('assignment', document.getElementById('gw-assignment').value.trim());
    fd.append('text', document.getElementById('gw-text').value.trim());
    fd.append('moodleUrl', document.getElementById('gw-moodle').value.trim());
    if(pendingSubFile) fd.append('file', pendingSubFile);
    return fd;
  }
  function wireGradeWork(){
    const isAdmin = user.tier >= TIERS.ADMIN;
    const form = document.getElementById('grade-form');
    if(form){
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const student = document.getElementById('gw-student').value.trim();
        const unitId = document.getElementById('gw-unit').value;
        const cohort = document.getElementById('gw-cohort').value;
        const text = document.getElementById('gw-text').value.trim();
        if(!unitId || !cohort || !student || (!text && !pendingSubFile)){ toast('Fill in student, unit, cohort, and either submission text or an attachment.'); return; }
        try{
          const fd = submissionFormData();
          const { submission } = await apiForm('POST', '/api/submissions', fd);
          lastResult = submission;
          D.submissions.unshift(submission);
          pendingSubFile = null;
          toast('Graded and saved to the gradebook.');
          rerender('grade');
        }catch(err){ errorToast(err, "Couldn't grade that submission."); }
      });
    }
    const fileInput = document.getElementById('gw-file');
    if(fileInput){
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if(!file) return;
        if(file.size > MAX_FILE_BYTES){ toast('That file is too large (max 5 MB).'); fileInput.value=''; return; }
        pendingSubFile = file;
        const snap = snapshotFormRaw(GRADE_FORM_FIELD_IDS);
        await rerender('grade');
        restoreFormRaw(snap);
      });
    }
    document.querySelectorAll('#grade-view [data-remove-pending]').forEach(btn => {
      btn.addEventListener('click', async () => {
        pendingSubFile = null;
        const snap = snapshotFormRaw(GRADE_FORM_FIELD_IDS);
        await rerender('grade');
        restoreFormRaw(snap);
      });
    });
    document.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.sort;
        if(sortCol===key){ sortDir = sortDir==='asc'?'desc':'asc'; } else { sortCol = key; sortDir = 'desc'; }
        rerender('grade');
      });
    });
    if(isAdmin){
      document.querySelectorAll('[data-override]').forEach(btn => {
        btn.addEventListener('click', () => { overridingSubId = overridingSubId===parseInt(btn.dataset.override,10) ? null : parseInt(btn.dataset.override,10); rerender('grade'); });
      });
      document.querySelectorAll('[data-override-form]').forEach(f => {
        f.addEventListener('submit', async e => {
          e.preventDefault();
          const id = parseInt(f.dataset.overrideForm,10);
          const pct = Math.max(0, Math.min(100, parseInt(f.pct.value,10) || 0));
          try{
            const { submission } = await apiJSON('PUT', `/api/submissions/${id}/override`, { pct, feedback: f.feedback.value.trim(), moodleUrl: f.moodle.value.trim() });
            const idx = D.submissions.findIndex(s => s.id === id);
            if(idx>-1) D.submissions[idx] = submission;
            overridingSubId = null;
            toast('Grade overridden.');
            rerender('grade');
          }catch(err){ errorToast(err); }
        });
      });
      document.querySelectorAll('[data-clear-override]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.dataset.clearOverride,10);
          try{
            const { submission } = await apiJSON('DELETE', `/api/submissions/${id}/override`);
            const idx = D.submissions.findIndex(s => s.id === id);
            if(idx>-1) D.submissions[idx] = submission;
            overridingSubId = null;
            toast('Reverted to AI score.');
            rerender('grade');
          }catch(err){ errorToast(err); }
        });
      });
    }
  }

  // ---------------- Survey ----------------
  function surveyCardHTML(s){
    return `<div class="card card-pad survey-card">
      <div class="meta"><span class="author">${esc(s.author)}</span><span class="date">${fmtDate(s.date)}</span></div>
      <div class="block"><div class="k">Went well</div><div class="v">${esc(s.wentWell)}</div></div>
      <div class="block"><div class="k">Didn't go well</div><div class="v">${esc(s.didntGoWell)}</div></div>
      ${s.feedback ? `<div class="block"><div class="k">Feedback</div><div class="v">${esc(s.feedback)}</div></div>` : ''}
    </div>`;
  }
  function renderSurvey(){
    return `
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;"><h2>Post-day check-in</h2><span class="small muted">Goes straight to admins</span></div>
      <div class="card card-pad survey-form">
        <form id="survey-form">
          <div class="field"><label for="sv-well">What went well today?</label><textarea id="sv-well" required></textarea></div>
          <div class="field"><label for="sv-notwell">What didn't go well?</label><textarea id="sv-notwell" required></textarea></div>
          <div class="field"><label for="sv-feedback">Anything else you'd like to share?</label><textarea id="sv-feedback"></textarea></div>
          <button type="submit" class="btn btn-primary btn-md">Submit check-in</button>
        </form>
      </div>
    `;
  }
  function wireSurvey(){
    const form = document.getElementById('survey-form');
    if(form) form.addEventListener('submit', async e => {
      e.preventDefault();
      try{
        await apiJSON('POST', '/api/surveys', {
          wentWell: document.getElementById('sv-well').value.trim(),
          didntGoWell: document.getElementById('sv-notwell').value.trim(),
          feedback: document.getElementById('sv-feedback').value.trim()
        });
        toast('Check-in submitted — thanks!');
        form.reset();
      }catch(err){ errorToast(err); }
    });
  }

  // ---------------- Instructor Feedback ----------------
  function renderFeedback(){
    const authors = ['All', ...Array.from(new Set(D.surveys.map(s=>s.author)))];
    const list = D.surveys.filter(s => surveyAuthorFilter==='All' || s.author===surveyAuthorFilter);
    return `
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;"><h2>Instructor feedback</h2><span class="small muted">${D.surveys.length} check-in${D.surveys.length===1?'':'s'} on file</span></div>
      <div class="chip-row" id="author-chips" style="margin-bottom:16px;">${authors.map(a => `<button class="chip ${a===surveyAuthorFilter?'active':''}" data-author="${esc(a)}">${esc(a)}</button>`).join('')}</div>
      <div class="survey-list">${list.length ? list.map(s => surveyCardHTML(s)).join('') : `<p class="muted">No check-ins yet.</p>`}</div>
    `;
  }
  function wireFeedback(){
    document.querySelectorAll('#author-chips [data-author]').forEach(btn => {
      btn.addEventListener('click', () => { surveyAuthorFilter = btn.dataset.author; rerender('feedback'); });
    });
  }

  // ---------------- Analytics ----------------
  function renderAnalytics(){
    const subs = D.submissions;
    const avg = subs.length ? Math.round(subs.reduce((a,s)=>a+effective(s).pct,0)/subs.length) : 0;
    const unitsCovered = new Set(subs.map(s=>s.unitId)).size;
    const students = new Set(subs.map(s=>s.student)).size;
    const belowStandard = subs.filter(s=>effective(s).pct<65).length;
    const overriddenCount = subs.filter(s=>s.override).length;
    return `
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;"><h2>Performance analytics</h2><span class="small muted">Based on ${subs.length} graded submission${subs.length===1?'':'s'}${overriddenCount?` · ${overriddenCount} overridden by an admin`:''}</span></div>
      <div class="stat-row">
        <div class="card card-pad stat-tile"><div class="eyebrow">Class average</div><div class="value">${avg}%</div><div class="sub">across all graded work</div></div>
        <div class="card card-pad stat-tile"><div class="eyebrow">Submissions graded</div><div class="value">${subs.length}</div><div class="sub">${students} student${students===1?'':'s'} tracked</div></div>
        <div class="card card-pad stat-tile"><div class="eyebrow">Units covered</div><div class="value">${unitsCovered}</div><div class="sub">of ${D.curriculum.length} in the library</div></div>
        <div class="card card-pad stat-tile"><div class="eyebrow">Needs attention</div><div class="value">${belowStandard}</div><div class="sub warn">submissions below 65%</div></div>
      </div>
      <div class="chart-grid">
        <div class="card card-pad"><h3>Average score by unit</h3><div class="chart-hint">Higher bars mean stronger class performance in that unit</div>${renderUnitBars()}</div>
        <div class="card card-pad"><h3>Score trend over time</h3><div class="chart-hint">Average score on each day work was graded</div>${renderTrendChart()}</div>
      </div>
      <div class="chart-grid">
        <div class="card card-pad"><h3>Score distribution</h3><div class="chart-hint">How graded submissions spread across performance bands</div>${renderHistogram()}</div>
        <div class="card card-pad"><h3>Per-student summary</h3><div class="chart-hint">Click a column to sort</div>${renderStudentTable()}</div>
      </div>
      <div class="card-header" style="background:none;border:none;padding:8px 0 14px;"><h2>Compare cohorts</h2><span class="small muted">Side-by-side performance across ${D.cohorts.length} cohorts</span></div>
      ${renderCohortCompare()}
    `;
  }
  function renderUnitBars(){
    const bySubj = {}; D.curriculum.forEach(u => { bySubj[u.id] = u; });
    const agg = {};
    D.submissions.forEach(s => { if(!agg[s.unitId]) agg[s.unitId] = { sum:0, n:0 }; agg[s.unitId].sum += effective(s).pct; agg[s.unitId].n += 1; });
    let rows = Object.keys(agg).map(id => ({ unit: bySubj[id], avg: agg[id].sum/agg[id].n })).filter(r=>r.unit);
    rows.sort((a,b) => b.avg - a.avg);
    if(!rows.length) return `<p class="muted small">No graded work yet.</p>`;
    const subjectsUsed = Array.from(new Set(rows.map(r=>r.unit.subject)));
    return `
      ${rows.map(r => `<div class="bar-row"><div class="name">${esc(r.unit.title)}</div><div class="track"><div class="fill" style="width:${r.avg}%; background:${subjectStyle(r.unit.subject).bar}"></div></div><div class="val mono">${Math.round(r.avg)}%</div></div>`).join('')}
      <div class="legend">${subjectsUsed.map(s => `<span class="legend-item"><span class="legend-swatch" style="background:${subjectStyle(s).bar}"></span>${esc(s)}</span>`).join('')}</div>
    `;
  }
  function renderTrendChart(){
    const subs = D.submissions.slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    if(subs.length < 2) return `<p class="muted small">Not enough graded work yet for a trend.</p>`;
    const byDate = {};
    subs.forEach(s => { const key = String(s.date).slice(0,10); (byDate[key] = byDate[key]||[]).push(effective(s).pct); });
    const dates = Object.keys(byDate).sort();
    const points = dates.map(d => ({ date:d, avg: byDate[d].reduce((a,b)=>a+b,0)/byDate[d].length }));
    const W = 480, H = 190, padL = 34, padR = 12, padT = 14, padB = 26;
    const xs = points.map((p,i) => padL + i*((W-padL-padR) / Math.max(1,points.length-1)));
    const yFor = v => padT + (100 - v)/100 * (H-padT-padB);
    const ys = points.map(p => yFor(p.avg));
    const line = xs.map((x,i)=> `${i===0?'M':'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const area = `M ${xs[0].toFixed(1)} ${(H-padB).toFixed(1)} ` + xs.map((x,i)=>`L ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ') + ` L ${xs[xs.length-1].toFixed(1)} ${(H-padB).toFixed(1)} Z`;
    const gridLines = [0,25,50,75,100].map(v => `<line x1="${padL}" x2="${W-padR}" y1="${yFor(v).toFixed(1)}" y2="${yFor(v).toFixed(1)}" stroke="var(--border-subtle)" stroke-width="1"/><text x="${padL-6}" y="${(yFor(v)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--text-muted)">${v}</text>`).join('');
    const lastX = xs[xs.length-1], lastY = ys[ys.length-1];
    const dots = xs.map((x,i)=> `<circle class="trend-dot" data-i="${i}" cx="${x.toFixed(1)}" cy="${ys[i].toFixed(1)}" r="9" fill="transparent"/>`).join('');
    return `<div class="chart-svg-wrap"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Average score trend over time">${gridLines}<path d="${area}" fill="var(--blue-500)" opacity="0.14"/><path d="${line}" fill="none" stroke="var(--blue-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4" fill="var(--blue-500)" stroke="var(--surface-card)" stroke-width="2"/>${dots}</svg><div class="tooltip" id="trend-tip"></div></div>`;
  }
  function wireTrendChart(){
    const svg = document.querySelector('#analytics-view .chart-svg-wrap svg');
    const tip = document.getElementById('trend-tip');
    if(!svg || !tip) return;
    const subs = D.submissions.slice().sort((a,b)=> a.date < b.date ? -1 : 1);
    const byDate = {};
    subs.forEach(s => { const key = String(s.date).slice(0,10); (byDate[key] = byDate[key]||[]).push(effective(s).pct); });
    const dates = Object.keys(byDate).sort();
    const points = dates.map(d => ({ date:d, avg: byDate[d].reduce((a,b)=>a+b,0)/byDate[d].length }));
    svg.querySelectorAll('.trend-dot').forEach(dot => {
      dot.addEventListener('mouseenter', () => {
        const p = points[+dot.dataset.i];
        tip.textContent = `${fmtDate(p.date)} — ${Math.round(p.avg)}%`;
        const rect = dot.getBoundingClientRect();
        const wrapRect = dot.closest('.chart-svg-wrap').getBoundingClientRect();
        tip.style.left = (rect.left - wrapRect.left + rect.width/2) + 'px';
        tip.style.top = (rect.top - wrapRect.top) + 'px';
        tip.classList.add('show');
      });
      dot.addEventListener('mouseleave', () => tip.classList.remove('show'));
    });
  }
  function renderHistogram(){
    const bands = [ { key:'critical', label:'Below 65', test:p=>p<65 }, { key:'caution', label:'65–84', test:p=>p>=65&&p<85 }, { key:'pass', label:'85+', test:p=>p>=85 } ];
    const counts = bands.map(b => D.submissions.filter(s=>b.test(effective(s).pct)).length);
    const max = Math.max(1, ...counts);
    return `
      <div style="display:flex; align-items:flex-end; gap:18px; height:150px; padding:0 4px;">
        ${bands.map((b,i) => `<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; height:100%;"><span class="mono small">${counts[i]}</span><div style="width:100%; max-width:72px; height:${counts[i]/max*100}%; min-height:2px; background:var(--status-${b.key}); border-radius:var(--radius-sm) var(--radius-sm) 0 0;"></div></div>`).join('')}
      </div>
      <div style="display:flex; gap:18px; padding:0 4px; margin-top:6px;">${bands.map(b => `<div style="flex:1; text-align:center;" class="small muted">${b.label}</div>`).join('')}</div>
      <div class="legend">${bands.map(b => `<span class="legend-item">${b.key==='pass'?ICONS.checkCircle:ICONS.alertTriangle}${b.key==='pass'?'On track':b.key==='caution'?'Watch':'Needs support'}</span>`).join('')}</div>
    `;
  }
  function renderStudentTable(){
    const by = {};
    D.submissions.forEach(s => { if(!by[s.student]) by[s.student] = []; by[s.student].push(s); });
    let rows = Object.keys(by).map(name => {
      const list = by[name].slice().sort((a,b)=> a.date < b.date ? -1 : 1);
      const avg = list.reduce((a,s)=>a+effective(s).pct,0)/list.length;
      const mid = Math.floor(list.length/2) || 1;
      const firstHalf = list.slice(0, mid);
      const secondHalf = list.slice(mid).length ? list.slice(mid) : list;
      const firstAvg = firstHalf.reduce((a,s)=>a+effective(s).pct,0)/firstHalf.length;
      const secondAvg = secondHalf.reduce((a,s)=>a+effective(s).pct,0)/secondHalf.length;
      return { name, count: list.length, avg, trend: secondAvg - firstAvg };
    });
    rows.sort((a,b) => { let av=a[studentSortCol], bv=b[studentSortCol]; if(av<bv) return studentSortDir==='asc'?-1:1; if(av>bv) return studentSortDir==='asc'?1:-1; return 0; });
    return `
      <div class="table-wrap"><table>
        <thead><tr><th><button data-ssort="name">Student</button></th><th><button data-ssort="count">Work</button></th><th><button data-ssort="avg">Average</button></th><th>Trend</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td class="mono">${r.count}</td><td class="mono">${Math.round(r.avg)}%</td><td>${r.trend>2?'<span style="color:var(--status-pass)">↑ improving</span>':r.trend<-2?'<span style="color:var(--status-critical)">↓ slipping</span>':'<span class="muted">– steady</span>'}</td></tr>`).join('')}</tbody>
      </table></div>
    `;
  }
  function renderCohortCompare(){
    const agg = {};
    D.cohorts.forEach(c => agg[c.id] = { sum:0, n:0, below:0 });
    D.submissions.forEach(s => { const c = s.cohort; if(!agg[c]) return; const pct = effective(s).pct; agg[c].sum += pct; agg[c].n += 1; if(pct<65) agg[c].below += 1; });
    const rows = D.cohorts.map(c => ({ cohort:c, avg: agg[c.id].n ? agg[c.id].sum/agg[c.id].n : null, n: agg[c.id].n, below: agg[c.id].below }));
    return `
      <div class="card card-pad" style="margin-bottom:16px;">
        <h3>Average score by cohort</h3><div class="chart-hint">Compares every cohort's graded work side by side</div>
        ${rows.map(r => `<div class="bar-row"><div class="name">${esc(r.cohort.name)}</div><div class="track"><div class="fill" style="width:${r.avg?r.avg:0}%; background:${cohortColor(r.cohort.id)}"></div></div><div class="val mono">${r.avg? Math.round(r.avg)+'%' : '—'}</div></div>`).join('')}
      </div>
      <div class="cohort-grid">
        ${rows.map(r => `<div class="cohort-card" style="border-left-color:${cohortColor(r.cohort.id)};"><div class="name">${esc(r.cohort.name)}</div><div class="metric"><span>Average</span><b>${r.avg? Math.round(r.avg)+'%' : '—'}</b></div><div class="metric"><span>Graded work</span><b>${r.n}</b></div><div class="metric"><span>Needs attention</span><b>${r.below}</b></div></div>`).join('')}
      </div>
    `;
  }
  function wireAnalytics(){
    wireTrendChart();
    document.querySelectorAll('[data-ssort]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.ssort;
        if(studentSortCol===key){ studentSortDir = studentSortDir==='asc'?'desc':'asc'; } else { studentSortCol = key; studentSortDir = 'desc'; }
        rerender('analytics');
      });
    });
  }

  // ---------------- Access ----------------
  function renderAccess(){
    const rows = D.roster.slice().sort((a,b)=> a.name.localeCompare(b.name));
    return `
      <div class="card-header" style="background:none;border:none;padding:0 0 14px;"><h2>Access</h2><span class="small muted">${D.roster.length} people with an account</span></div>
      <div class="alert alert-info" style="margin-bottom:20px;">${ICONS.lock}<div><div class="alert-title">Real accounts, real sessions.</div><div class="alert-body">PINs are hashed in the database — nobody, including admins, can see anyone's PIN. Resetting a PIN generates a new one and shows it once so you can share it with that person.</div></div></div>
      <div class="table-wrap" style="margin-bottom:20px;">
        <table>
          <thead><tr><th>Name</th><th>Access tier</th><th>Actions</th></tr></thead>
          <tbody>
            ${rows.map(r => `<tr>
              <td>${esc(r.name)}${r.id===user.id?' <span class="small muted">(you)</span>':''}</td>
              <td><span class="tier-badge t${r.tier}">${TIER_LABEL[r.tier]}</span></td>
              <td style="display:flex; gap:14px;">
                <button class="link-btn" data-cycle-tier="${r.id}">Change tier</button>
                <button class="link-btn" data-reset-pin="${r.id}">Reset PIN</button>
                <button class="link-btn danger" data-revoke="${r.id}">Revoke</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="card card-pad" style="max-width:520px;">
        <h3 style="margin-bottom:14px;">Grant access to someone new</h3>
        <form id="add-person-form">
          <div class="field"><label>Name</label><input id="ap-name" required></div>
          <div class="field-row">
            <div class="field"><label>Access tier</label>
              <select id="ap-tier">
                <option value="1">Viewer — curriculum only</option>
                <option value="2" selected>Instructor — grading &amp; check-ins</option>
                <option value="3">Admin — full access</option>
              </select>
            </div>
            <div class="field"><label>Starting PIN</label><input id="ap-pin" placeholder="e.g. 4821" required></div>
          </div>
          <button type="submit" class="btn btn-secondary btn-md">Add person</button>
        </form>
      </div>
    `;
  }
  function countAdmins(){ return D.roster.filter(r => r.tier === TIERS.ADMIN).length; }
  function wireAccess(){
    document.querySelectorAll('[data-cycle-tier]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const person = D.roster.find(r => r.id === parseInt(btn.dataset.cycleTier,10));
        if(!person) return;
        if(person.tier === TIERS.ADMIN && countAdmins() <= 1){ toast("Can't lower the only admin account — add another admin first."); return; }
        const nextTier = person.tier >= 3 ? 1 : person.tier + 1;
        try{
          const { user: updated } = await apiJSON('PUT', `/api/roster/${person.id}`, { tier: nextTier });
          const idx = D.roster.findIndex(r => r.id === person.id);
          if(idx>-1) D.roster[idx] = updated;
          if(user.id === person.id) user.tier = updated.tier;
          toast(`${updated.name} is now ${TIER_LABEL[updated.tier]}.`);
          rerender('access');
        }catch(e){ errorToast(e); }
      });
    });
    document.querySelectorAll('[data-reset-pin]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const person = D.roster.find(r => r.id === parseInt(btn.dataset.resetPin,10));
        if(!person) return;
        const next = String(Math.floor(1000 + Math.random()*9000));
        try{
          await apiJSON('PUT', `/api/roster/${person.id}`, { pin: next });
          toast(`${person.name}'s new PIN is ${next} — share it with them.`);
        }catch(e){ errorToast(e); }
      });
    });
    document.querySelectorAll('[data-revoke]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const person = D.roster.find(r => r.id === parseInt(btn.dataset.revoke,10));
        if(!person) return;
        if(person.tier === TIERS.ADMIN && countAdmins() <= 1){ toast("Can't revoke the only admin account."); return; }
        if(!confirm(`Revoke access for ${person.name}?`)) return;
        try{
          await apiJSON('DELETE', `/api/roster/${person.id}`);
          D.roster = D.roster.filter(r => r.id !== person.id);
          toast(`Revoked ${person.name}'s access.`);
          rerender('access');
        }catch(e){ errorToast(e, "Couldn't revoke that account."); }
      });
    });
    const form = document.getElementById('add-person-form');
    if(form) form.addEventListener('submit', async e => {
      e.preventDefault();
      try{
        const { user: created } = await apiJSON('POST', '/api/roster', {
          name: document.getElementById('ap-name').value.trim(),
          tier: document.getElementById('ap-tier').value,
          pin: document.getElementById('ap-pin').value.trim()
        });
        D.roster.push(created);
        toast(`Added ${created.name} as ${TIER_LABEL[created.tier]}.`);
        form.reset();
        rerender('access');
      }catch(err){ errorToast(err, "Couldn't add that person."); }
    });
  }

  // ---------------- init ----------------
  async function init(){
    try{
      const { user: existing } = await apiJSON('GET', '/api/me');
      if(existing){ user = existing; await afterSignIn(); return; }
    }catch(e){ /* not signed in */ }
    await loadPublicRoster();
    boot();
  }
  init();
})();
