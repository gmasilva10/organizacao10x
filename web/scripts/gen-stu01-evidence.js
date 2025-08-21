/* Generate STU01 evidence JSONs */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const BASE = process.env.QA_HOST || 'http://localhost:3000';
const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CRED = { email: 'agoravai@teste.com', password: 'Teste@123' };

async function cookieFor() {
  if (!URL || !ANON) throw new Error('Missing SUPABASE envs');
  const supa = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  let { data, error } = await supa.auth.signInWithPassword(CRED);
  if ((error || !data?.session) && SERVICE) {
    const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 });
    const exists = list?.data?.users?.find(u => (u.email || '').toLowerCase() === CRED.email.toLowerCase());
    if (!exists) {
      await admin.auth.admin.createUser({ email: CRED.email, password: CRED.password, email_confirm: true });
    }
    const retry = await supa.auth.signInWithPassword(CRED);
    if (!retry?.data?.session) throw new Error('No session after create');
    data = retry.data;
  }
  if (!data?.session) throw new Error('No session');
  const ref = (URL.split('https://')[1] || '').split('.')[0];
  const cookieName = `sb-${ref}-auth-token`;
  const { access_token, refresh_token, expires_at, token_type } = data.session;
  const cookieVal = encodeURIComponent(JSON.stringify({ access_token, refresh_token, expires_at, token_type }));
  return `${cookieName}=${cookieVal}`;
}

async function http(pathname, cookie) {
  const res = await fetch(`${BASE}${pathname}`, { headers: { 'Content-Type': 'application/json', Cookie: cookie } });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

async function main() {
  const cookie = await cookieFor();
  const outDir = path.resolve(__dirname, '..', 'Estrutura', 'students');
  fs.mkdirSync(outDir, { recursive: true });

  // 1) list_default.json
  const r1 = await http('/api/students?page=1&page_size=20', cookie);
  fs.writeFileSync(path.join(outDir, 'list_default.json'), JSON.stringify(r1.json || { raw: r1.text }, null, 2));

  // Helper to pick a trainer
  const t = await http('/api/users/trainers', cookie);
  const trainerId = (t.json?.items?.[0]?.user_id) || '';

  // 2) filters_status_trainer.json (status=active + trainer)
  const r2 = await http(`/api/students?status=active${trainerId ? `&trainer_id=${encodeURIComponent(trainerId)}` : ''}&page=1&page_size=20`, cookie);
  fs.writeFileSync(path.join(outDir, 'filters_status_trainer.json'), JSON.stringify(r2.json || { raw: r2.text }, null, 2));

  // 3) pagination_page2.json
  const r3 = await http('/api/students?page=2&page_size=20', cookie);
  fs.writeFileSync(path.join(outDir, 'pagination_page2.json'), JSON.stringify(r3.json || { raw: r3.text }, null, 2));

  console.log('Evidence saved to', outDir);
}

main().catch((e) => { console.error(e); process.exit(1); });
