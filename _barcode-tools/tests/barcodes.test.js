import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, MultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { renderCode } from '../src/generate.js';
import { validate } from '../src/validation.js';

function decode(canvas, format) {
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const luminance = new Uint8ClampedArray(canvas.width * canvas.height);
  for (let i = 0; i < luminance.length; i++) luminance[i] = (pixels[i*4] + 2*pixels[i*4+1] + pixels[i*4+2]) / 4;
  const reader = new MultiFormatReader();
  const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat[format]]]]);
  const result = reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminance, canvas.width, canvas.height))), hints);
  return { text: result.getText(), format: BarcodeFormat[result.getBarcodeFormat()] };
}
for (const [format, values] of [
  ['QR_CODE', ['https://craigvillacorta.github.io/barcode-tools/', '  hello\nworld  ', 'Café 🍎 日本語', '<script>alert("test")</script>']],
  ['CODE_128', ['Hello-123', '00001234567890', '  preserve spaces  ', 'Line1\nLine2', '\x00\x01\x1F\x7F']],
  ['CODE_39', ['ABC-123', 'ABC .$/+%-90']],
]) {
  for (const value of values) test(`${format} round-trips ${JSON.stringify(value)}`, async () => {
    assert.equal(validate(value, format), '');
    const canvas = createCanvas(1,1);
    await renderCode(canvas, value, format);
    assert.deepEqual(decode(canvas, format), { text: value, format });
    const pixels = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    assert.deepEqual([...pixels.slice(0,4)], [255,255,255,255], 'Opaque white quiet zone');
  });
}
test('rejects invalid input without rewriting it', () => {
  for (const value of ['lowercase', 'ABC*123', 'ABC_123', 'A\nB', 'é']) assert.ok(validate(value,'CODE_39'));
  for (const value of ['🍎', 'café']) assert.ok(validate(value,'CODE_128'));
  for (const format of ['QR_CODE','CODE_128','CODE_39']) assert.ok(validate('',format));
  assert.ok(validate('A'.repeat(81), 'CODE_39'));
  assert.ok(validate('A'.repeat(121), 'CODE_128'));
  assert.ok(validate('🍎'.repeat(501), 'QR_CODE'));
});
test('maximum supported lengths can be read back', async () => {
  for (const [format, value] of [['QR_CODE','a'.repeat(2000)],['CODE_128','A'.repeat(120)],['CODE_39','A'.repeat(80)]]) {
    const canvas=createCanvas(1,1);
    await renderCode(canvas,value,format);
    assert.equal(decode(canvas,format).text,value);
  }
});
