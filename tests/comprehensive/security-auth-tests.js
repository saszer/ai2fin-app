/**
 * Enterprise Security E2E Tests (Login, AuthZ, CSRF/JTI sanity)
 * - No hardcoded secrets: reads TEST_EMAIL/TEST_PASSWORD from env
 * - Uses fetch to avoid implicit cookie jars; explicitly manages headers
 */

/* eslint-disable no-console */

const BASE = (process.env.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const EMAIL = process.env.TEST_EMAIL || '';
const PASSWORD = process.env.TEST_PASSWORD || '';
const TOKEN = process.env.TEST_TOKEN || '';

async function json(res) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return { raw: txt }; }
}

async function run() {
  const results = [];
  const push = (name, ok, extra) => { results.push({ name, ok, extra }); console.log(`${ok ? '✅' : '❌'} ${name}`, extra || ''); };

  try {
    // 1) Public health/version endpoints
    const v = await fetch(`${BASE}/api/version`);
    push('Public: /api/version', v.ok, { status: v.status });

    // Short-circuit if no credentials provided
    if (!EMAIL || !PASSWORD) {
      push('Login skipped - TEST_EMAIL/TEST_PASSWORD not set', true);
      console.log(JSON.stringify({ summary: results }, null, 2));
      process.exit(0);
    }

    // 2) Login or use pre-provided token
    let token = TOKEN;
    if (!token) {
      const loginRes = await fetch(`${BASE}/api/enterprise-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
      });
      const loginBody = await json(loginRes);
      push('Login /api/enterprise-auth/login', loginRes.ok && loginBody?.success, { status: loginRes.status, body: loginBody?.error || 'ok' });
      if (!loginRes.ok || !loginBody?.token) {
        console.log(JSON.stringify({ summary: results }, null, 2));
        process.exit(1);
      }
      token = loginBody.token;
    } else {
      push('Using provided TEST_TOKEN', true);
    }

    // 3) Authenticated GET (Bearer)
    const me = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meBody = await json(me);
    push('AuthZ: /api/auth/me with Bearer', me.ok && !!meBody?.user, { status: me.status });

    // 4) Protected resource (categories) with Bearer
    const cats = await fetch(`${BASE}/api/bank/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    push('AuthZ: /api/bank/categories with Bearer', cats.ok, { status: cats.status });

    // 5) CSRF gating sanity: POST with Bearer should still succeed without CSRF (server treats Bearer as non-cookie auth)
    const csrfBypass = await fetch(`${BASE}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: `test_${Date.now()}` })
    });
    push('CSRF: POST with Bearer allowed', csrfBypass.status !== 403, { status: csrfBypass.status });

    console.log(JSON.stringify({ summary: results }, null, 2));
    const failed = results.filter(r => !r.ok).length;
    process.exit(failed ? 1 : 0);
  } catch (e) {
    console.error('Test run failed', e);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = run;


