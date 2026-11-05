import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
export async function renderCode(canvas, value, format) {
  if (format === 'QR_CODE') {
    await QRCode.toCanvas(canvas, [{ data: value, mode: 'byte' }], {
      errorCorrectionLevel: 'M', scale: 8, margin: 4,
      color: { dark: '#000000ff', light: '#ffffffff' },
    });
  } else {
    JsBarcode(canvas, value, {
      format: format === 'CODE_39' ? 'CODE39' : 'CODE128',
      width: 3, height: 210, margin: 36, displayValue: false,
      background: '#ffffff', lineColor: '#000000',
    });
  }
}
