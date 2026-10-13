#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 *   KataBumpUT v2.1 — Space Edition
 *   Auto Renew for your free KataBump server
 *   © 6amirreza6 — all rights reserved  ·  MIT License
 * ═══════════════════════════════════════════════════════════════════════
 *   Runs INSIDE the terminal of your own KataBump host.
 *   First run = a small setup wizard:
 *       → your email
 *       → your password (masked)
 *       → your Server ID (the number in /server/<ID>)
 *   Your info is then locked in an ENCRYPTED vault (AES-256-GCM).
 *   The password is NEVER written to disk in plain text.
 *
 *   Usage:
 *     node kata-ut.mjs            → renew now, then keep auto-renewing (fully automatic)
 *     node kata-ut.mjs --loop     → same thing, explicit
 *     node kata-ut.mjs --once     → renew once, then exit
 *     node kata-ut.mjs --setup    → re-enter your info (re-lock the vault)
 *     node kata-ut.mjs --status   → show vault + last renewal state
 *     node kata-ut.mjs --delete   → DELETE ALL your stored info instantly (alias: --reset)
 *     node kata-ut.mjs --login    → browser mode for Turnstile captcha
 *                                   (needs: npm i playwright
 *                                           npx playwright install chromium)
 *
 *   While it is running, the console is a LIVE panel — type:
 *     renew  ·  status  ·  delete (wipe my info, instant & automatic)  ·  exit
 *
 *   Env (optional, skips the wizard):
 *     KATA_EMAIL=you@example.com KATA_PASSWORD=secret KATA_SERVER_ID=84521 node kata-ut.mjs
 * ═══════════════════════════════════════════════════════════════════════
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://dashboard.katabump.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/* ---------------- timing (the "once a day" heart) ---------------- */
const RENEW_EVERY_HOURS = 24;  // one renewal cycle per day
const RETRY_EVERY_MIN = 15;    // if an attempt fails, retry after this
const MIN_GAP_HOURS = 23;      // safety gap between two successful renewals

/* ---------------- files ---------------- */
const DATA_FILE = path.join(__dirname, 'kata-renew-data.json'); // session cookies only
const VAULT_FILE = path.join(__dirname, '.syscore.json');       // encrypted credentials vault

/* ---------------- args / modes ---------------- */
const args = process.argv.slice(2);
const has = f => args.includes(f);
const MODE =
  has('--help')   ? 'help'   :
  has('--show')   ? 'show'   :
  (has('--reset') || has('--delete')) ? 'reset' :
  has('--status') ? 'status' :
  has('--setup')  ? 'setup'  :
  has('--login')  ? 'login'  :
  has('--once')   ? 'once'   :
  has('--loop')   ? 'loop'   : 'interactive';

/* ---------------- tiny helpers ---------------- */
const pad = n => String(n).padStart(2, '0');
const nowStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const cDim = s => paint('2', s);
const cCyan = s => paint('96', s);
const cMag = s => paint('35', s);
const cGreen = s => paint('92', s);
const cYellow = s => paint('93', s);
const cRed = s => paint('91', s);
const cBold = s => paint('1', s);

const log = m => console.log(`${cDim('[' + nowStr() + ']')} ${m}`);

function banner() {
  console.log('');
  console.log(cMag('   ★══════════════════════════════════════════════════★'));
  console.log(cCyan('   ║          KataBumpUT  ·  Auto Renew  v2.1          ║'));
  console.log(cCyan('   ║        space-grade renewal for free hosts         ║'));
  console.log(cMag('   ★══════════════════════════════════════════════════★'));
  console.log(cDim('     github.com/6amirreza6  ·  MIT © 6amirreza6 · all rights reserved'));
  console.log('');
}

/* ---------------- interactive prompts ----------------
   TTY (real terminal): readline with * masking for secrets.
   Pipe / non-TTY (tests, CI): line queue that never loses input. */

const isTTY = Boolean(process.stdin.isTTY);

let rlIface = null;
let pendingResolve = null;
let currentQuestion = '';
let maskMode = false;

function ttyAsk(question, mask) {
  return new Promise(resolve => {
    if (!rlIface) {
      rlIface = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
      rlIface.on('close', () => { if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(''); } });
      rlIface._writeToOutput = function (s) {
        if (s.startsWith(currentQuestion)) rlIface.output.write(s);
        else if (s === '\n' || s === '\r\n' || s === '\r') rlIface.output.write('\n');
        else if (maskMode && s.includes('\b')) rlIface.output.write(s);
        else if (maskMode) rlIface.output.write('*');
        else rlIface.output.write(s);
      };
    }
    currentQuestion = question;
    maskMode = Boolean(mask);
    pendingResolve = resolve;
    rlIface.question(question, a => {
      pendingResolve = null;
      maskMode = false;
      resolve((a || '').trim());
    });
  });
}

const pipedLines = [];
const pipedWaiters = [];
let pipedClosed = false;
let pipeReaderReady = false;

function ensurePipeReader() {
  if (pipeReaderReady) return;
  pipeReaderReady = true;
  process.stdin.setEncoding('utf8');
  let partial = '';
  process.stdin.on('data', chunk => {
    partial += chunk;
    let idx;
    while ((idx = partial.indexOf('\n')) >= 0) {
      const line = partial.slice(0, idx).replace(/\r$/, '');
      partial = partial.slice(idx + 1);
      if (pipedWaiters.length) pipedWaiters.shift()(line);
      else pipedLines.push(line);
    }
    if (!pipedWaiters.length && typeof process.stdin.unref === 'function') process.stdin.unref();
  });
  process.stdin.on('end', () => {
    pipedClosed = true;
    if (pipedWaiters.length) pipedWaiters.shift()('');
  });
  // idle stdin must never keep the process alive
  if (typeof process.stdin.unref === 'function') process.stdin.unref();
}

function askLine(question, mask) {
  if (isTTY) return ttyAsk(question, mask);
  ensurePipeReader();
  return new Promise(resolve => {
    process.stdout.write(question);
    if (pipedLines.length) return resolve(pipedLines.shift().trim());
    if (pipedClosed) return resolve('');
    pipedWaiters.push(resolve);
    // while a line is pending, stdin is the thing we live on
    if (typeof process.stdin.ref === 'function') process.stdin.ref();
  });
}

/* ═══════════════════════ THE VAULT ═══════════════════════
   Credentials are sealed with AES-256-GCM. The 256-bit key is
   generated at setup and SPLIT in two halves:
     • half A lives inside the vault file
     • half B is XOR-masked with machine-derived bytes and kept
       in a separate hidden file in another directory
   Finding one file alone reveals nothing. Nothing is ever
   written in plain text — no email, no password, no server id. */

const AAD = Buffer.from('KataBumpUT.vault.v1');

function machineTag() {
  const h = os.hostname() + '|' + (os.userInfo().username || '') + '|kx';
  return crypto.createHash('sha256').update(h).digest('hex').slice(0, 8);
}

function shadowPaths() {
  const name = `.kxfx-${machineTag()}`;
  const dirs = [];
  try { dirs.push(path.join(os.homedir(), '.cache')); } catch { /* */ }
  try { dirs.push(os.tmpdir()); } catch { /* */ }
  dirs.push(__dirname);
  return [...new Set(dirs)].map(d => path.join(d, name));
}

function mask16() {
  const seed = os.hostname() + '|' + (os.userInfo().username || '') + '|kx-pepper-v1';
  return crypto.scryptSync(seed, 'kx-salt-v1', 16, { N: 16384, r: 8, p: 1 });
}

function writeShadow(partB) {
  const mask = mask16();
  const blob = Buffer.from(partB.map((b, i) => b ^ mask[i % mask.length])).toString('base64');
  for (const p of shadowPaths()) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, blob, { mode: 0o600 });
      return p;
    } catch { /* try next location */ }
  }
  return null;
}

function readShadow() {
  const mask = mask16();
  for (const p of shadowPaths()) {
    try {
      const raw = fs.readFileSync(p, 'utf8').trim();
      const blob = Buffer.from(raw, 'base64');
      return Buffer.from(blob.map((b, i) => b ^ mask[i % mask.length]));
    } catch { /* try next location */ }
  }
  return null;
}

function vaultExists() { try { return fs.statSync(VAULT_FILE).isFile(); } catch { return false; } }

function saveVault({ email, password, serverId }) {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv).setAAD(AAD);
  const ct = Buffer.concat([cipher.update(JSON.stringify({ email, password, serverId }), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const halfA = key.subarray(0, 16);
  const halfB = Buffer.from(key.subarray(16));
  const shadowAt = writeShadow(halfB);
  if (!shadowAt) throw new Error('could not write the vault key file');
  fs.writeFileSync(VAULT_FILE, JSON.stringify({
    v: 1, alg: 'aes-256-gcm', iv: iv.toString('base64'), tag: tag.toString('base64'),
    ct: ct.toString('base64'), kA: halfA.toString('base64'),
  }), { mode: 0o600 });
}

function loadVault() {
  if (!vaultExists()) return null;
  let box;
  try { box = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8')); } catch { return null; }
  try {
    const halfB = readShadow();
    if (!halfB || halfB.length !== 16) return null;
    const key = Buffer.concat([Buffer.from(box.kA, 'base64'), halfB]);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(box.iv, 'base64')).setAAD(AAD);
    decipher.setAuthTag(Buffer.from(box.tag, 'base64'));
    const pt = Buffer.concat([decipher.update(Buffer.from(box.ct, 'base64')), decipher.final()]).toString('utf8');
    return JSON.parse(pt);
  } catch { return null; }
}

function wipeVault() {
  let n = 0;
  for (const p of [...shadowPaths(), VAULT_FILE]) {
    try { fs.unlinkSync(p); n++; } catch { /* not there */ }
  }
  return n;
}

/* ---------------- where credentials come from ---------------- */

function envCreds() {
  const email = process.env.KATA_EMAIL || '';
  const password = process.env.KATA_PASSWORD || '';
  const serverId = (process.env.KATA_SERVER_ID || '').trim();
  return email && password ? { email, password, serverId } : null;
}

async function setupWizard() {
  console.log(cBold(cCyan('  ✦ Setup — your info will be locked in an encrypted vault (AES-256-GCM)')));
  console.log(cDim('    The password is never stored in plain text. Nothing is sent anywhere except KataBump.'));
  console.log('');
  const env = envCreds();
  let email = env ? env.email : '';
  let password = env ? env.password : '';
  let serverId = env ? env.serverId : '';
  if (!email) {
    email = await askLine('? Your KataBump email: ', false);
  } else {
    log(cDim(`ℹ  email taken from KATA_EMAIL (${email})`));
  }
  if (!password) {
    password = await askLine('? Your KataBump password: ', true);
  } else {
    log(cDim('ℹ  password taken from KATA_PASSWORD'));
  }
  if (!serverId) {
    console.log(cDim('  → Server ID is the number at the end of your panel URL:'));
    console.log(cDim('    dashboard.katabump.com/server/84521   ←  84521 is the ID'));
  }
  serverId = await askLine('? Your Server ID (Enter to auto-detect): ', false);
  serverId = serverId.replace(/\s+/g, ',');
  if (!email || !password) { log(cRed('✗ Email and password are required.')); process.exit(1); }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { log(cRed('✗ That does not look like a valid email.')); process.exit(1); }
  try {
    saveVault({ email, password, serverId });
  } catch (e) {
    log(cRed(`✗ Could not lock the vault: ${e.message}`)); process.exit(1);
  }
  console.log('');
  log(cGreen(`✦ Vault locked — your info is encrypted and hidden.`));
  if (serverId) log(cDim(`  target server(s): ${serverId.split(',').join(', ')}`));
  return { email, password, serverId };
}

async function getCredentials() {
  const env = envCreds();
  if (env) { log(cDim('ℹ  Using credentials from environment variables.')); return env; }
  const fromVault = loadVault();
  if (fromVault) return fromVault;
  if (vaultExists()) {
    log(cYellow('⚠  The vault is damaged or its key file is gone — setting up again.'));
    try { wipeVault(); } catch { /* */ }
  }
  return setupWizard();
}

/* ---------------- session cookies + state (plain file, no secrets) ---------------- */

let data = { cookies: [], lastSuccessAt: null, lastResult: null };
let wiped = false; // set the moment the user deletes their info — nothing may be written after
try { const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); if (d && Array.isArray(d.cookies)) data = { ...data, ...d }; } catch { /* first run */ }
const saveData = () => { if (wiped) return; try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch { /* */ } };

class Jar {
  static parseSetCookie(sc, url) {
    const parts = sc.split(';').map(s => s.trim());
    const nv = parts.shift();
    const eq = nv.indexOf('=');
    if (eq < 1) return null;
    const c = { name: nv.slice(0, eq).trim(), value: nv.slice(eq + 1).trim(), domain: url.hostname, path: '/' };
    for (const a of parts) {
      const i = a.indexOf('=');
      const k = (i < 0 ? a : a.slice(0, i)).trim().toLowerCase();
      const v = i < 0 ? '' : a.slice(i + 1).trim();
      if (k === 'domain') c.domain = v.replace(/^\./, '') || c.domain;
      else if (k === 'path') c.path = v || '/';
      else if (k === 'expires') { const t = Date.parse(v); if (!Number.isNaN(t) && t < Date.now()) c.expired = true; }
      else if (k === 'max-age') { if (/^-\d/.test(v)) c.expired = true; }
    }
    return c;
  }
  storeFromResponse(res, url) {
    let list = [];
    if (typeof res.headers.getSetCookie === 'function') list = res.headers.getSetCookie();
    else { const raw = res.headers.get('set-cookie'); if (raw) list = raw.split(/,(?=[^;]+?=)/); }
    let changed = false;
    for (const sc of list) {
      const c = Jar.parseSetCookie(sc, url);
      if (!c) continue;
      const dom = c.domain.replace(/^\./, '');
      const before = data.cookies.length;
      data.cookies = data.cookies.filter(x => !(x.name === c.name && dom.endsWith((x.domain || '').replace(/^\./, '')) && (x.path || '/') === c.path));
      changed = changed || before !== data.cookies.length;
      if (!c.expired) { data.cookies.push({ name: c.name, value: c.value, domain: c.domain, path: c.path }); changed = true; }
    }
    if (changed) saveData();
  }
  header(url) {
    const host = url.hostname;
    return data.cookies
      .filter(c => { const d = (c.domain || '').replace(/^\./, ''); return d && (host === d || host.endsWith('.' + d)) && (url.pathname || '/').startsWith(c.path || '/'); })
      .map(c => `${c.name}=${c.value}`).join('; ');
  }
  get(name) { const c = data.cookies.find(x => x.name === name); return c ? c.value : undefined; }
}
const jar = new Jar();

/* ---------------- HTTP (follow redirects, auto XSRF) ---------------- */

async function req(url, opts = {}) {
  const u = new URL(url);
  const headers = {
    'user-agent': UA,
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9,fr;q=0.8',
    ...(opts.headers || {}),
  };
  const ck = jar.header(u);
  if (ck) headers['cookie'] = ck;
  if ((opts.method || 'GET') === 'POST') {
    headers['origin'] = u.origin;
    headers['referer'] = opts.referer || (BASE + '/');
    const xsrf = jar.get('XSRF-TOKEN');
    if (xsrf) headers['x-xsrf-token'] = decodeURIComponent(xsrf);
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 35000);
  try {
    const res = await fetch(u, { method: opts.method || 'GET', headers, body: opts.body, redirect: 'manual', signal: ctl.signal });
    jar.storeFromResponse(res, u);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (loc && (opts._depth || 0) < 6) {
        const downgrade = res.status === 303 || (res.status === 302 && opts.method === 'POST');
        return req(new URL(loc, u).toString(), { ...opts, method: downgrade ? 'GET' : opts.method, body: downgrade ? undefined : opts.body, _depth: (opts._depth || 0) + 1 });
      }
    }
    const text = await res.text().catch(() => '');
    if (process.env.KATA_DEBUG === '1') { try { fs.writeFileSync(path.join(__dirname, `kata-debug-${Date.now()}.html`), text || ''); } catch { /* */ } }
    return { status: res.status, url: u.toString(), text };
  } finally { clearTimeout(timer); }
}

const isCF = r => (r.status === 403 || r.status === 503) && /just a moment|challenge-platform|cf-mitigated|attention required/i.test(r.text || '');
const looksLoggedOut = (html, url) =>
  /\/auth\/login/i.test(url || '') ||
  (/id=["']password["']/i.test(html || '') && /id=["']email["']/i.test(html || ''));

/* ---------------- HTML parsing ---------------- */

const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')); return m ? m[1] : ''; };

function extractForms(html) {
  const forms = [];
  const re = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let m;
  while ((m = re.exec(html))) {
    const f = { action: attr(m[1], 'action'), method: (attr(m[1], 'method') || 'get').toLowerCase(), fields: [], html: m[2] };
    const ir = /<(input|select|textarea)\b[^>]*>/gi;
    let im;
    while ((im = ir.exec(m[2]))) {
      const tag = im[0], name = attr(tag, 'name');
      if (!name) continue;
      const type = (attr(tag, 'type') || '').toLowerCase();
      if (im[1].toLowerCase() === 'select') {
        const opt = m[2].slice(im.index).match(/<option\b[^>]*value\s*=\s*["']([^"']*)["']/i);
        f.fields.push({ name, value: opt ? opt[1] : '' });
      } else if (im[1].toLowerCase() === 'textarea') {
        const tv = m[2].slice(im.index).match(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/i);
        f.fields.push({ name, value: tv ? tv[1] : '' });
      } else if (!['submit', 'button', 'file', 'image'].includes(type)) {
        f.fields.push({ name, value: attr(tag, 'value') });
      }
    }
    forms.push(f);
  }
  return forms;
}

function findRenewCandidates(html) {
  const out = [];
  for (const f of extractForms(html)) {
    if (/renew|renouvel/i.test(f.action + ' ' + f.html)) {
      out.push({ kind: 'form', action: f.action, method: f.method, fields: f.fields, needsCaptcha: /cf-turnstile|g-recaptcha|h-captcha/i.test(f.html) });
    }
  }
  const tagRe = /<(a|button)\b([^>]*)>/gi;
  let t;
  while ((t = tagRe.exec(html))) {
    const href = attr(t[2], 'href');
    const dataUrl = attr(t[2], 'data-url') || attr(t[2], 'data-action') || attr(t[2], 'data-href');
    if (href && /renew|renouvel/i.test(href)) out.push({ kind: 'link', url: href });
    else if (dataUrl && /renew|renouvel/i.test(dataUrl)) out.push({ kind: 'post', url: dataUrl });
  }
  return out;
}

function findServerIds(html) {
  const ids = new Set();
  const re = /(?:\/server|\/servers)\/([A-Za-z0-9_-]{3,})/g;
  let m;
  while ((m = re.exec(html))) {
    if (!/^(login|register|create|new|list)$/i.test(m[1])) ids.add(m[1]);
  }
  return [...ids];
}

const parseIdList = s => (s || '').split(/[,\s]+/).map(x => x.trim()).filter(x => /^[A-Za-z0-9_-]{1,}$/.test(x));

/* ---------------- login over plain HTTP (if panel allows) ---------------- */

async function tryHttpLogin(creds) {
  const page = await req(BASE + '/auth/login', {});
  if (isCF(page)) return { ok: false, reason: 'cf' };
  const forms = extractForms(page.text).filter(f => /password/i.test(f.html));
  if (!forms.length) return { ok: false, reason: 'no-form' };
  const f = forms[0];
  if (/cf-turnstile|g-recaptcha|h-captcha/i.test(f.html)) return { ok: false, reason: 'captcha' };
  const body = new URLSearchParams();
  for (const fl of f.fields) body.append(fl.name, fl.value ?? '');
  body.set('email', creds.email);
  body.set('password', creds.password);
  if ([...body.keys()].includes('remember')) body.set('remember', '1');
  const res = await req(f.action ? new URL(f.action, BASE).toString() : BASE + '/auth/login', {
    method: 'POST', body: body.toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    referer: BASE + '/auth/login',
  });
  const ok = res.status < 400 && !looksLoggedOut(res.text, res.url);
  return { ok, reason: ok ? '' : 'rejected' };
}

/* ---------------- try to renew on a page ---------------- */

async function tryRenewOnPage(pageUrl, html) {
  const report = [];
  for (const c of findRenewCandidates(html)) {
    if (c.needsCaptcha) return { needsBrowser: true, report };
    try {
      let res;
      if (c.kind === 'form') {
        const body = new URLSearchParams();
        for (const fl of c.fields) body.append(fl.name, fl.value ?? '');
        res = await req(c.action ? new URL(c.action, pageUrl).toString() : pageUrl, {
          method: c.method === 'get' ? 'GET' : 'POST',
          body: c.method === 'get' ? undefined : body.toString(),
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          referer: pageUrl,
        });
      } else {
        res = await req(new URL(c.url, pageUrl).toString(), { method: c.kind === 'post' ? 'POST' : 'GET', referer: pageUrl });
      }
      const ok = res.status < 400 && !isCF(res) && !looksLoggedOut(res.text, res.url);
      report.push({ ok, status: res.status, via: c.kind });
      if (ok) return { ok: true, report };
    } catch (e) { report.push({ ok: false, via: c.kind, err: String(e && e.message || e) }); }
    await sleep(rnd(800, 1600));
  }
  for (const id of findServerIds(html).slice(0, 10)) {
    for (const ep of [`/server/${id}/renew`, `/servers/${id}/renew`]) {
      try {
        const res = await req(BASE + ep, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: '', referer: pageUrl });
        const ok = res.status < 400 && !isCF(res) && !looksLoggedOut(res.text, res.url);
        report.push({ ok, status: res.status, via: 'guess', target: ep });
        if (ok) return { ok: true, report };
      } catch { /* keep trying */ }
      await sleep(rnd(500, 1200));
    }
  }
  return { ok: false, report };
}

/* ---------------- one full attempt (server-ID aware) ---------------- */

async function attemptOnce(creds) {
  if (data.lastSuccessAt && MIN_GAP_HOURS > 0) {
    const h = (Date.now() - new Date(data.lastSuccessAt).getTime()) / 36e5;
    if (h < MIN_GAP_HOURS) {
      log(cYellow(`⏭  Already renewed ${h.toFixed(1)}h ago — next cycle in about ${(MIN_GAP_HOURS - h).toFixed(1)}h.`));
      return 0;
    }
  }

  let home = await req(BASE + '/', {});
  if (isCF(home)) { log(cRed('✗ Cloudflare challenged the request → run once:  node kata-ut.mjs --login')); return 3; }

  if (looksLoggedOut(home.text, home.url)) {
    log('🔑 No valid session — logging in...');
    const lg = await tryHttpLogin(creds);
    if (lg.reason === 'captcha') {
      log(cYellow('⚠  The login form uses a Turnstile captcha.'));
      log('    → Run once:  node kata-ut.mjs --login   (or on your PC, then copy kata-renew-data.json)');
      return 2;
    }
    if (!lg.ok) { log(cRed(`✗ HTTP login failed (${lg.reason}) — check email/password, or try --login.`)); return 2; }
    log(cGreen('✓ Login successful.'));
    home = await req(BASE + '/', {});
    if (looksLoggedOut(home.text, home.url)) { log(cRed('✗ Dashboard did not open after login.')); return 2; }
  }

  log('◎ Dashboard reachable — hunting the Renew button...');
  let result = { ok: false, report: [] };

  // 1) the user's own server page(s) first
  const ids = parseIdList(creds.serverId);
  let done = false;
  for (const id of ids) {
    for (const p of [`/server/${id}`, `/servers/${id}`]) {
      try {
        const pg = await req(BASE + p, {});
        if (pg.status >= 400 || looksLoggedOut(pg.text, pg.url)) continue;
        log(cDim(`  → checking your server ${id} ...`));
        const r = await tryRenewOnPage(pg.url, pg.text);
        if (r.ok || r.needsBrowser) { result = r; done = true; break; }
      } catch { /* next */ }
      await sleep(rnd(600, 1400));
    }
    if (done) break;
  }

  // 2) fallback: scan the dashboard like v1
  if (!done && !result.needsBrowser) {
    result = await tryRenewOnPage(home.url, home.text);
    if (!result.ok && !result.needsBrowser) {
      const auto = findServerIds(home.text);
      if (auto.length) log(cDim(`  → found ${auto.length} server(s) on the dashboard, checking each...`));
      outer:
      for (const id of auto.slice(0, 10)) {
        for (const p of [`/server/${id}`, `/servers/${id}`]) {
          const pg = await req(BASE + p, {});
          if (pg.status >= 400 || looksLoggedOut(pg.text, pg.url)) continue;
          const r2 = await tryRenewOnPage(pg.url, pg.text);
          if (r2.needsBrowser || r2.ok) { result = r2; break outer; }
          await sleep(rnd(700, 1500));
        }
      }
    }
  }

  if (result.ok) {
    data.lastSuccessAt = new Date().toISOString();
    data.lastResult = 'ok';
    saveData();
    log(cGreen('✦ Renew successful! Server extended — next run in 24h.'));
    return 0;
  }
  if (result.needsBrowser) {
    data.lastResult = 'needs-browser'; saveData();
    log(cYellow('⚠  The Renew action is protected by a captcha → run:  node kata-ut.mjs --login'));
    return 5;
  }
  data.lastResult = 'not-found'; saveData();
  log(`ℹ  No active Renew button found (${JSON.stringify(result.report || []).slice(0, 180)}).
    You are probably outside the 4-day renewal window — the next daily cycle will try again.
    Debug: KATA_DEBUG=1 node kata-ut.mjs --once  → see kata-debug-*.html files.`);
  return 4;
}

/* ---------------- browser mode (--login) for captcha ---------------- */

async function browserLogin() {
  const creds = await getCredentials();
  let pw;
  try { pw = await import('playwright'); }
  catch {
    log(cRed('✗ playwright is not installed. Run these two commands first:\n    npm i playwright\n    npx playwright install chromium'));
    process.exit(1);
  }
  const { chromium } = pw;
  log('◎ Launching browser...');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', timezoneId: 'Europe/Paris', viewport: { width: 1366, height: 850 } });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  page.on('dialog', d => d.accept().catch(() => {}));

  log('🔑 Logging in with browser...');
  await page.goto(BASE + '/auth/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email', creds.email);
  await page.fill('#password', creds.password);
  const remember = page.locator('#rememberMe');
  if (await remember.count()) { try { await remember.check(); } catch { /* */ } }
  try {
    await page.waitForFunction(() => typeof window.turnstile === 'object' && window.turnstile && typeof window.turnstile.getResponse === 'function' && !!window.turnstile.getResponse(), null, { timeout: 60000 });
    log(cGreen('✓ Turnstile captcha solved automatically.'));
  } catch { log(cYellow('⚠  Turnstile token not found — trying anyway...')); }
  await page.click('#submit').catch(() => page.keyboard.press('Enter'));
  await page.waitForTimeout(6000);
  if (/\/auth\/login/i.test(page.url())) {
    log(cRed('✗ Login failed (captcha/password). Try once with headless:false, or check your password.'));
    await browser.close();
    process.exit(2);
  }
  log(cGreen('✓ Login successful.'));

  data.cookies = (await ctx.cookies(BASE)).map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));
  saveData();
  log(cDim(`✔ Session saved to ${path.basename(DATA_FILE)}`));

  const targets = parseIdList(creds.serverId);
  const page2 = targets.length ? await ctx.newPage() : page;
  for (const id of targets) {
    try {
      await page2.goto(`${BASE}/server/${id}`, { waitUntil: 'domcontentloaded' });
      break;
    } catch { /* next */ }
  }
  const hunt = page2 || page;
  const candidates = [
    hunt.locator('a[href*="renew" i]').first(),
    hunt.locator('button:has-text("Renew")').first(),
    hunt.locator('a:has-text("Renew")').first(),
    hunt.locator('button:has-text("Renouveler")').first(),
    hunt.locator('[class*="renew" i]').first(),
  ];
  let clicked = false;
  for (const loc of candidates) {
    try {
      if (await loc.count() && await loc.isVisible()) { await loc.click({ timeout: 8000 }); clicked = true; log(cGreen('✦ Renew button clicked.')); await page.waitForTimeout(5000); break; }
    } catch { /* next candidate */ }
  }
  if (!clicked) log(cDim('ℹ  Renew button not clickable yet — HTTP mode will handle it on its daily cycle.'));
  data.cookies = (await ctx.cookies(BASE)).map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));
  saveData();
  log('◈ Done.');
  await browser.close();
}

/* ---------------- misc modes ---------------- */

function showVault() {
  const creds = loadVault();
  if (!creds) {
    log(cRed('✗ No readable vault here. Run:  node kata-ut.mjs --setup'));
    process.exit(2);
  }
  console.log('');
  console.log(cMag('  ✦ ─────────── stored credentials ─────────── ✦'));
  console.log(`   email     : ${cCyan(creds.email)}`);
  console.log(`   password  : ${cCyan(creds.password)}`);
  console.log(`   server id : ${cCyan(creds.serverId || '(auto-detect)')}`);
  console.log(cMag('  ✦ ────────────────────────────────────────────✦'));
  console.log('');
}

function showStatus() {
  const locked = vaultExists();
  const creds = locked ? loadVault() : null;
  console.log('');
  console.log(cBold(cCyan('  ✦ KataBumpUT status')));
  console.log(`   vault        : ${locked ? (creds ? cGreen('locked + readable (key intact)') : cYellow('locked but unreadable (key missing?)')) : cRed('not set up')}`);
  if (creds) {
    console.log(`   email        : ${cCyan(creds.email)}`);
    console.log(`   server id    : ${cCyan(creds.serverId || '(auto-detect)')}`);
  }
  const last = data.lastSuccessAt ? new Date(data.lastSuccessAt) : null;
  console.log(`   last renew   : ${last ? cGreen(last.toISOString().replace('T', ' ').slice(0, 16) + ' UTC') : cYellow('never')}`);
  if (last) {
    const nextAt = new Date(Math.min(last.getTime() + RENEW_EVERY_HOURS * 36e5, Date.now() + RETRY_EVERY_MIN * 6e4));
    console.log(`   next cycle   : ${cCyan(nextAt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC')}`);
  }
  console.log(`   last result  : ${data.lastResult || '-'}`);
  console.log(`   interval     : every ${RENEW_EVERY_HOURS}h`);
  console.log('');
}

function printHelp() {
  console.log(`
${cBold(cCyan('KataBumpUT v2.1'))} — auto renew for free KataBump servers
${cDim('© 6amirreza6 — all rights reserved · MIT License')}

  ${cBold('node kata-ut.mjs')}            renew now, then keep auto-renewing every 24h
  ${cBold('node kata-ut.mjs --loop')}        the same, explicit
  ${cBold('node kata-ut.mjs --once')}        one attempt, then exit
  ${cBold('node kata-ut.mjs --setup')}       re-enter email / password / server id
  ${cBold('node kata-ut.mjs --status')}      show vault + renewal state
  ${cBold('node kata-ut.mjs --delete')}      DELETE all stored info instantly (alias: --reset)
  ${cBold('node kata-ut.mjs --login')}       browser mode (captcha) — needs playwright

  ${cDim('While running, type in this console:  renew · status · delete · exit')}
  ${cDim('Your info is stored encrypted (AES-256-GCM), never in plain text.')}
`);
}

/* ---------------- runner ---------------- */

async function runOnce(creds) {
  try { return await attemptOnce(creds); }
  catch (e) { log(cRed(`✗ Unexpected error: ${e && e.stack ? e.stack.split('\n')[0] : e}`)); return 1; }
}

/* ---------------- live command bar — “delete my info”, and friends ---------------- */

let kick = null; // set by startCycle — triggers an immediate renewal
const stdinOpen = () => isTTY || pipedLines.length > 0 || !pipedClosed;

function wipeMyInfo() {
  wiped = true;
  const n = wipeVault();
  try { fs.unlinkSync(DATA_FILE); } catch { /* */ }
  console.log('');
  log(cGreen(`✦ Delete requested — all your info was wiped automatically (${n} file(s)).`));
  log(cDim('   Vault, key file and session cookies are gone. Nothing is stored anymore.'));
  log(cDim('   Run  node kata-ut.mjs  again to set up fresh.'));
  process.exit(0);
}

async function commandBar() {
  if (!stdinOpen()) return;
  console.log(cDim('   ⌨  live console — type:  renew · status · delete (wipe my info) · exit'));
  for (;;) {
    if (!stdinOpen()) return;
    let line = '';
    try { line = ((await askLine('', false)) || '').trim().toLowerCase(); }
    catch { return; }
    if (!line) { if (!stdinOpen()) return; continue; }
    if (line === 'delete' || line === 'reset' || line === 'wipe') {
      wipeMyInfo();
    } else if (line === 'status') {
      showStatus();
    } else if (line === 'renew') {
      if (kick) { log(cCyan('⟳ Renewing right now...')); kick(); }
      else log(cDim('ℹ  The first renewal is already running — this was it.'));
    } else if (line === 'exit' || line === 'quit' || line === 'stop') {
      console.log(cDim('◈ Bye!'));
      process.exit(0);
    } else {
      console.log(cDim(`   unknown command: "${line}" — try:  renew · status · delete · exit`));
    }
  }
}

function startCycle(creds) {
  const everyMs = RENEW_EVERY_HOURS * 36e5;
  let timer = null;
  let busy = false;
  const cycle = async () => {
    if (busy || wiped) return;
    busy = true;
    const c = await runOnce(creds);
    busy = false;
    if (wiped) return;
    const delay = (c === 0 ? everyMs : RETRY_EVERY_MIN * 6e4) + rnd(-300, 300) * 1000;
    timer = setTimeout(cycle, delay);
    if (timer.unref) timer.unref();
  };
  kick = () => {
    if (busy) { log(cDim('ℹ  a renewal is already running.')); return; }
    if (timer) { clearTimeout(timer); timer = null; }
    cycle();
  };
  timer = setTimeout(cycle, everyMs + rnd(-300, 300) * 1000);
  if (timer.unref) timer.unref();
}

async function main() {
  if (MODE === 'help') { printHelp(); process.exit(0); }
  banner();

  if (MODE === 'show') { showVault(); process.exit(0); }
  if (MODE === 'status') { showStatus(); process.exit(0); }
  if (MODE === 'reset') { wipeMyInfo(); }
  if (MODE === 'setup') { await setupWizard(); log(cDim('  tip: just run  node kata-ut.mjs  — it renews and stays alive automatically.')); process.exit(0); }
  if (MODE === 'login') { await browserLogin(); process.exit(0); }

  const creds = await getCredentials();

  // the console is a live panel from the very first second — typing
  // 'delete' wipes every stored secret instantly, no questions asked
  if (MODE !== 'once') commandBar().catch(() => {});

  const code = await runOnce(creds);
  if (wiped) process.exit(0);

  if (MODE === 'once') process.exit(code || 0);

  if (code === 2 || code === 3) {
    // login trouble — but as long as a console is attached we stay alive,
    // keep retrying automatically and keep the live commands available
    if (!stdinOpen()) process.exit(code);
    log(cYellow('⚠  Login is not working yet — I will keep retrying automatically every 15 minutes.'));
    log(cDim('   This console is still live:  renew (retry now) · status · delete (wipe my info) · exit'));
  } else {
    log(cGreen(`🚀 Auto-renew is ON — everything is automatic now: a cycle every ${RENEW_EVERY_HOURS}h (retry every ${RETRY_EVERY_MIN}m after failures).`));
    log(cDim('   Live console:  renew · status · delete (wipe my info) · exit   — Ctrl+C to stop.'));
  }
  startCycle(creds);
}

process.on('SIGINT', () => { console.log(cDim('\n◈ Bye!')); process.exit(0); });

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch(e => { console.error(e); process.exit(1); });

// for tests / development
export { extractForms, findRenewCandidates, findServerIds, parseIdList, looksLoggedOut, saveVault, loadVault, wipeVault, vaultExists };



