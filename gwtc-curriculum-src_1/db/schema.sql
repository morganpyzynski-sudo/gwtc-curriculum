-- GW Training Center Curriculum — schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tier INT NOT NULL CHECK (tier IN (1,2,3)),
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS cohorts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculum_units (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  grade INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  standard TEXT DEFAULT '',
  weeks INT DEFAULT 1,
  summary TEXT DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  assignment TEXT DEFAULT '',
  doc TEXT DEFAULT '',
  moodle_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- owner_type: 'unit' | 'submission'
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('unit','submission')),
  owner_id INT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT DEFAULT 'application/octet-stream',
  size INT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  student TEXT NOT NULL,
  unit_id INT NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES cohorts(id),
  assignment TEXT DEFAULT '',
  submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rubric JSONB NOT NULL DEFAULT '[]',
  overall INT NOT NULL DEFAULT 0,
  overall_max INT NOT NULL DEFAULT 0,
  overall_pct INT NOT NULL DEFAULT 0,
  feedback TEXT DEFAULT '',
  moodle_url TEXT DEFAULT '',
  override_pct INT,
  override_feedback TEXT,
  override_by TEXT,
  override_date DATE,
  override_moodle_url TEXT,
  graded_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submissions_unit ON submissions(unit_id);
CREATE INDEX IF NOT EXISTS idx_submissions_cohort ON submissions(cohort_id);

CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  author TEXT NOT NULL,
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  went_well TEXT DEFAULT '',
  didnt_go_well TEXT DEFAULT '',
  feedback TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
