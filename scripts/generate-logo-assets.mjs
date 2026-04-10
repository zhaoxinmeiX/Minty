import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'assets', 'images');
const SUPERSAMPLE = 2;

const COLORS = {
  transparent: [0, 0, 0, 0],
  background: [220, 232, 180, 255],
  surfaceGlow: [255, 249, 241, 98],
  surface: [255, 249, 241, 255],
  olive: [110, 125, 66, 255],
  oliveSoft: [150, 165, 106, 255],
  oliveShadow: [110, 125, 66, 28],
  accent: [249, 140, 88, 255],
  accentSoft: [252, 206, 180, 255],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const scaleFrame = (value, scale) => value * scale;

function createImage(width, height, color = COLORS.transparent) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
  }
  return { width, height, data };
}

function blendPixel(image, x, y, color) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }

  const index = (y * image.width + x) * 4;
  const sourceAlpha = color[3] / 255;
  const targetAlpha = image.data[index + 3] / 255;
  const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);

  if (outAlpha <= 0) {
    image.data[index] = 0;
    image.data[index + 1] = 0;
    image.data[index + 2] = 0;
    image.data[index + 3] = 0;
    return;
  }

  const mix = (sourceChannel, targetChannel) =>
    Math.round(((sourceChannel * sourceAlpha) + targetChannel * targetAlpha * (1 - sourceAlpha)) / outAlpha);

  image.data[index] = mix(color[0], image.data[index]);
  image.data[index + 1] = mix(color[1], image.data[index + 1]);
  image.data[index + 2] = mix(color[2], image.data[index + 2]);
  image.data[index + 3] = Math.round(outAlpha * 255);
}

function fillRoundedRect(image, x, y, width, height, radius, color) {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const right = Math.ceil(x + width);
  const bottom = Math.ceil(y + height);
  const maxRadius = Math.min(radius, width / 2, height / 2);

  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const cx = clamp(px + 0.5, x + maxRadius, x + width - maxRadius);
      const cy = clamp(py + 0.5, y + maxRadius, y + height - maxRadius);
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      if ((dx * dx) + (dy * dy) <= maxRadius * maxRadius) {
        blendPixel(image, px, py, color);
      }
    }
  }
}

function fillCircle(image, cx, cy, radius, color) {
  const left = Math.floor(cx - radius);
  const top = Math.floor(cy - radius);
  const right = Math.ceil(cx + radius);
  const bottom = Math.ceil(cy + radius);
  const radiusSquared = radius * radius;

  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      if ((dx * dx) + (dy * dy) <= radiusSquared) {
        blendPixel(image, px, py, color);
      }
    }
  }
}

function fillEllipse(image, cx, cy, rx, ry, angleInDegrees, color) {
  const radians = (angleInDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const bound = Math.ceil(Math.max(rx, ry) * 1.4);
  const left = Math.floor(cx - bound);
  const top = Math.floor(cy - bound);
  const right = Math.ceil(cx + bound);
  const bottom = Math.ceil(cy + bound);

  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;
      const inside = ((localX * localX) / (rx * rx)) + ((localY * localY) / (ry * ry));
      if (inside <= 1) {
        blendPixel(image, px, py, color);
      }
    }
  }
}

function strokeQuadratic(image, start, control, end, width, color) {
  const steps = 120;
  const radius = width / 2;

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const inverse = 1 - t;
    const x = (inverse * inverse * start.x) + (2 * inverse * t * control.x) + (t * t * end.x);
    const y = (inverse * inverse * start.y) + (2 * inverse * t * control.y) + (t * t * end.y);
    fillCircle(image, x, y, radius, color);
  }
}

function downsample(image, factor) {
  if (factor === 1) {
    return image;
  }

  const width = image.width / factor;
  const height = image.height / factor;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const sourceIndex = (((y * factor) + sy) * image.width + ((x * factor) + sx)) * 4;
          r += image.data[sourceIndex];
          g += image.data[sourceIndex + 1];
          b += image.data[sourceIndex + 2];
          a += image.data[sourceIndex + 3];
        }
      }

      const sampleCount = factor * factor;
      const targetIndex = (y * width + x) * 4;
      data[targetIndex] = Math.round(r / sampleCount);
      data[targetIndex + 1] = Math.round(g / sampleCount);
      data[targetIndex + 2] = Math.round(b / sampleCount);
      data[targetIndex + 3] = Math.round(a / sampleCount);
    }
  }

  return { width, height, data };
}

function resizeNearest(image, targetWidth, targetHeight) {
  const data = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor((x / targetWidth) * image.width));
      const sourceY = Math.min(image.height - 1, Math.floor((y / targetHeight) * image.height));
      const sourceIndex = (sourceY * image.width + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;

      data[targetIndex] = image.data[sourceIndex];
      data[targetIndex + 1] = image.data[sourceIndex + 1];
      data[targetIndex + 2] = image.data[sourceIndex + 2];
      data[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  return { width: targetWidth, height: targetHeight, data };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([sizeBuffer, typeBuffer, data, crcBuffer]);
}

function writePng(filePath, image) {
  const rows = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rowOffset = y * (image.width * 4 + 1);
    rows[rowOffset] = 0;
    for (let x = 0; x < image.width; x += 1) {
      const sourceIndex = (y * image.width + x) * 4;
      const targetIndex = rowOffset + 1 + x * 4;
      rows[targetIndex] = image.data[sourceIndex];
      rows[targetIndex + 1] = image.data[sourceIndex + 1];
      rows[targetIndex + 2] = image.data[sourceIndex + 2];
      rows[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
}

function renderVariant({ transparent = false, size = 1024 } = {}) {
  const scale = SUPERSAMPLE * (size / 1024);
  const image = createImage(size * SUPERSAMPLE, size * SUPERSAMPLE, transparent ? COLORS.transparent : COLORS.background);

  if (!transparent) {
    fillCircle(image, scaleFrame(510, scale), scaleFrame(512, scale), scaleFrame(296, scale), COLORS.surfaceGlow);
  }

  fillRoundedRect(
    image,
    scaleFrame(236, scale),
    scaleFrame(218, scale),
    scaleFrame(556, scale),
    scaleFrame(588, scale),
    scaleFrame(126, scale),
    COLORS.olive,
  );

  fillRoundedRect(
    image,
    scaleFrame(236, scale),
    scaleFrame(218, scale),
    scaleFrame(100, scale),
    scaleFrame(588, scale),
    scaleFrame(50, scale),
    COLORS.accent,
  );

  fillRoundedRect(
    image,
    scaleFrame(334, scale),
    scaleFrame(270, scale),
    scaleFrame(392, scale),
    scaleFrame(480, scale),
    scaleFrame(78, scale),
    COLORS.surface,
  );

  fillRoundedRect(
    image,
    scaleFrame(384, scale),
    scaleFrame(332, scale),
    scaleFrame(224, scale),
    scaleFrame(40, scale),
    scaleFrame(20, scale),
    COLORS.oliveShadow,
  );

  const rows = [
    { y: 416, width: 214, dotColor: COLORS.olive, lineColor: COLORS.oliveSoft },
    { y: 500, width: 246, dotColor: COLORS.olive, lineColor: COLORS.oliveSoft },
    { y: 584, width: 176, dotColor: COLORS.accent, lineColor: COLORS.accentSoft },
  ];

  for (const row of rows) {
    fillCircle(image, scaleFrame(398, scale), scaleFrame(row.y + 15, scale), scaleFrame(17, scale), row.dotColor);
    fillRoundedRect(
      image,
      scaleFrame(438, scale),
      scaleFrame(row.y, scale),
      scaleFrame(row.width, scale),
      scaleFrame(30, scale),
      scaleFrame(15, scale),
      row.lineColor,
    );
  }

  fillRoundedRect(
    image,
    scaleFrame(438, scale),
    scaleFrame(628, scale),
    scaleFrame(130, scale),
    scaleFrame(22, scale),
    scaleFrame(11, scale),
    COLORS.oliveShadow,
  );

  const downsampled = downsample(image, SUPERSAMPLE);
  return downsampled.width === size ? downsampled : resizeNearest(downsampled, size, size);
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  writePng(path.join(OUTPUT_DIR, 'icon.png'), renderVariant({ transparent: false, size: 1024 }));
  writePng(path.join(OUTPUT_DIR, 'splash-icon.png'), renderVariant({ transparent: true, size: 1024 }));
  writePng(path.join(OUTPUT_DIR, 'adaptive-icon.png'), renderVariant({ transparent: true, size: 1024 }));
  writePng(path.join(OUTPUT_DIR, 'favicon.png'), renderVariant({ transparent: false, size: 48 }));
}

main();
