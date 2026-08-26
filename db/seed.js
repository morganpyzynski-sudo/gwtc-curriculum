// One-time seed: creates the initial admin account + starter cohorts.
// Safe to re-run — skips anything that already exists.
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false })
});

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pin), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function randomPin() {
  return String(crypto.randomInt(1000, 9999));
}

async function main() {
  const { rows: existing } = await pool.query('SELECT count(*)::int AS n FROM users');
  let adminPin = null;
  if (existing[0].n === 0) {
    adminPin = process.env.SEED_ADMIN_PIN || randomPin();
    await pool.query(
      'INSERT INTO users (name, tier, pin_hash) VALUES ($1,3,$2)',
      [process.env.SEED_ADMIN_NAME || 'Morgan', hashPin(adminPin)]
    );
    console.log(`Created admin user "${process.env.SEED_ADMIN_NAME || 'Morgan'}" with PIN: ${adminPin}`);
  } else {
    console.log('Users already exist — skipping admin creation.');
  }

  const cohorts = [['A', 'Cohort A'], ['B', 'Cohort B'], ['C', 'Cohort C']];
  for (const [id, name] of cohorts) {
    await pool.query('INSERT INTO cohorts (id, name) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING', [id, name]);
  }
  console.log('Cohorts ensured.');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
