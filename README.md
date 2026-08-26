# GW Training Center Curriculum

Real, database-backed curriculum + AI-assisted grading portal for GW Training Center staff.

## Local development

```
npm install
export DATABASE_URL=postgres://user:pass@localhost:5432/gwtc_curriculum
node server.js
```

The server automatically creates its schema and seeds an initial admin account on first run — the generated PIN is printed once to the server logs.

## Deploying

Deploy `server.js` as a Node web service (build: `npm install`, start: `node server.js`) with a `DATABASE_URL` environment variable pointing at a Postgres database. No separate migration step is needed — the app creates its tables and seeds the first admin account automatically on startup if the database is empty.
