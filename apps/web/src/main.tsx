import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { app as firebaseApp, db } from "@veglia/firebase-config";
import "./styles/globals.css";
import App from "./App";

// ─── White Label boot ─────────────────────────────────────────────────────────
// Detecta company_id do usuário logado via JWT claims, busca tema no Firestore
// e aplica CSS variables antes de renderizar o app.

async function applyWhiteLabel(): Promise<void> {
  try {
    const auth = getAuth(firebaseApp);
    await new Promise<void>((resolve) => {
      // Timeout de segurança: garante que o app sempre renderiza,
      // mesmo se onAuthStateChanged nunca disparar.
      const timeout = setTimeout(resolve, 3000);

      const unsub = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timeout);
        unsub();
        // try-catch interno: qualquer erro no async callback chama resolve()
        // para que o Promise nunca fique pendurado indefinidamente.
        try {
          if (!user) { resolve(); return; }

          const token = await user.getIdTokenResult();
          const companyId = token.claims["company_id"] as string | undefined;
          if (!companyId) { resolve(); return; }

          const companySnap = await getDoc(doc(db, "companies", companyId));
          if (!companySnap.exists()) { resolve(); return; }

          const theme = companySnap.data()?.theme as Record<string, string> | undefined;
          if (!theme) { resolve(); return; }

          const root = document.documentElement;
          if (theme.primary) {
            root.style.setProperty("--color-mint", theme.primary);
            root.style.setProperty("--tw-color-mint", theme.primary);
          }
          if (theme.secondary) {
            root.style.setProperty("--color-champagne", theme.secondary);
          }
          if (theme.platform_name) {
            document.title = theme.platform_name;
          }

          resolve();
        } catch {
          // Erro silencioso — usa tema padrão Vegl.ia e renderiza normalmente
          resolve();
        }
      });
    });
  } catch {
    // Falha silenciosa — usa tema padrão Vegl.ia
  }
}

applyWhiteLabel().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
});
