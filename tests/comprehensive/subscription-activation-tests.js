/**
 * Subscription Activation & UI Lock Flow Tests
 * - Uses TEST_TOKEN (preferred) or TEST_EMAIL/TEST_PASSWORD
 * - Verifies status caching, force refresh, ETag behavior
 */
/* eslint-disable no-console */

const BASE = (process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const TOKEN = process.env.TEST_TOKEN || '';
const EMAIL = process.env.TEST_EMAIL || '';
const PASSWORD = process.env.TEST_PASSWORD || '';

async function json(res) { const t = await res.text(); try { return JSON.parse(t); } catch { return { raw: t }; } }

async function loginIfNeeded() {
  if (TOKEN) return TOKEN;
  if (!EMAIL || !PASSWORD) throw new Error('Provide TEST_TOKEN or TEST_EMAIL/TEST_PASSWORD');
  const r = await fetch(`${BASE}/api/enterprise-auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const b = await json(r);
  if (!r.ok || !b?.token) throw new Error(`Login failed: ${r.status} ${b?.error || ''}`);
  return b.token;
}

async function getStatus(force, token, etag) {
  const url = `${BASE}/api/subscription/status${force ? '?force=true' : ''}`;
  const headers = { 'X-Source': 'sub-tests' };
  if (force) { headers['X-Force-Refresh'] = '1'; headers['Cache-Control'] = 'no-cache'; }
  if (etag) headers['If-None-Match'] = etag;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(url, { headers, credentials: 'include' });
  const body = await json(r);
  return { r, body };
}

async function run() {
  const results = [];
  const push = (n, ok, x) => { results.push({ n, ok, x }); console.log(`${ok ? '✅' : '❌'} ${n}`, x || ''); };
  try {
    const token = await loginIfNeeded();

    // 1) Normal status (may be cached)
    const s1 = await getStatus(false, token);
    const sub1 = s1.body?.data?.subscription || s1.body?.subscription || {};
    const etag1 = s1.r.headers.get('etag');
    push('Status (cached)', s1.r.ok, { active: sub1.isActive, etag: etag1 });

    // 2) Force refresh to bypass caches
    const s2 = await getStatus(true, token);
    const sub2 = s2.body?.data?.subscription || s2.body?.subscription || {};
    const etag2 = s2.r.headers.get('etag');
    push('Status (forced)', s2.r.ok && typeof sub2.isActive === 'boolean', { active: sub2.isActive, etag: etag2 });

    // 3) ETag 304 check
    if (etag2) {
      const s3 = await getStatus(false, token, etag2);
      push('Status (ETag 304)', s3.r.status === 304, { status: s3.r.status });
    }

    // 4) Expect active after you enabled in Stripe
    push('Subscription active', sub2.isActive === true, { status: sub2.status });

    console.log(JSON.stringify({ results }, null, 2));
    process.exit(results.some(r => !r.ok) ? 1 : 0);
  } catch (e) {
    console.error('Test failed', e.message || e);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = run;




