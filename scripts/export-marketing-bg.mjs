import sharp from "sharp";
import { copyFile, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dir = path.join(root, "public", "marketing");
const source = path.join(dir, "chora-village-bg-source.png");
const legacy = path.join(dir, "chora-village-bg.png");
const TARGET_WIDTH = 2560;

async function main() {
  let input = source;
  try {
    await stat(source);
  } catch {
    await copyFile(legacy, source);
    input = source;
    console.log("Backed up original to chora-village-bg-source.png");
  }

  const meta = await sharp(input).metadata();
  console.log(`Source: ${meta.width}x${meta.height}`);

  const upscaled = sharp(input).resize(TARGET_WIDTH, null, {
    kernel: sharp.kernel.lanczos3,
    withoutEnlargement: false,
  }).sharpen({ sigma: 0.65, m1: 0.45, m2: 2.2 });

  const webpPath = path.join(dir, "chora-village-bg.webp");
  const jpgPath = path.join(dir, "chora-village-bg.jpg");

  await upscaled.clone().webp({ quality: 90, effort: 6 }).toFile(webpPath);
  await upscaled.clone().jpeg({ quality: 93, mozjpeg: true }).toFile(jpgPath);

  const outMeta = await sharp(webpPath).metadata();
  console.log(`Export: ${outMeta.width}x${outMeta.height}`);

  const webp = await stat(webpPath);
  const jpg = await stat(jpgPath);
  console.log(`webp: ${(webp.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`jpg:  ${(jpg.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
