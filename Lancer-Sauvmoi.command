#!/usr/bin/env bash
# ============================================================
#   Sauv'Moi - Lanceur en un clic (macOS / Linux)
#   Double-cliquez (macOS) ou lancez ./Lancer-Sauvmoi.command
# ============================================================

# Se placer dans le dossier du script (important pour le double-clic)
cd "$(dirname "$0")" || exit 1

echo ""
echo "  ===================================="
echo "     Sauv'Moi - demarrage en cours"
echo "  ===================================="
echo ""

# 1) Verifier Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "  [ERREUR] Node.js n'est pas installe."
  echo "  Telechargez-le sur https://nodejs.org puis relancez ce fichier."
  echo ""
  read -n 1 -s -r -p "  Appuyez sur une touche pour fermer..."
  exit 1
fi

# 2) Installer les dependances la premiere fois seulement
if [ ! -d "node_modules" ]; then
  echo "  Premiere utilisation : installation des dependances..."
  echo "  (cela peut prendre une minute, une seule fois)"
  echo ""
  npm install || { echo "  [ERREUR] Installation echouee. Verifiez votre connexion."; read -n 1 -s -r; exit 1; }
fi

# 3) Ouvrir le navigateur apres un court delai (en tache de fond)
URL="http://localhost:3000"
( sleep 3
  if command -v open >/dev/null 2>&1; then open "$URL"        # macOS
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"  # Linux
  fi
) &

# 4) Demarrer le serveur (reste au premier plan ; Ctrl+C pour arreter)
echo ""
echo "  Ouverture du navigateur sur $URL ..."
echo "  L'application tourne. NE FERMEZ PAS cette fenetre pendant la demo."
echo "  Pour arreter : Ctrl+C."
echo ""
npm start
