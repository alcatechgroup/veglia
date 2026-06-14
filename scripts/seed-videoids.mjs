#!/usr/bin/env node
/**
 * seed-videoids.mjs — Vegl.ia
 * Grava os videoIds do YouTube em /config/videoIds no Firestore.
 *
 * Estrutura: cada módulo tem DOIS vídeos — percurso "rh" (gestor) e
 * percurso "colaborador". A plataforma exibe o vídeo certo conforme o
 * papel do usuário logado (collaborator → colaborador, demais → rh).
 *
 * Aula 01 de cada gravação = percurso Gestor RH.
 * Aula 02 de cada gravação = percurso Colaborador.
 *
 * Como usar:
 *   1. Publique os vídeos no YouTube (Não listado).
 *   2. Cole os IDs no objeto VIDEO_IDS abaixo (o ID é o trecho depois de
 *      "watch?v=" ou "youtu.be/" na URL; o script aceita a URL inteira também).
 *   3. Rode: RODOLFO_SENHA=suasenha node scripts/seed-videoids.mjs
 *
 * Mapeamento gravação → slot:
 *   MOD 01 Aula 01 / Aula 02   → lei15377.m01.{rh, colaborador}  (Compliance Legal)
 *   MOD 02 _01 / _02           → lei15377.m02.{rh, colaborador}  (Vacinação)
 *   MOD 03 _01 / _02           → lei15377.m03.{rh, colaborador}  (Prevenção Cânceres)
 *   MOD 04 _01 / _02           → lei15377.m04.{rh, colaborador}  (Saúde Mental)
 *   MOD 05 _01 / _02           → nr1.m01.{rh, colaborador}       (NR-1)
 *   MOD 06 _01 / _02           → nr1.m02.{rh, colaborador}       (GRO-PGR)
 *
 * Slots vazios ("") são ignorados — pode rodar o script várias vezes,
 * preenchendo aos poucos. Só grava o que estiver preenchido aqui.
 */

// ═══════════════════════════════════════════════════════════════════
// COLE OS IDs DO YOUTUBE AQUI ↓   (rh = Aula 01 · colaborador = Aula 02)
// ═══════════════════════════════════════════════════════════════════
const VIDEO_IDS = {
  lei15377: {
    m01: { rh: "t75F7dFIJtY", colaborador: "1y2TlrRWHCY" }, // Compliance Legal
    m02: { rh: "WIUm7HErPQY", colaborador: "3kW284C46vM" }, // Vacinação Adulta
    m03: { rh: "V_aAyLLx7pc", colaborador: "iysbCXSQlM8" }, // Prevenção de Cânceres
    m04: { rh: "zvr69vk6QCc", colaborador: "ARy79h7jxHY" }, // Saúde Mental
  },
  nr1: {
    m01: { rh: "VgV2MfMBxW8", colaborador: "YfXLRjSe9yw" }, // O que é a NR-1
    m02: { rh: "Jq58uq2UmOg", colaborador: "g3ffY5O3vlA" }, // GRO e PGR
  },
  // Conteúdo T2 — catalogado no Firestore, mas a plataforma só consome na Fase 2
  t2_draft: {
    m07: { rh: "orPwM95dHoQ", colaborador: "wzhsp84JSLI" }, // Riscos Psicossociais
    m08: { rh: "4nhKCiTATVU", colaborador: "QDZv4cj7174" }, // CIPA e SESMT
    m09: { rh: "", colaborador: "" },            // Acidentes e CAT
  },
};
// ═══════════════════════════════════════════════════════════════════

const PROJECT_ID = "veglia-6e734";
const API_KEY    = "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE";
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE  = `https://identitytoolkit.googleapis.com/v1`;

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function toFields(obj) {
  const toVal = (v) => {
    if (typeof v === "string") return { stringValue: v };
    if (typeof v === "object") return { mapValue: { fields: toFields(v) } };
    return { stringValue: String(v) };
  };
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toVal(v)]));
}

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

async function main() {
  console.log("🎬 Vegl.ia — Seed videoIds\n" + "=".repeat(45));

  // extrai o ID de 11 caracteres de uma URL completa ou ID solto
  const extractId = (raw) =>
    raw.trim()
      .replace(/^.*(?:watch\?v=|youtu\.be\/|embed\/)/, "")
      .replace(/[?&].*$/, "");

  // valida e filtra slots preenchidos (estrutura: trilha → módulo → percurso)
  const filled = {};
  const skipped = [];
  const invalid = [];
  for (const [trilha, mods] of Object.entries(VIDEO_IDS)) {
    for (const [mod, percursos] of Object.entries(mods)) {
      for (const [percurso, id] of Object.entries(percursos)) {
        const clean = extractId(id);
        if (!clean) { skipped.push(`${trilha}.${mod}.${percurso}`); continue; }
        if (!YT_ID_RE.test(clean)) { invalid.push(`${trilha}.${mod}.${percurso} = "${id}"`); continue; }
        ((filled[trilha] ??= {})[mod] ??= {})[percurso] = clean;
      }
    }
  }

  if (invalid.length) {
    console.error("❌ IDs inválidos (esperado 11 caracteres do YouTube):");
    invalid.forEach((s) => console.error(`   ${s}`));
    process.exit(1);
  }
  if (!Object.keys(filled).length) {
    console.error("❌ Nenhum videoId preenchido. Edite o objeto VIDEO_IDS no topo do script.");
    process.exit(1);
  }

  const senha = process.env.RODOLFO_SENHA;
  if (!senha) {
    console.error("❌ Defina a variável RODOLFO_SENHA:\n   RODOLFO_SENHA=suasenha node scripts/seed-videoids.mjs");
    process.exit(1);
  }
  // Qualquer usuário com role=admin pode gravar config/videoIds.
  // Default: rodolfo@veglia.com.br. Override via RODOLFO_EMAIL.
  const email = process.env.RODOLFO_EMAIL || "rodolfo@veglia.com.br";

  console.log(`\n🔑 Autenticando ${email}...`);
  const { idToken: token } = await signIn(email, senha);
  console.log("  ✓ token obtido");

  // updateMask no nível do percurso para não apagar o outro percurso já gravado
  const paths = [];
  for (const [trilha, mods] of Object.entries(filled))
    for (const [mod, percursos] of Object.entries(mods))
      for (const percurso of Object.keys(percursos))
        paths.push(`updateMask.fieldPaths=${trilha}.${mod}.${percurso}`);

  const url = `${FS_BASE}/config/videoIds?${paths.join("&")}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: toFields(filled) }),
  });
  if (!res.ok) throw new Error(`Firestore config/videoIds: ${(await res.text()).substring(0, 200)}`);

  console.log("\n✅ Gravado em /config/videoIds:");
  for (const [trilha, mods] of Object.entries(filled))
    for (const [mod, percursos] of Object.entries(mods))
      for (const [percurso, id] of Object.entries(percursos))
        console.log(`  ✓ ${trilha}.${mod}.${percurso} = ${id}`);
  if (skipped.length) console.log(`\n⏭️  Slots vazios ignorados: ${skipped.join(", ")}`);

  console.log(`
${"=".repeat(45)}
Próximo passo: abra https://veglia-6e734.web.app/app/trilhas
e confira se os vídeos carregam no player.`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
