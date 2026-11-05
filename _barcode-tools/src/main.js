import './style.css';
import { names, help, validate } from './validation.js';

const $ = (id) => document.getElementById(id);
const tabs = [$('read-tab'), $('create-tab')];
let scanTicket = 0;
let stream;
let controls;
let scanning = false;
let resultValue = '';
let created;
let generating = false;
let toastTimer;

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}
function showError(id, message = '') {
  $(id).textContent = message;
  $(id).hidden = !message;
}
function stopCamera() {
  scanTicket++;
  scanning = false;
  controls?.stop();
  controls = undefined;
  stream?.getTracks().forEach((track) => track.stop());
  stream = undefined;
  // Also release any stream attached during reader startup.
  $('camera').srcObject?.getTracks().forEach((track) => track.stop());
  $('camera').srcObject = null;
  $('camera').hidden = true;
  $('camera-placeholder').hidden = false;
  $('live-badge').hidden = true;
  $('scanner').classList.remove('active');
  $('start-scan').hidden = !$('scan-result').hidden;
  $('start-scan').disabled = false;
  $('start-scan').textContent = 'Open camera';
  $('stop-scan').hidden = true;
}
function selectTab(index, focus = false) {
  if (index === 1) stopCamera();
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    $(tab.getAttribute('aria-controls')).hidden = i !== index;
  });
  if (focus) tabs[index].focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(i));
  tab.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      selectTab(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - i, true);
    }
  });
});

function cameraError(error) {
  if (['NotAllowedError', 'PermissionDeniedError'].includes(error.name)) return 'Camera access was blocked. Allow camera access in your browser or device settings, then tap Open camera again.';
  if (['NotFoundError', 'DevicesNotFoundError'].includes(error.name)) return 'No camera was found. Try a phone, tablet, or computer with a camera.';
  if (['NotReadableError', 'TrackStartError'].includes(error.name)) return 'The camera is busy or unavailable. Close other apps using it, then try again.';
  return 'The camera could not start. Check camera permissions and try again in Safari, Chrome, Edge, or Firefox.';
}
async function startCamera() {
  stopCamera();
  const ticket = scanTicket;
  showError('scan-error');
  $('scan-result').hidden = true;
  $('start-scan').hidden = false;
  $('start-scan').disabled = true;
  $('start-scan').textContent = 'Opening camera…';
  $('stop-scan').hidden = false;
  scanning = true;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    stopCamera();
    showError('scan-error', 'Camera scanning requires a secure HTTPS page (or localhost) and a browser with camera support.');
    return;
  }
  try {
    const { createReader, formatName } = await import('./scanner.js');
    if (ticket !== scanTicket) return;
    const acquired = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    if (ticket !== scanTicket) { acquired.getTracks().forEach((track) => track.stop()); return; }
    stream = acquired;
    $('camera').hidden = false;
    $('camera-placeholder').hidden = true;
    $('scanner').classList.add('active');
    $('live-badge').hidden = false;
    $('start-scan').hidden = true;
    const nextControls = await createReader().decodeFromStream(acquired, $('camera'), (result, error, callbackControls) => {
      if (ticket !== scanTicket) { callbackControls.stop(); return; }
      if (!result) return;
      const format = formatName(result);
      if (!Object.hasOwn(names, format)) return;
      resultValue = result.getText();
      $('result-value').textContent = resultValue;
      $('result-format').textContent = names[format];
      $('scan-result').hidden = false;
      callbackControls.stop();
      stopCamera();
      $('result-value').focus();
    });
    if (ticket !== scanTicket) { nextControls.stop(); return; }
    controls = nextControls;
  } catch (error) {
    if (ticket !== scanTicket) return;
    stopCamera();
    showError('scan-error', cameraError(error));
  }
}
$('start-scan').addEventListener('click', startCamera);
$('scan-again').addEventListener('click', startCamera);
$('stop-scan').addEventListener('click', () => stopCamera());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scanning) { stopCamera(); toast('Camera paused. Tap Open camera to resume.'); }
});
window.addEventListener('pagehide', stopCamera);
$('copy-text').addEventListener('click', async () => {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(resultValue);
    else {
      const input = document.createElement('textarea');
      input.value = resultValue;
      input.style.cssText = 'position:fixed;opacity:0;';
      document.body.append(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      if (!copied) throw new Error('copy');
    }
    toast('Contents copied.');
  } catch { toast('Copy unavailable. Select the contents above to copy manually.'); }
});

const format = () => document.querySelector('input[name="format"]:checked').value;
function invalidate() {
  created = undefined;
  $('created-result').hidden = true;
  showError('create-error');
  $('code-value').removeAttribute('aria-invalid');
  const length = Array.from($('code-value').value).length;
  $('character-count').textContent = `${length.toLocaleString()} character${length === 1 ? '' : 's'}`;
  $('format-help').textContent = help[format()];
}
$('code-value').addEventListener('input', invalidate);
document.querySelectorAll('[name="format"]').forEach((input) => input.addEventListener('change', invalidate));
$('generate').addEventListener('click', async () => {
  if (generating) return;
  invalidate();
  const value = $('code-value').value;
  const selected = format();
  const error = validate(value, selected);
  if (error) {
    showError('create-error', error);
    $('code-value').setAttribute('aria-invalid', 'true');
    $('code-value').focus();
    return;
  }
  generating = true;
  $('generate').disabled = true;
  $('generate').textContent = 'Creating…';
  try {
    const { renderCode } = await import('./generate.js');
    // Render off-screen so rapid edits cannot leave a stale code visible.
    const canvas = document.createElement('canvas');
    await renderCode(canvas, value, selected);
    if (value !== $('code-value').value || selected !== format()) return;
    const target = $('barcode-canvas');
    target.width = canvas.width;
    target.height = canvas.height;
    target.getContext('2d').drawImage(canvas, 0, 0);
    created = { value, format: selected };
    target.setAttribute('aria-label', `${names[selected]} encoding the contents displayed below`);
    $('created-format').textContent = names[selected];
    $('created-value').textContent = value;
    $('created-result').hidden = false;
    $('barcode-size-note').hidden = selected === 'QR_CODE' || canvas.width < 1500;
    $('copy-image').hidden = !(navigator.clipboard?.write && window.ClipboardItem);
    $('created-result').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
  } catch {
    showError('create-error', 'This value could not be encoded. Try a shorter value or choose another code format.');
  } finally {
    generating = false;
    $('generate').disabled = false;
    $('generate').textContent = 'Create barcode ↗';
  }
});
function imageBlob() {
  return new Promise((resolve, reject) => $('barcode-canvas').toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image export failed')), 'image/png'));
}
$('copy-image').addEventListener('click', async () => {
  if (!created) return;
  try {
    // Pass a promise immediately to preserve Safari's user-activation requirement.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': imageBlob() })]);
    toast('Image copied.');
  } catch { toast('Image copy is unavailable here. Use Share / save instead.'); }
});
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
$('share-image').addEventListener('click', async () => {
  if (!created) return;
  const filename = `barcode-${created.format.toLowerCase()}.png`;
  try {
    const blob = await imageBlob();
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Barcode Tools' }); }
      catch (error) {
        if (error.name === 'AbortError') return;
        download(blob, filename);
        toast('Image downloaded.');
      }
    } else { download(blob, filename); toast('Image downloaded.'); }
  } catch { toast('Could not export the image. Please create the code again.'); }
});
$('install-help').addEventListener('click', () => $('install-dialog').showModal());
$('install-dialog').addEventListener('click', (event) => {
  if (event.target !== $('install-dialog')) return;
  const rect = event.target.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
});
async function prepareOffline() {
  if (!import.meta.env.PROD) {
    $('offline-help').textContent = 'Offline mode is available in the production build and on the published site.';
    return;
  }
  if (!('serviceWorker' in navigator)) {
    $('offline-help').textContent = 'This browser does not support offline installation. Stay online, or open this page in Safari, Chrome, Edge, or Firefox.';
    return;
  }
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
    await navigator.serviceWorker.ready;
    $('offline-help').textContent = 'Ready for offline use. You can reopen this app without a connection. Your browser may clear offline files when storage is low.';
  } catch (error) {
    $('offline-help').textContent = 'Offline setup is unavailable in this browser or connection. Stay online, or try opening this page directly in Safari, Chrome, Edge, or Firefox.';
    console.warn('Offline setup unavailable:', error.name);
  }
}
if (document.readyState === 'complete') prepareOffline();
else window.addEventListener('load', prepareOffline, { once: true });
