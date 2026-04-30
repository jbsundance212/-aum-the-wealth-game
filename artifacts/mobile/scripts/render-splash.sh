#!/usr/bin/env bash
# Renders ./assets/aum_logo.svg into PNG splash assets at 2x density.
# Run once whenever the SVG mark is updated.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/aum_logo.svg
OUT_DIR=assets/images

# 1) Render the SVG at high density and trim to the logo bounds.
# 2) Resize to fit within an 800x800 box (preserves aspect).
# 3) Center on a 1200x1200 #FAFAFA canvas (provides breathing room).
# Expo's splash uses resizeMode=contain so the result fits any device.
magick -background "#FAFAFA" -density 600 "$SRC" \
  -trim +repage \
  -resize 800x800 \
  -background "#FAFAFA" -gravity center -extent 1200x1200 \
  -alpha remove \
  "$OUT_DIR/splash.png"

echo "Wrote $OUT_DIR/splash.png"
