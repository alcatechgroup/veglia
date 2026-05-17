#!/bin/bash
# predeploy.sh — executar antes de firebase deploy --only hosting
# Garante que landing.html seja servida na raiz (/) e a SPA em /app.html

DIST="apps/web/dist"

if [ ! -f "$DIST/landing.html" ]; then
  echo "❌ $DIST/landing.html não encontrado. Execute o build primeiro."
  exit 1
fi

# SPA React → app.html
cp "$DIST/index.html" "$DIST/app.html"
# Landing → index.html (raiz do site)
cp "$DIST/landing.html" "$DIST/index.html"

echo "✓ Swap concluído: landing.html → index.html | SPA → app.html"
echo "✓ Pronto para: firebase deploy --only hosting"
