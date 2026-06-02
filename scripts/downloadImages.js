import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMPUS_DATA_PATH = path.join(__dirname, '..', 'data', 'campusData.ts');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

async function downloadImage(url, destPath) {
  try {
    // Handle double-URL bug for SUB:
    let cleanUrl = url.trim();
    if (cleanUrl.includes('http', 5)) {
      // Split by http and take the first valid URL
      const parts = cleanUrl.split('http');
      cleanUrl = 'http' + parts[1];
    }

    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log(`Successfully downloaded image to: ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error.message);
    return false;
  }
}

async function run() {
  console.log('Starting image downloader and local migration...');

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let content = fs.readFileSync(CAMPUS_DATA_PATH, 'utf-8');

  // Regex to match individual location objects inside RAW_CAMPUS_DATA
  // We match id, name, and imageUrl if present
  const locationBlockRegex = /\{\s*id:\s*"([^"]+)",[\s\S]*?\}/g;
  let match;
  let matches = [];

  while ((match = locationBlockRegex.exec(content)) !== null) {
    matches.push({
      block: match[0],
      index: match.index,
    });
  }

  console.log(`Found ${matches.length} location records in campusData.ts.`);

  // Iterate backwards so that replacements do not throw off substring indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const item = matches[i];
    const block = item.block;

    const idMatch = /id:\s*"([^"]+)"/.exec(block);
    if (!idMatch) continue;
    const id = idMatch[1];

    const imageUrlMatch = /imageUrl:\s*"([^"]+)"/.exec(block);
    if (!imageUrlMatch) {
      console.log(`Location '${id}' has no image URL defined. Skipping.`);
      continue;
    }

    const originalUrl = imageUrlMatch[1];

    // If it's already a local reference (starts with images/), skip it
    if (originalUrl.startsWith('images/')) {
      console.log(`Location '${id}' already has a local reference: ${originalUrl}. Skipping.`);
      continue;
    }

    console.log(`\nProcessing location '${id}'...`);
    console.log(`URL: ${originalUrl}`);

    // Deduce file extension
    let ext = '.jpg';
    if (originalUrl.toLowerCase().includes('.png')) ext = '.png';
    else if (originalUrl.toLowerCase().includes('.jpeg')) ext = '.jpeg';
    else if (originalUrl.toLowerCase().includes('.gif')) ext = '.gif';

    const filename = `${id}${ext}`;
    const destPath = path.join(IMAGES_DIR, filename);

    const success = await downloadImage(originalUrl, destPath);

    if (success) {
      // Replace the image URL in the block
      const newUrl = `images/${filename}`;
      const newBlock = block.replace(/imageUrl:\s*"([^"]+)"/, `imageUrl: "${newUrl}"`);

      // Replace the original block in the full text content
      content = content.substring(0, item.index) + newBlock + content.substring(item.index + block.length);
      console.log(`Updated location '${id}' image reference to: ${newUrl}`);
    }
  }

  // Write updated file content back to campusData.ts
  fs.writeFileSync(CAMPUS_DATA_PATH, content, 'utf-8');
  console.log('\nFinished updating campusData.ts image references!');
  console.log('You can now seed the database using: npm run seed');
}

run().catch(console.error);
