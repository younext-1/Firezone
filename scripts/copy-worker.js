const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../node_modules/maplibre-gl/dist');
const destDir = path.join(__dirname, '../public/worker');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir).filter((file) => file.endsWith('.mjs'));
  for (const file of files) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }
  console.log(`[IGNIS-MA] Synced ${files.length} MapLibre worker files to public/worker/`);
}
