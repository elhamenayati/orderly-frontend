const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const assetsDir = process.argv[2];
const root = path.join(__dirname, "..");
const brandDir = path.join(root, "public", "images", "brand");

const sources = {
  white: "Abrink_Beauty_Logo_with_Lipstick",
  color: "abrinak_main_logo_without_bg",
  mark: "abrinka_mini_logo",
};

/** Uploads keep their original name plus a unique suffix, so the newest match wins. */
function findSource(fragment) {
  const matches = fs
    .readdirSync(assetsDir)
    .filter((file) => file.includes(fragment))
    .map((file) => path.join(assetsDir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (matches.length === 0) throw new Error(`missing source for ${fragment}`);
  return matches[0];
}

/** Black background → alpha; colours are un-multiplied so edges keep their hue. */
async function removeBlack(file) {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  const low = 12;
  const high = 48;

  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const peak = Math.max(r, g, b);
    const alpha = Math.min(1, Math.max(0, (peak - low) / (high - low)));
    const scale = alpha > 0 ? Math.min(1 / alpha, 255 / Math.max(peak, 1)) : 0;
    out[j] = Math.round(r * scale);
    out[j + 1] = Math.round(g * scale);
    out[j + 2] = Math.round(b * scale);
    out[j + 3] = Math.round(alpha * 255);
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
    .then((buffer) => sharp(buffer).trim({ threshold: 1 }).png().toBuffer());
}

async function main() {
  fs.mkdirSync(brandDir, { recursive: true });

  const white = await removeBlack(findSource(sources.white));
  const color = await removeBlack(findSource(sources.color));
  const mark = await removeBlack(findSource(sources.mark));

  await sharp(white).toFile(path.join(brandDir, "abrinak-logo-white-v2.png"));
  await sharp(color).toFile(path.join(brandDir, "abrinak-logo-v2.png"));
  await sharp(mark).toFile(path.join(brandDir, "abrinak-mark-v2.png"));

  const squareMark = (size, padding) =>
    sharp(mark)
      .resize(size - padding * 2, size - padding * 2, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png();

  await squareMark(512, 24).toFile(path.join(root, "app", "icon.png"));
  await squareMark(192, 10).toFile(path.join(root, "public", "icon-192.png"));
  await squareMark(512, 24).toFile(path.join(root, "public", "icon-512.png"));
  await sharp(mark)
    .resize(148, 148, { fit: "contain", background: "#ffffff" })
    .extend({ top: 16, bottom: 16, left: 16, right: 16, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(root, "app", "apple-icon.png"));

  const icoSizes = [16, 32, 48];
  const icoImages = await Promise.all(
    icoSizes.map((size) => squareMark(size, size >= 32 ? 1 : 0).toBuffer()),
  );
  const header = Buffer.alloc(6 + icoSizes.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoSizes.length, 4);
  let offset = header.length;
  icoSizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(icoImages[index].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += icoImages[index].length;
  });
  fs.writeFileSync(
    path.join(root, "app", "favicon.ico"),
    Buffer.concat([header, ...icoImages]),
  );

  for (const name of ["abrinak-logo-white-v2.png", "abrinak-logo-v2.png", "abrinak-mark-v2.png"]) {
    const meta = await sharp(path.join(brandDir, name)).metadata();
    console.log(name, `${meta.width}x${meta.height}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
