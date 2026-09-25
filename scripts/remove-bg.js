const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const spritesDir = path.join(__dirname, '..', 'public', 'sprites');

const files = [
  { input: 'sensei-searching.jpg', output: 'sensei-searching.png', type: 'white', maxVal: 235 },
  { input: 'sensei-celebrati.jpg', output: 'sensei-celebrating.png', type: 'black', maxVal: 10 },
  { input: 'sensei-speaking.jpg', output: 'sensei-speaking.png', type: 'black', maxVal: 10 },
  { input: 'sensei-idea.jpg', output: 'sensei-idea.png', type: 'black', maxVal: 10 },
  { input: 'sensei-succ.jpg', output: 'sensei-success.png', type: 'black', maxVal: 10 },
];

async function processImage(fileInfo) {
  const inputPath = path.join(spritesDir, fileInfo.input);
  const outputPath = path.join(spritesDir, fileInfo.output);

  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    return;
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const isVisited = new Uint8Array(width * height);

  function isBgPixel(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    if (fileInfo.type === 'white') {
      return r >= 235 && g >= 235 && b >= 235;
    } else {
      return r <= 12 && g <= 12 && b <= 12;
    }
  }

  const queue = [];

  function tryEnqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const pixelIndex = y * width + x;
    if (isVisited[pixelIndex]) return;

    const dataIndex = pixelIndex * channels;
    if (isBgPixel(dataIndex)) {
      isVisited[pixelIndex] = 1;
      queue.push(pixelIndex);
    }
  }

  // Enqueue perimeter
  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const dataIdx = curr * channels;
    data[dataIdx + 3] = 0; // Transparent

    tryEnqueue(cx + 1, cy);
    tryEnqueue(cx - 1, cy);
    tryEnqueue(cx, cy + 1);
    tryEnqueue(cx, cy - 1);
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels
    }
  })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

  console.log(`Processed ${fileInfo.input} -> ${fileInfo.output}`);
}

async function run() {
  for (const f of files) {
    await processImage(f);
  }
  console.log("All sprites converted to transparent PNGs with strict tolerance!");
}

run().catch(console.error);
