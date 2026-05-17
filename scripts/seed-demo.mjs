#!/usr/bin/env node
/**
 * seed-demo.mjs — Vegl.ia
 * Cria empresa demo + colaboradores via Firebase REST API (sem ADC).
 *
 * Uso:
 *   RODOLFO_SENHA=suasenha node scripts/seed-demo.mjs
 */

const PROJECT_ID = "veglia-6e734";
const API_KEY    = "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE";
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE  = `https://identitytoolkit.googleapis.com/v1`;

const COMPANY_ID   = "demo-veglia-2026";
const COMPANY_NAME = "Vegl.ia Demo";

const SOCIOS = [
  { email: "rodolfo@veglia.com.br", uid: "whVy3d0UpRd0cQGIfKcwbpA2rY33", nome: "Rodolfo Nascimento", role: "admin" },
  { email: "fabio@veglia.com.br",   uid: "fPXwqSUg5cdR1ucb6Bcsf51bb783", nome: "Fábio",              role: "admin_rh" },
  { email: "thiago@veglia.com.br",  uid: "RJa8lXS3kkdnoq7qBxWGMMwjAcV2", nome: "Thiago",             role: "admin_rh" },
];

const DEMO_COLABORADORES = [
  { email: "rh.demo@veglia.com.br",           nome: "Marina Santos", cargo: "Coordenadora de RH",  senha: "Veglia2026!", role: "admin_rh"    },
  { email: "colaborador.demo@veglia.com.br",   nome: "Carlos Silva",  cargo: "Analista de TI",      senha: "Veglia2026!", role: "colaborador" },
  { email: "colaboradora.demo@veglia.com.br",  nome: "Ana Souza",     cargo: "Gerente Financeiro",  senha: "Veglia2026!", role: "colaborador" },
];

// ── Firestore REST ────────────────────────────────────────────────────────────
function toFields(obj) {
  const toVal = (v) => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === "boolean") return { booleanValue: v };
    if (typeof v === "string")  return { stringValue: v };
    if (v instanceof Date)      return { timestampValue: v.toISOString() };
    if (typeof v === "number" && Number.isInteger(v)) return { integerValue: String(v) };
    if (typeof v === "number")  return { doubleValue: v };
    if (typeof v === "object")  return { mapValue: { fields: toFields(v) } };
    return { stringValue: String(v) };
  };
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toVal(v)]));
}

async function fsSet(col, id, data, token) {
  const url = `${FS_BASE}/${col}/${id}`;
  const body = JSON.stringify({ fields: toFields({ ...data, updated_at: new Date() }) });
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(url, { method: "PATCH", headers, body });
  if (!res.ok) throw new Error(`Firestore ${col}/${id}: ${(await res.text()).substring(0, 150)}`);
}

// ── Firebase Auth REST ────────────────────────────────────────────────────────
async function signIn(email, password) {
  const res = await fetch(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const d = await res.json();
  if (!d.idToken) throw new Error(`signIn ${email}: ${d.error?.message}`);
  return d;
}

async function signUp(email, password, displayName) {
  const res = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const d = await res.json();
  if (d.localId) return d;
  if (d.error?.message === "EMAIL_EXISTS") {
    // tenta login com a senha padrão
    try { return await signIn(email, password); } catch {}
    console.log(`  → ${email} já existe (senha diferente da demo — mantida)`);
    return null;
  }
  throw new Error(`signUp ${email}: ${d.error?.message}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Vegl.ia — Seed demo\n" + "=".repeat(45));

  const senha = process.env.RODOLFO_SENHA;
  if (!senha) {
    console.error("❌ Defina a variável RODOLFO_SENHA:\n   RODOLFO_SENHA=suasenha node scripts/seed-demo.mjs");
    process.exit(1);
  }

  console.log("\n🔑 Autenticando Rodolfo...");
  const { idToken: token } = await signIn("rodolfo@veglia.com.br", senha);
  console.log("  ✓ token obtido");

  console.log("\n📁 Criando empresa demo...");
  await fsSet("companies", COMPANY_ID, {
    name: COMPANY_NAME, cnpj: "00.000.000/0001-00", plano: "pro",
    ativo: true, logo_url: null, owner_uid: SOCIOS[0].uid,
    total_employees: 6, created_at: new Date(),
  }, token);
  console.log(`  ✓ companies/${COMPANY_ID}`);

  console.log("\n👥 Registrando sócios no Firestore...");
  for (const s of SOCIOS) {
    await fsSet("users", s.uid, {
      uid: s.uid, email: s.email, name: s.nome,
      company_id: COMPANY_ID, role: s.role,
      status_compliance: "exempt", created_at: new Date(),
    }, token);
    console.log(`  ✓ ${s.email} → ${s.role}`);
  }

  console.log("\n🧑‍💼 Criando colaboradores de demo...");
  for (const c of DEMO_COLABORADORES) {
    const user = await signUp(c.email, c.senha, c.nome);
    if (!user) continue;
    await fsSet("users", user.localId, {
      uid: user.localId, email: c.email, name: c.nome, cargo: c.cargo,
      company_id: COMPANY_ID, role: c.role,
      status_compliance: c.role === "admin_rh" ? "exempt" : "pending",
      created_at: new Date(),
    }, token);
    console.log(`  ✓ ${c.nome} (${c.email}) → ${c.role}`);
  }

  console.log(`
${"=".repeat(45)}
✅ Seed concluído!

🔑 Acesso demo:

  Admin RH:     rh.demo@veglia.com.br    / Veglia2026!
  Colaborador:  colaborador.demo@veglia.com.br  / Veglia2026!
  URL: https://veglia-6e734.web.app/login

⚠️  Custom claims (role/company_id no JWT) são setados pela
    Cloud Function syncUserClaims no primeiro login.
    Enquanto o Blaze não estiver ativo, sete manualmente:

    Firebase Console → Authentication → [usuário] → ⋮ → Edit
    Custom claims: {"role":"admin_rh","company_id":"demo-veglia-2026"}
`);
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
