#!/bin/bash

# Generate favicon.ico from favicon.png
# Requires ImageMagick: brew install imagemagick

set -e

INPUT="client/public/favicon.png"
OUTPUT="client/public/favicon.ico"

echo "🎨 Generating favicon.ico from $INPUT..."

if ! command -v convert &> /dev/null && ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick not installed"
    echo ""
    echo "Install with:"
    echo "  macOS:   brew install imagemagick"
    echo "  Ubuntu:  sudo apt-get install imagemagick"
    echo "  Windows: https://imagemagick.org/script/download.php"
    echo ""
    echo "Or use online converter:"
    echo "  https://convertio.co/png-ico/"
    echo "  https://www.favicon-generator.org/"
    exit 1
fi

# Try 'convert' first (older versions), then 'magick' (newer versions)
if command -v convert &> /dev/null; then
    convert "$INPUT" -define icon:auto-resize=16,32,48,64,256 "$OUTPUT"
elif command -v magick &> /dev/null; then
    magick "$INPUT" -define icon:auto-resize=16,32,48,64,256 "$OUTPUT"
fi

echo "✅ Generated $OUTPUT"
echo "   Sizes: 16x16, 32x32, 48x48, 64x64, 256x256"
