export const names = { QR_CODE: 'QR code', CODE_128: 'Code 128', CODE_39: 'Code 39' };
export const help = {
  QR_CODE: 'QR codes support links, text, and Unicode characters.',
  CODE_128: 'Code 128 supports ASCII text, including lowercase letters and numbers. Maximum 120 characters.',
  CODE_39: 'Code 39 supports A–Z, 0–9, spaces, and - . $ / + %. Maximum 80 characters.',
};
export function validate(value, format) {
  if (!value.length) return 'Enter a value to create your code.';
  if (format === 'CODE_39') {
    if (!/^[A-Z0-9 .$/+%\-]+$/.test(value)) return 'Code 39 accepts uppercase A–Z, numbers, spaces, and - . $ / + % only. Your text has not been changed.';
    if (value.length > 80) return 'For a readable Code 39 barcode, use 80 characters or fewer, or choose QR code.';
  } else if (format === 'CODE_128') {
    if (!/^[\x00-\x7F]+$/.test(value)) return 'Code 128 supports ASCII text only. Choose QR code for emoji, accented letters, or other Unicode text.';
    if (value.length > 120) return 'For a readable Code 128 barcode, use 120 characters or fewer, or choose QR code.';
  } else if (format === 'QR_CODE') {
    if (new TextEncoder().encode(value).length > 2000) return 'This text is too long for a reliably readable QR code. Use 2,000 UTF-8 bytes or fewer.';
  } else return 'Choose a supported code format.';
  return '';
}
