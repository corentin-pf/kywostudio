#!/bin/bash
# Redimensionne une image pour le web (sans jamais l'agrandir) et la convertit en JPG,
# sauf si elle a de la transparence (elle reste alors en PNG).
# Usage : outils/preparer-image.sh source destination-sans-extension largeur-max
src="$1"; dest="$2"; max="$3"
w=$(sips -g pixelWidth "$src" | tail -1 | awk '{print $2}')
alpha=$(sips -g hasAlpha "$src" | tail -1 | awk '{print $2}')
args=()
[ "$w" -gt "$max" ] && args+=(--resampleWidth "$max")
mkdir -p "$(dirname "$dest")"
if [ "$alpha" = "yes" ] && [ ${#args[@]} -eq 0 ]; then
  cp "$src" "$dest.png"   # rien à réduire : simple copie
elif [ "$alpha" = "yes" ]; then
  sips "${args[@]}" "$src" --out "$dest.png" >/dev/null
else
  sips -s format jpeg -s formatOptions 82 "${args[@]}" "$src" --out "$dest.jpg" >/dev/null
fi
