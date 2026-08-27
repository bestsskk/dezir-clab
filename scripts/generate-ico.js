const fs = require('fs');
const path = require('path');

function createIcoWithLetterD() {
  const width = 32;
  const height = 32;
  
  // Create 32x32 pixel buffer (BGRA)
  const pixels = new Uint8Array(width * height * 4);
  
  // Simple 32x32 drawing of 'D'
  // Background: dark #121215 with rounded corners
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Distance from corners for rounding
      const cornerR = 5;
      const isCorner = 
        (x < cornerR && y < cornerR && Math.hypot(x - cornerR, y - cornerR) > cornerR) ||
        (x >= width - cornerR && y < cornerR && Math.hypot(x - (width - cornerR - 1), y - cornerR) > cornerR) ||
        (x < cornerR && y >= height - cornerR && Math.hypot(x - cornerR, y - (height - cornerR - 1)) > cornerR) ||
        (x >= width - cornerR && y >= height - cornerR && Math.hypot(x - (width - cornerR - 1), y - (height - cornerR - 1)) > cornerR);
        
      if (isCorner) {
        pixels[idx] = 0;     // B
        pixels[idx + 1] = 0; // G
        pixels[idx + 2] = 0; // R
        pixels[idx + 3] = 0; // Alpha
      } else {
        // Border or background
        const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;
        if (isBorder) {
          pixels[idx] = 72;     // B (Rose glow #e11d48)
          pixels[idx + 1] = 29;  // G
          pixels[idx + 2] = 225; // R
          pixels[idx + 3] = 180; // A
        } else {
          pixels[idx] = 20;     // B (#141418)
          pixels[idx + 1] = 18;  // G
          pixels[idx + 2] = 18;  // R
          pixels[idx + 3] = 255; // A
        }
      }
    }
  }
  
  // Draw Stylized Letter "D" in Pink/Crimson (#f43f5e / #e11d48)
  // Outer D shape: from x=8 to x=24, y=6 to y=25
  // Inner cutout: from x=14 to x=18, y=11 to y=20
  for (let y = 6; y <= 25; y++) {
    for (let x = 8; x <= 24; x++) {
      let isD = false;
      
      // Vertical stem of D
      if (x >= 8 && x <= 13 && y >= 6 && y <= 25) {
        isD = true;
      }
      
      // Top bar
      if (y >= 6 && y <= 10 && x >= 8 && x <= 20) {
        isD = true;
      }
      
      // Bottom bar
      if (y >= 21 && y <= 25 && x >= 8 && x <= 20) {
        isD = true;
      }
      
      // Right curve
      const cy = 15.5;
      const dy = Math.abs(y - cy);
      if (x > 18 && x <= 24 && dy <= 7.5) {
        const dx = x - 18;
        if (dx * dx + (dy * 0.7) * (dy * 0.7) <= 36) {
          isD = true;
        }
      }
      
      // Cut out inside hole of D
      if (x >= 14 && x <= 18 && y >= 11 && y <= 20) {
        const dyInner = Math.abs(y - cy);
        if (x === 18 && dyInner > 3) {
          // keep curved inner edge
        } else {
          isD = false;
        }
      }
      
      if (isD) {
        const idx = (y * width + x) * 4;
        // Gradient from rose (#f43f5e) to deep crimson (#e11d48)
        const t = (y - 6) / 19;
        const r = Math.round(244 * (1 - t) + 225 * t);
        const g = Math.round(63 * (1 - t) + 29 * t);
        const b = Math.round(94 * (1 - t) + 72 * t);
        
        pixels[idx] = b;     // B
        pixels[idx + 1] = g; // G
        pixels[idx + 2] = r; // R
        pixels[idx + 3] = 255;
      }
    }
  }

  // Add Gold Sparkle at top right (x=24..26, y=6..8)
  const sparkle = [
    [24, 7], [25, 6], [25, 7], [25, 8], [26, 7]
  ];
  sparkle.forEach(([sx, sy]) => {
    if (sx < width && sy < height) {
      const idx = (sy * width + sx) * 4;
      pixels[idx] = 71;    // B (#fde047)
      pixels[idx + 1] = 224; // G
      pixels[idx + 2] = 253; // R
      pixels[idx + 3] = 255;
    }
  });

  // Construct ICO buffer
  const imageSize = 40 + width * height * 4 + (width * height) / 8;
  const totalSize = 6 + 16 + imageSize;
  const buf = Buffer.alloc(totalSize);
  
  // ICO Header
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type 1 = ICO
  buf.writeUInt16LE(1, 4); // 1 Image
  
  // Directory Entry
  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8); // No color palette
  buf.writeUInt8(0, 9); // Reserved
  buf.writeUInt16LE(1, 10); // Color planes
  buf.writeUInt16LE(32, 12); // Bits per pixel
  buf.writeUInt32LE(imageSize, 14); // Image data size
  buf.writeUInt32LE(22, 18); // Offset
  
  // BITMAPINFOHEADER
  let offset = 22;
  buf.writeUInt32LE(40, offset); // Header size
  buf.writeInt32LE(width, offset + 4);
  buf.writeInt32LE(height * 2, offset + 8); // Height * 2 for XOR + AND
  buf.writeUInt16LE(1, offset + 12); // Planes
  buf.writeUInt16LE(32, offset + 14); // Bit count
  buf.writeUInt32LE(0, offset + 16); // Compression (BI_RGB)
  buf.writeUInt32LE(width * height * 4 + (width * height) / 8, offset + 20); // Image size
  buf.writeInt32LE(0, offset + 24); // XPelsPerMeter
  buf.writeInt32LE(0, offset + 28); // YPelsPerMeter
  buf.writeUInt32LE(0, offset + 32); // ClrUsed
  buf.writeUInt32LE(0, offset + 36); // ClrImportant
  offset += 40;
  
  // Write XOR mask (bottom-up pixel data)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      buf.writeUInt8(pixels[srcIdx], offset++);     // B
      buf.writeUInt8(pixels[srcIdx + 1], offset++); // G
      buf.writeUInt8(pixels[srcIdx + 2], offset++); // R
      buf.writeUInt8(pixels[srcIdx + 3], offset++); // A
    }
  }
  
  // Write AND mask (1 bit per pixel, 0 = opaque/drawn)
  for (let y = height - 1; y >= 0; y--) {
    let byte = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const isTransparent = pixels[srcIdx + 3] === 0;
      if (isTransparent) {
        byte |= (1 << (7 - (x % 8)));
      }
      if (x % 8 === 7 || x === width - 1) {
        buf.writeUInt8(byte, offset++);
        byte = 0;
      }
    }
  }
  
  return buf;
}

const icoBuffer = createIcoWithLetterD();
const publicIco = path.join(__dirname, '..', 'public', 'favicon.ico');
const appIco = path.join(__dirname, '..', 'app', 'favicon.ico');

fs.writeFileSync(publicIco, icoBuffer);
fs.writeFileSync(appIco, icoBuffer);

console.log('Favicon ICO generated successfully with letter D.');
