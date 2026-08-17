const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const dir = path.join(root, 'mission000_seedance_keyframes');
const base = path.join(dir, 'base-map-1920x1080.png');

async function main() {
  const svgs = fs.readdirSync(dir)
    .filter((name) => /^\d{2}_(start|end)\.svg$/.test(name))
    .sort();

  const baseBuffer = await sharp(base)
    .resize(1920, 1080, { fit: 'cover' })
    .png()
    .toBuffer();

  for (let index = 0; index < svgs.length; index += 3) {
    const batch = svgs.slice(index, index + 3);
    await Promise.all(batch.map(async (svgName) => {
      const output = path.join(dir, svgName.replace(/\.svg$/, '.png'));
      const overlay = fs.readFileSync(path.join(dir, svgName));
      await sharp(baseBuffer)
        .composite([{ input: overlay, top: 0, left: 0 }])
        .png({ compressionLevel: 8, adaptiveFiltering: true })
        .toFile(`${output}.new`);
      fs.renameSync(`${output}.new`, output);
    }));
  }

  console.log(`Rendered ${svgs.length} PNG keyframes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
