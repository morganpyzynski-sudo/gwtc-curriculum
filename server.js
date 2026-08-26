const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — real storage now, so a bit more headroom than the prototype
const SESSION_DAYS = 30;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false })
});

const app = express();
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ limits: { fileSize: MAX_FILE_BYTES } });

// ---------- helpers ----------
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPin(pin, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}
function newToken() {
  return crypto.randomBytes(32).toString('hex');
}
async function getSessionUser(req) {
  const sid = req.cookies && req.cookies.sid;
  if (!sid) return null;
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.tier FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sid]
  );
  return rows[0] || null;
}
function requireTier(minTier) {
  return async (req, res, next) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'not_signed_in' });
    if (user.tier < minTier) return res.status(403).json({ error: 'insufficient_tier' });
    req.user = user;
    next();
  };
}
async function requireAuth(req, res, next) {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'not_signed_in' });
  req.user = user;
  next();
}
const TIER = { VIEWER: 1, GRADER: 2, ADMIN: 3 };

function rowUnit(r, attachments) {
  return {
    id: r.id, subject: r.subject, grade: (r.grade === null || r.grade === undefined) ? null : r.grade, title: r.title, standard: r.standard,
    durationHours: r.duration_hours || 0, durationMinutes: r.duration_minutes || 0,
    summary: r.summary, tags: r.tags || [], assignment: r.assignment,
    doc: r.doc, moodleUrl: r.moodle_url, attachments: attachments || []
  };
}
function parseGrade(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function rowSubmission(r, attachment) {
  const overridden = r.override_pct !== null && r.override_pct !== undefined;
  return {
    id: r.id, student: r.student, unitId: r.unit_id, cohort: r.cohort_id,
    assignment: r.assignment, date: r.submitted_date, rubric: r.rubric,
    overall: r.overall, overallMax: r.overall_max, overallPct: r.overall_pct,
    feedback: r.feedback, moodleUrl: r.moodle_url,
    attachment: attachment || null,
    override: overridden ? {
      overallPct: r.override_pct, feedback: r.override_feedback, by: r.override_by,
      date: r.override_date, moodleUrl: r.override_moodle_url
    } : null
  };
}

// ---------- heuristic "AI-assisted" grading (disclosed simulation, not a live model call) ----------
function seededRand(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
function heuristicGrade(unit, student, text) {
  const rand = seededRand(`${unit.id}|${student}|${text.length}`);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const tagHits = (unit.tags || []).filter(t => t && text.toLowerCase().includes(String(t).toLowerCase())).length;
  const lengthScore = Math.max(0, Math.min(1, wordCount / 120));
  const criteria = [
    { criterion: 'Addresses the prompt', max: 25 },
    { criterion: 'Uses relevant vocabulary/keywords', max: 25 },
    { criterion: 'Depth of explanation', max: 25 },
    { criterion: 'Clarity & organization', max: 25 }
  ];
  const rubric = criteria.map((c, i) => {
    const base = 0.55 + lengthScore * 0.25 + Math.min(0.15, tagHits * 0.05) + (rand() - 0.5) * 0.12;
    const score = Math.max(0, Math.min(c.max, Math.round(base * c.max)));
    const notes = [
      i === 1 ? (tagHits > 0 ? `Used ${tagHits} of the unit's key term${tagHits === 1 ? '' : 's'}.` : 'Could use more of the unit\'s key vocabulary.') :
      i === 0 ? (wordCount > 40 ? 'Response engages with the prompt.' : 'Response is brief relative to the prompt.') :
      i === 2 ? (wordCount > 80 ? 'Reasonable depth of explanation.' : 'Could go further in explaining reasoning.') :
      'Generally organized response.'
    ];
    return { criterion: c.criterion, score, max: c.max, note: notes[0] };
  });
  const overall = rubric.reduce((a, c) => a + c.score, 0);
  const overallMax = rubric.reduce((a, c) => a + c.max, 0);
  const overallPct = Math.round((overall / overallMax) * 100);
  const feedback = overallPct >= 85
    ? 'Strong response — clearly addresses the assignment with good use of unit vocabulary.'
    : overallPct >= 65
    ? 'Solid start. Add more specific detail and unit vocabulary to strengthen this further.'
    : 'This needs another pass — expand your explanation and connect it more directly to the unit material.';
  return { rubric, overall, overallMax, overallPct, feedback };
}

// ================= AUTH =================
app.get('/api/me', async (req, res) => {
  const user = await getSessionUser(req);
  res.json({ user });
});

app.get('/api/roster/public', async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, tier FROM users ORDER BY tier DESC, name ASC');
  res.json({ roster: rows });
});

app.post('/api/login', async (req, res) => {
  const { userId, pin } = req.body || {};
  if (!userId || !pin) return res.status(400).json({ error: 'missing_fields' });
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  const u = rows[0];
  if (!u || !verifyPin(pin, u.pin_hash)) return res.status(401).json({ error: 'bad_credentials' });
  const sid = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await pool.query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1,$2,$3)', [sid, u.id, expires]);
  res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax', secure: req.protocol === 'https', expires, path: '/' });
  res.json({ user: { id: u.id, name: u.name, tier: u.tier } });
});

app.post('/api/logout', async (req, res) => {
  const sid = req.cookies && req.cookies.sid;
  if (sid) await pool.query('DELETE FROM sessions WHERE id = $1', [sid]);
  res.clearCookie('sid', { path: '/' });
  res.json({ ok: true });
});

// ================= CURRICULUM =================
app.get('/api/curriculum', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM curriculum_units ORDER BY subject, grade, title');
  const { rows: atts } = await pool.query(
    `SELECT id, owner_id, filename, content_type, size FROM attachments WHERE owner_type = 'unit' ORDER BY created_at`
  );
  const byUnit = {};
  atts.forEach(a => { (byUnit[a.owner_id] = byUnit[a.owner_id] || []).push({ id: a.id, name: a.filename, type: a.content_type, size: a.size }); });
  res.json({ units: rows.map(r => rowUnit(r, byUnit[r.id])) });
});

app.post('/api/curriculum', requireTier(TIER.ADMIN), upload.single('file'), async (req, res) => {
  const b = req.body || {};
  const tags = (b.tags || '').split(',').map(s => s.trim()).filter(Boolean);
  const { rows } = await pool.query(
    `INSERT INTO curriculum_units (subject, grade, title, standard, duration_hours, duration_minutes, summary, tags, assignment, doc, moodle_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [b.subject || 'General', parseGrade(b.grade), b.title || 'Untitled unit', b.standard || '',
     parseInt(b.durationHours, 10) || 0, parseInt(b.durationMinutes, 10) || 0, b.summary || '', tags, b.assignment || '', b.doc || '', b.moodleUrl || '']
  );
  const unit = rows[0];
  if (req.file) {
    await pool.query(
      `INSERT INTO attachments (owner_type, owner_id, filename, content_type, size, data) VALUES ('unit',$1,$2,$3,$4,$5)`,
      [unit.id, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]
    );
  }
  res.json({ unit: rowUnit(unit) });
});

app.put('/api/curriculum/:id', requireTier(TIER.ADMIN), upload.single('file'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const b = req.body || {};
  const tags = (b.tags || '').split(',').map(s => s.trim()).filter(Boolean);
  const { rows } = await pool.query(
    `UPDATE curriculum_units SET subject=$1, grade=$2, title=$3, standard=$4, duration_hours=$5, duration_minutes=$6, summary=$7,
     tags=$8, assignment=$9, doc=$10, moodle_url=$11, updated_at=now() WHERE id=$12 RETURNING *`,
    [b.subject || 'General', parseGrade(b.grade), b.title || 'Untitled unit', b.standard || '',
     parseInt(b.durationHours, 10) || 0, parseInt(b.durationMinutes, 10) || 0, b.summary || '', tags, b.assignment || '', b.doc || '', b.moodleUrl || '', id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  if (req.file) {
    await pool.query(
      `INSERT INTO attachments (owner_type, owner_id, filename, content_type, size, data) VALUES ('unit',$1,$2,$3,$4,$5)`,
      [id, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]
    );
  }
  res.json({ unit: rowUnit(rows[0]) });
});

app.delete('/api/curriculum/:id', requireTier(TIER.ADMIN), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await pool.query(`DELETE FROM attachments WHERE owner_type='unit' AND owner_id=$1`, [id]);
  await pool.query('DELETE FROM curriculum_units WHERE id = $1', [id]);
  res.json({ ok: true });
});

app.delete('/api/curriculum/:id/attachments/:attId', requireTier(TIER.ADMIN), async (req, res) => {
  await pool.query(`DELETE FROM attachments WHERE id=$1 AND owner_type='unit' AND owner_id=$2`, [req.params.attId, req.params.id]);
  res.json({ ok: true });
});

// ================= ATTACHMENTS (stream bytes) =================
app.get('/api/attachments/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT filename, content_type, data FROM attachments WHERE id = $1', [req.params.id]);
  const a = rows[0];
  if (!a) return res.status(404).end();
  res.setHeader('Content-Type', a.content_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${a.filename.replace(/"/g, '')}"`);
  res.send(a.data);
});

// ================= COHORTS =================
app.get('/api/cohorts', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM cohorts ORDER BY id');
  res.json({ cohorts: rows });
});

// ================= SUBMISSIONS / GRADING =================
app.get('/api/submissions', requireTier(TIER.GRADER), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM submissions ORDER BY submitted_date DESC, id DESC');
  const { rows: atts } = await pool.query(
    `SELECT id, owner_id, filename, content_type, size FROM attachments WHERE owner_type = 'submission'`
  );
  const byId = {};
  atts.forEach(a => { byId[a.owner_id] = { id: a.id, name: a.filename, type: a.content_type, size: a.size }; });
  res.json({ submissions: rows.map(r => rowSubmission(r, byId[r.id])) });
});

app.post('/api/submissions', requireTier(TIER.GRADER), upload.single('file'), async (req, res) => {
  const b = req.body || {};
  const { rows: unitRows } = await pool.query('SELECT * FROM curriculum_units WHERE id = $1', [b.unitId]);
  const unit = unitRows[0];
  if (!unit) return res.status(400).json({ error: 'unit_not_found' });
  if (!b.cohortId) return res.status(400).json({ error: 'cohort_required' });
  if (!b.student) return res.status(400).json({ error: 'student_required' });
  const text = (b.text || '').trim();
  if (!text && !req.file) return res.status(400).json({ error: 'text_or_attachment_required' });
  const gradingText = text || `[Attached file: ${req.file.originalname}]`;
  const graded = heuristicGrade(rowUnit(unit), b.student, gradingText);
  const { rows } = await pool.query(
    `INSERT INTO submissions (student, unit_id, cohort_id, assignment, submitted_date, rubric, overall, overall_max, overall_pct, feedback, moodle_url, graded_by_user_id)
     VALUES ($1,$2,$3,$4,CURRENT_DATE,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [b.student, unit.id, b.cohortId, b.assignment || unit.assignment, JSON.stringify(graded.rubric),
     graded.overall, graded.overallMax, graded.overallPct, graded.feedback, b.moodleUrl || '', req.user.id]
  );
  const sub = rows[0];
  if (req.file) {
    await pool.query(
      `INSERT INTO attachments (owner_type, owner_id, filename, content_type, size, data) VALUES ('submission',$1,$2,$3,$4,$5)`,
      [sub.id, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]
    );
  }
  res.json({ submission: rowSubmission(sub) });
});

app.put('/api/submissions/:id/override', requireTier(TIER.ADMIN), async (req, res) => {
  const b = req.body || {};
  const pct = Math.max(0, Math.min(100, parseInt(b.pct, 10) || 0));
  const { rows } = await pool.query(
    `UPDATE submissions SET override_pct=$1, override_feedback=$2, override_by=$3, override_date=CURRENT_DATE, override_moodle_url=$4
     WHERE id=$5 RETURNING *`,
    [pct, b.feedback || '', req.user.name, b.moodleUrl || '', req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ submission: rowSubmission(rows[0]) });
});

app.delete('/api/submissions/:id/override', requireTier(TIER.ADMIN), async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE submissions SET override_pct=NULL, override_feedback=NULL, override_by=NULL, override_date=NULL, override_moodle_url=NULL
     WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ submission: rowSubmission(rows[0]) });
});

// ================= SURVEYS / INSTRUCTOR FEEDBACK =================
app.post('/api/surveys', requireTier(TIER.GRADER), async (req, res) => {
  const b = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO surveys (author, survey_date, went_well, didnt_go_well, feedback) VALUES ($1,CURRENT_DATE,$2,$3,$4) RETURNING *`,
    [req.user.name, b.wentWell || '', b.didntGoWell || '', b.feedback || '']
  );
  res.json({ survey: rows[0] });
});

app.get('/api/surveys', requireTier(TIER.ADMIN), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM surveys ORDER BY survey_date DESC, id DESC');
  res.json({ surveys: rows });
});

// ================= ANALYTICS =================
app.get('/api/analytics', requireTier(TIER.ADMIN), async (req, res) => {
  const { rows: subs } = await pool.query('SELECT * FROM submissions');
  const { rows: units } = await pool.query('SELECT id, title, subject FROM curriculum_units');
  const { rows: cohorts } = await pool.query('SELECT * FROM cohorts ORDER BY id');
  const effPct = s => (s.override_pct !== null && s.override_pct !== undefined) ? s.override_pct : s.overall_pct;
  res.json({ submissions: subs.map(s => ({ ...rowSubmission(s), effectivePct: effPct(s) })), units, cohorts });
});

// ================= ACCESS / ROSTER (admin) =================
app.get('/api/roster', requireTier(TIER.ADMIN), async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, tier FROM users ORDER BY tier DESC, name ASC');
  res.json({ roster: rows });
});

app.post('/api/roster', requireTier(TIER.ADMIN), async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.pin || !b.tier) return res.status(400).json({ error: 'missing_fields' });
  const { rows } = await pool.query(
    'INSERT INTO users (name, tier, pin_hash) VALUES ($1,$2,$3) RETURNING id, name, tier',
    [b.name, parseInt(b.tier, 10), hashPin(b.pin)]
  );
  res.json({ user: rows[0] });
});

app.put('/api/roster/:id', requireTier(TIER.ADMIN), async (req, res) => {
  const b = req.body || {};
  if (b.tier) await pool.query('UPDATE users SET tier=$1 WHERE id=$2', [parseInt(b.tier, 10), req.params.id]);
  if (b.pin) await pool.query('UPDATE users SET pin_hash=$1 WHERE id=$2', [hashPin(b.pin), req.params.id]);
  const { rows } = await pool.query('SELECT id, name, tier FROM users WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json({ user: rows[0] });
});

app.delete('/api/roster/:id', requireTier(TIER.ADMIN), async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ error: 'cannot_revoke_self' });
  await pool.query('DELETE FROM sessions WHERE user_id=$1', [req.params.id]);
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// fallback to SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not_found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- migrate + seed on startup (idempotent) ----------
function randomPin() { return String(crypto.randomInt(1000, 9999)); }

async function migrateAndSeed() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schemaSql);
  console.log('[migrate] schema ensured.');

  // Poor-man's incremental migration for databases created before a schema change.
  // Each statement is written to be safe to re-run on every boot.
  await pool.query(`
    ALTER TABLE curriculum_units ALTER COLUMN grade DROP NOT NULL;
    ALTER TABLE curriculum_units ALTER COLUMN grade DROP DEFAULT;
    ALTER TABLE curriculum_units ADD COLUMN IF NOT EXISTS duration_hours INT DEFAULT 0;
    ALTER TABLE curriculum_units ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0;
    ALTER TABLE curriculum_units DROP COLUMN IF EXISTS weeks;
  `);
  console.log('[migrate] curriculum_units: grade optional, duration in hours/minutes.');

  const { rows: userCount } = await pool.query('SELECT count(*)::int AS n FROM users');
  if (userCount[0].n === 0) {
    const adminName = process.env.SEED_ADMIN_NAME || 'Admin';
    const adminPin = process.env.SEED_ADMIN_PIN || randomPin();
    await pool.query('INSERT INTO users (name, tier, pin_hash) VALUES ($1,3,$2)', [adminName, hashPin(adminPin)]);
    console.log('==================================================================');
    console.log(`[seed] Created first admin account: "${adminName}"`);
    console.log(`[seed] PIN: ${adminPin}`);
    console.log('[seed] This is shown only once, here in the deploy logs.');
    console.log('==================================================================');
  } else {
    console.log('[seed] Users already exist — skipping admin creation.');
  }

  const cohorts = [['A', 'Cohort A'], ['B', 'Cohort B'], ['C', 'Cohort C']];
  for (const [id, name] of cohorts) {
    await pool.query('INSERT INTO cohorts (id, name) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING', [id, name]);
  }
  console.log('[seed] Cohorts ensured.');
}

migrateAndSeed()
  .then(() => {
    app.listen(PORT, () => console.log(`GW Training Center Curriculum listening on :${PORT}`));
  })
  .catch(err => {
    console.error('[migrate] Failed to migrate/seed database:', err);
    process.exit(1);
  });
