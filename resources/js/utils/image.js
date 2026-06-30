/**
 * Downscale + compress an image File in the browser so ad creatives stay well
 * under server/Zernio upload limits (a phone photo can be 5–10 MB; an ad only
 * needs ~1200×628). Non-images (e.g. video) and already-small images pass
 * through untouched. Returns a JPEG File; falls back to the original on any
 * failure so we never block the upload.
 */
export async function compressImage(file, { maxDim = 1920, quality = 0.85 } = {}) {
    if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif') {
        return file;
    }
    try {
        const dataUrl = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = dataUrl;
        });

        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 1_000_000) {
            return file; // already small enough — keep as-is
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (!blob) {
            return file;
        }

        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch {
        return file;
    }
}
