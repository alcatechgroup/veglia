#!/usr/bin/env node
/**
 * setup-onedrive.mjs — Vegl.ia
 * 1. Tenta habilitar Anonymous Auth via Identity Toolkit API
 * 2. Testa escrita anônima no Firestore (simula Power Automate)
 * 3. Adiciona documentos de exemplo no widget OneDrive
 *
 * Uso: node scripts/setup-onedrive.mjs
 */

const PROJECT_ID = "veglia-6e734";
const API_KEY    = "AIzaSyBAIkDujC-hwziBoN6USc97OmD0TgatAXE";
const FS_BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── 1. Tentar habilitar Anonymous Auth ───────────────────────────────────────
async function enableAnonymousAuth() {
  console.log("\n🔐 Tentando habilitar Anonymous Auth...");
  try {
    // Usa admin token se disponível via env
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      throw new Error("ADMIN_TOKEN não definido — pule para o passo manual");
    }
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.anonymous.enabled`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ signIn: { anonymous: { enabled: true } } }),
      }
    );
    if (res.ok) {
      console.log("  ✓ Anonymous Auth habilitado");
      return true;
    }
    throw new Error(await res.text());
  } catch (e) {
    console.log(`  ⚠️  Via API: ${e.message.substring(0, 80)}`);
    console.log("\n  → HABILITE MANUALMENTE (30 segundos):");
    console.log("    1. https://console.firebase.google.com/project/veglia-6e734/authentication/providers");
    console.log("    2. Clique em 'Anonymous'");
    console.log("    3. Ative o toggle e salve");
    return false;
  }
}

// ── 2. Testar escrita anônima (simula Power Automate) ────────────────────────
async function testAnonymousWrite() {
  console.log("\n🧪 Testando escrita anônima no Firestore...");

  // Obter token anônimo
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true }) }
  );
  const auth = await authRes.json();

  if (auth.error) {
    if (auth.error.message?.includes("ANONYMOUS_USER_DISABLED")) {
      console.log("  ✗ Anonymous Auth ainda DESABILITADO");
      console.log("    Habilite no Console e rode novamente: node scripts/setup-onedrive.mjs");
      return false;
    }
    throw new Error(JSON.stringify(auth.error));
  }

  const { idToken } = auth;
  console.log("  ✓ Token anônimo obtido");

  // Gravar documento de teste
  const docRes = await fetch(`${FS_BASE}/onedrive_docs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        name:     { stringValue: "_TEST_setup-verificado.pdf" },
        url:      { stringValue: "https://1drv.ms/test" },
        type:     { stringValue: "pdf" },
        added_at: { timestampValue: new Date().toISOString() },
        added_by: { stringValue: "setup-onedrive.mjs" },
      },
    }),
  });

  if (docRes.ok) {
    const doc = await docRes.json();
    const docId = doc.name.split("/").pop();
    console.log(`  ✓ Documento de teste criado: onedrive_docs/${docId}`);
    console.log("  ✓ Power Automate conseguirá gravar — integração OK");
    return true;
  } else {
    const err = await docRes.json();
    console.log("  ✗ Escrita falhou:", JSON.stringify(err.error));
    return false;
  }
}

// ── 3. Adicionar documentos reais de exemplo ─────────────────────────────────
async function seedDocs(adminToken) {
  if (!adminToken) {
    console.log("\n📄 Pulando seed de documentos (sem ADMIN_TOKEN)");
    return;
  }

  console.log("\n📄 Adicionando documentos de exemplo...");
  const docs = [
    { name: "Term Sheet — Sócios Vegl.ia v1.0.pdf",       type: "pdf",  size_kb: 245 },
    { name: "Roadmap Estratégico Vegl.ia 2026.pdf",        type: "pdf",  size_kb: 180 },
    { name: "Brandbook Vegl.ia — Identidade Visual.pdf",   type: "pdf",  size_kb: 320 },
    { name: "Brief Conteúdo Lei 15.377 — Módulos 1-4.docx",type: "docx", size_kb: 95  },
    { name: "Proposta Comercial VR — Rascunho.pptx",       type: "pptx", size_kb: 540 },
  ];

  for (const d of docs) {
    const res = await fetch(`${FS_BASE}/onedrive_docs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name:     { stringValue: d.name },
          url:      { stringValue: "https://1drv.ms/f/c/13692bb4e079b1e0/IgARsu_FMXRTRpt-nTgM-781AYlyzKOAiXdvQZBBkOYVItc" },
          type:     { stringValue: d.type },
          size_kb:  { integerValue: String(d.size_kb) },
          added_at: { timestampValue: new Date().toISOString() },
          added_by: { stringValue: "OneDrive Sync" },
        },
      }),
    });
    if (res.ok) console.log(`  ✓ ${d.name}`);
    else console.log(`  ✗ Falhou: ${d.name}`);
  }
}

// ── Guia Power Automate ───────────────────────────────────────────────────────
function printGuide() {
  console.log(`
${"=".repeat(55)}
📋 CONFIGURAÇÃO POWER AUTOMATE → ONEDRIVE → FIREBASE
${"=".repeat(55)}

Crie um Flow com gatilho "When a file is created" (OneDrive)
Pasta: /Vegl.ia (ou a pasta compartilhada do time)

Ação 1 — HTTP (obter token anônimo):
  POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}
  Body: {"returnSecureToken": true}
  Salvar: idToken = @{body('Acao_1')['idToken']}

Ação 2 — HTTP (gravar no Firestore):
  POST https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/onedrive_docs
  Header: Authorization: Bearer @{variables('idToken')}
  Body:
  {
    "fields": {
      "name":     {"stringValue": "@{triggerOutputs()?['body/Name']}"},
      "url":      {"stringValue": "@{triggerOutputs()?['body/Path']}"},
      "type":     {"stringValue": "@{toLower(last(split(triggerOutputs()?['body/Name'],'.')))}" },
      "size_kb":  {"integerValue": "@{string(div(triggerOutputs()?['body/Size'],1024))}"},
      "added_at": {"timestampValue": "@{utcNow()}"},
      "added_by": {"stringValue": "Power Automate"}
    }
  }

✅ Resultado: qualquer arquivo novo na pasta aparece
   automaticamente no widget OneDrive do Command Center.
`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔗 Vegl.ia — Setup OneDrive Integration\n" + "=".repeat(55));

  await enableAnonymousAuth();
  const ok = await testAnonymousWrite();
  await seedDocs(process.env.ADMIN_TOKEN);
  printGuide();

  console.log(ok
    ? "\n🎉 Integração OneDrive → Firebase PRONTA!"
    : "\n⚠️  Habilite Anonymous Auth e rode novamente."
  );
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
