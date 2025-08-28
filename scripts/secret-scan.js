#!/usr/bin/env node
/*
 * Lightweight secret scanner for pre-commit
 * - Scans staged files for high-risk patterns
 * - Skips files under tests/** by default unless SCAN_TESTS=true
 */

const { execSync } = require('child_process');

const allowTests = process.env.SCAN_TESTS === 'true';
const patterns = [
  /api_key|apikey|x-api-key|secret_key|client_secret/i,
  /bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/i, // JWT
  /password\s*[:=]\s*['"][^'"\n]{6,}['"]/i,
  /cookie_secret|jwt_secret|private_key/i,
  /BEGIN\s+PRIVATE\s+KEY/,
];

function getStagedFiles() {
  const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  return out.split(/\r?\n/).filter(Boolean);
}

function readFile(path) {
  return require('fs').readFileSync(path, 'utf8');
}

function isSkipped(path) {
  if (!allowTests && /(^|\/)tests(\/.+)?/.test(path)) return true;
  if (/\.lock$/.test(path)) return true;
  return false;
}

function scan() {
  const files = getStagedFiles();
  const findings = [];
  for (const f of files) {
    if (isSkipped(f)) continue;
    try {
      const content = readFile(f);
      for (const p of patterns) {
        const m = content.match(p);
        if (m) {
          findings.push({ file: f, pattern: p.toString(), excerpt: m[0].slice(0, 80) });
          break;
        }
      }
    } catch {}
  }
  return findings;
}

const findings = scan();
if (findings.length) {
  console.error('\n\x1b[31mSecret scan found potential exposures:\x1b[0m');
  findings.forEach(f => console.error(`- ${f.file} :: ${f.pattern} :: ${f.excerpt}`));
  console.error('\nSet SCAN_TESTS=true to include tests directory, or move secrets to env.');
  process.exit(1);
}

console.log('✅ Secret scan passed');
process.exit(0);




