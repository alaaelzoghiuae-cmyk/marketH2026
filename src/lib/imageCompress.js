// Client-side image pipeline for marketplace ads: validate → decode (EXIF orientation
// applied) → downscale → re-encode to WebP (JPEG fallback) → loop quality until small.
// Re-encoding through <canvas> removes all EXIF/GPS metadata.
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const TARGET_BYTES = 140 * 1024;
export const HARD_LIMIT_BYTES = 340 * 1024;

const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob((b) => res(b), type, q));
const blobToDataUrl = (b) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); });

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* fallback below */ }
  }
  return await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); };
    img.src = url;
  });
}

export async function compressImageFile(file, { maxSide = 1280 } = {}) {
  if (!file) throw new Error('اختر صورة أولًا');
  if (!ALLOWED.includes(file.type)) throw new Error('نوع الملف غير مدعوم — الصيغ المسموحة: JPG / PNG / WebP');
  if (file.size > MAX_INPUT_BYTES) throw new Error('الصورة كبيرة جدًا (الحد 15 ميجا قبل الضغط)');
  let bmp;
  try { bmp = await decode(file); } catch (e) { throw new Error('تعذر قراءة الصورة — جرّب صورة أخرى'); }
  const w0 = bmp.width; const h0 = bmp.height;
  if (Math.min(w0, h0) < 200) throw new Error('الصورة صغيرة جدًا — اختر صورة أوضح للجهاز');
  let scale = Math.min(1, maxSide / Math.max(w0, h0));
  let best = null;
  for (let pass = 0; pass < 4 && !best; pass++) {
    const w = Math.round(w0 * scale); const h = Math.round(h0 * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    for (const q of [0.82, 0.74, 0.66, 0.58, 0.5]) {
      let blob = await toBlob(canvas, 'image/webp', q);
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', q); // browsers without WebP encoder
      if (blob && blob.size <= TARGET_BYTES) { best = { blob, w, h }; break; }
      if (blob && q === 0.5 && blob.size <= HARD_LIMIT_BYTES) { best = { blob, w, h }; break; }
    }
    scale *= 0.82; // still too big → shrink dimensions a little and retry (keeps device details readable)
  }
  if (bmp.close) bmp.close();
  if (!best) throw new Error('تعذر ضغط الصورة للحجم المطلوب — جرّب صورة أبسط');
  return { dataUrl: await blobToDataUrl(best.blob), bytes: best.blob.size, width: best.w, height: best.h, type: best.blob.type, originalBytes: file.size };
}
