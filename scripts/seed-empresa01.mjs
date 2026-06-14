#!/usr/bin/env node
/**
 * seed-empresa01.mjs — Vegl.ia
 * Cadastra a Empresa 01 de teste (RHHUB) + usuário RH + colaborador.
 *
 * NÃO precisa da senha do admin veglia.com.br. Usa o fluxo real do produto:
 *   1. Cria/loga o usuário RH (rodolfo@rhhub.com.br) via Firebase Auth REST.
 *   2. Chama a Cloud Function createCompany com o token do RH → cria a empresa
 *      e seta o RH como admin do tenant (syncUserClaims propaga os claims).
 *   3. Cria/loga o colaborador (alexandro@rhhub.com.br) e grava o próprio
 *      doc users/{uid} com role collaborator no mesmo company_id.
 *
 * Uso:  node scripts/seed-empresa01.mjs
 */

const PROJECT_ID = "veglia-6e734";
const API_KEY    = "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE";
const REGION     = "us-central1";
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE  = `https://identitytoolkit.googleapis.com/v1`;
const FN_BASE    = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

const COMPANY_NAME = "RHHUB TECNOLOGIA DA INFORMAÇÃO LTDA";
const CNPJ_DIGITS  = "46009860000197"; // 14 dígitos, sem máscara (busca em AcessoRH usa assim)
const SENHA        = "123mudar";

const RH  = { email: "rodolfo@rhhub.com.br",   nome: "Rodolfo Nascimento" };
const COL = { email: "alexandro@rhhub.com.br", nome: "Alexandro" };

// ── Firebase Auth REST ──────────────────────────────────────────────────────
async function signUp(email, password, displayName) {
  const res = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const d = await res.json();
  if (d.idToken) return { uid: d.localId, token: d.idToken, created: true };
  if (d.error?.message === "EMAIL_EXISTS") return signIn(email, password);
  throw new Error(`signUp ${email}: ${d.error?.message}`);
}

async function signIn(email, password) {
  const res = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const d = await res.json();
  if (!d.idToken) throw new Error(`signIn ${email}: ${d.error?.message} (a senha pode diferir de "${SENHA}")`);
  return { uid: d.localId, token: d.idToken, created: false };
}

function decodeClaims(idToken) {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());
    return { company_id: payload.company_id, role: payload.role };
  } catch { return {}; }
}

// ── Cloud Function callable (v2) ────────────────────────────────────────────
async function callFn(name, token, data) {
  const res = await fetch(`${FN_BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  });
  const d = await res.json().catch(() => ({}));
  if (d.error) throw new Error(`${name}: ${d.error.message || JSON.stringify(d.error)}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return d.result;
}

// ── Firestore REST ──────────────────────────────────────────────────────────
function toFields(obj) {
  const toVal = (v) => {
    if (v === null) return { nullValue: null };
    if (typeof v === "string") return { stringValue: v };
    if (typeof v === "number" && Number.isInteger(v)) return { integerValue: String(v) };
    if (typeof v === "number") return { doubleValue: v };
    return { stringValue: String(v) };
  };
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toVal(v)]));
}

async function fsCreateUser(uid, data, token) {
  const res = await fetch(`${FS_BASE}/users/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`users/${uid}: ${(await res.text()).substring(0, 200)}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🏢 Vegl.ia — Seed Empresa 01 (RHHUB)\n" + "=".repeat(48));

  // 1. RH
  console.log("\n👤 Usuário RH...");
  let rh = await signUp(RH.email, SENHA, RH.nome);
  console.log(`  ✓ ${RH.email} (${rh.created ? "criado" : "já existia"}) uid=${rh.uid}`);

  // 2. Empresa via createCompany (seta RH como admin do tenant)
  console.log("\n🏗️  Criando empresa via Cloud Function createCompany...");
  let companyId;
  const already = decodeClaims(rh.token).company_id;
  if (already) {
    companyId = already;
    console.log(`  ℹ️  RH já pertence à empresa ${companyId} — pulando createCompany`);
  } else {
    const r = await callFn("createCompany", rh.token, {
      companyName: COMPANY_NAME,
      cnpj: CNPJ_DIGITS,
    });
    companyId = r.company_id;
    console.log(`  ✓ companies/${companyId} criada · "${COMPANY_NAME}"`);
  }

  // 3. Aguarda syncUserClaims propagar o company_id/role no JWT do RH
  console.log("\n⏳ Aguardando claims do RH propagarem...");
  let rhClaims = {};
  for (let i = 0; i < 6; i++) {
    await sleep(2000);
    const fresh = await signIn(RH.email, SENHA);
    rhClaims = decodeClaims(fresh.token);
    if (rhClaims.company_id) { rh = fresh; break; }
    process.stdout.write(".");
  }
  console.log(`\n  ✓ RH claims: role=${rhClaims.role} company_id=${rhClaims.company_id}`);

  // 4. Colaborador — cria Auth user e grava o próprio doc no tenant
  console.log("\n🧑‍💼 Colaborador...");
  const col = await signUp(COL.email, SENHA, COL.nome);
  console.log(`  ✓ ${COL.email} (${col.created ? "criado" : "já existia"}) uid=${col.uid}`);

  await fsCreateUser(col.uid, {
    uid: col.uid,
    company_id: companyId,
    role: "collaborator",
    email: COL.email,
    displayName: COL.nome,
    createdAt: Date.now(),
  }, col.token);
  console.log(`  ✓ users/${col.uid} → collaborator @ ${companyId}`);

  // 5. Confirma claims do colaborador
  console.log("\n⏳ Aguardando claims do colaborador...");
  let colClaims = {};
  for (let i = 0; i < 6; i++) {
    await sleep(2000);
    colClaims = decodeClaims((await signIn(COL.email, SENHA)).token);
    if (colClaims.company_id) break;
    process.stdout.write(".");
  }
  console.log(`\n  ✓ Colaborador claims: role=${colClaims.role} company_id=${colClaims.company_id}`);

  console.log(`
${"=".repeat(48)}
✅ Empresa 01 cadastrada!

  Empresa:  ${COMPANY_NAME}
  CNPJ:     46.009.860/0001-97
  ID:       ${companyId}

🔑 Logins de teste (senha: ${SENHA})
  RH:          ${RH.email}   → percurso Gestor RH
  Colaborador: ${COL.email}  → percurso Colaborador

  Acesso RH:   https://veglia-6e734.web.app/acesso
  Login geral: https://veglia-6e734.web.app/login
`);
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
