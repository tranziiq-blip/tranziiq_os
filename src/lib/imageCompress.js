// Shrinks phone photos before upload so storage and mobile data last far
// longer. A 3-4 MB camera photo becomes roughly 150-300 KB and stays sharp
// enough to read weighbill numbers, fuel slips and delivery notes.
// PDFs, documents and anything that can't be decoded upload unchanged.

const MAX_EDGE = 1600; // px on the longest side
const TARGET_BYTES = 300 * 1024;
const START_QUALITY = 0.78;
const MIN_QUALITY = 0.5;
const SKIP_TYPES = ["image/gif", "image/svg+xml"];

const canvasToBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

async function decode(file) {
  // createImageBitmap honours the photo's EXIF rotation in modern browsers
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function compressImage(file) {
  if (!file || !file.type?.startsWith("image/") || SKIP_TYPES.includes(file.type)) {
    return file;
  }
  // Already small: leave it alone
  if (file.size <= TARGET_BYTES) return file;

  let source;
  try {
    source = await decode(file);
  } catch {
    return file; // e.g. HEIC on a browser that can't read it
  }

  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  if (!w || !h) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if (typeof source.close === "function") source.close();

  let quality = START_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob && blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.1);
    blob = await canvasToBlob(canvas, quality);
  }
  if (!blob || blob.size >= file.size) return file; // never make it bigger

  const base = (file.name || "photo").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
