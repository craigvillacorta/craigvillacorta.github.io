import { createCanvas } from '@napi-rs/canvas';
import { writeFile } from 'node:fs/promises';
for (const size of [192, 512]) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.scale(size / 192, size / 192);
  ctx.fillStyle = '#14674e'; ctx.fillRect(0, 0, 192, 192);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7;
  for (const points of [ [[54,43],[36,43],[36,68]], [[138,43],[156,43],[156,68]], [[36,124],[36,149],[54,149]], [[156,124],[156,149],[138,149]] ]) {
    ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
  }
  for (const x of [61,76,88,108,120,133]) { ctx.beginPath(); ctx.moveTo(x,65); ctx.lineTo(x,127); ctx.stroke(); }
  await writeFile(`public/icon-${size}.png`, canvas.toBuffer('image/png'));
}
