// Downscale + re-encode an image File entirely in the browser — no dependencies.
// Keeps phone-sized photos small so uploads don't hit the server's request-size
// limit (HTTP 413) and the public page loads faster. Always returns a File:
// on anything unexpected it falls back to the original so it never blocks upload.
export async function compressImage(file, { maxDimension = 1600, quality = 0.7 } = {}) {
    // Skip non-images and GIFs (canvas re-encode would drop animation frames).
    if (!file.type?.startsWith("image/") || file.type === "image/gif") {
        return file;
    }

    try {
        const bitmap = await loadBitmap(file);
        const largestSide = Math.max(bitmap.width, bitmap.height);
        const scale = Math.min(1, maxDimension / largestSide);
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", quality)
        );

        // If re-encoding didn't actually shrink it, keep the original.
        if (!blob || blob.size >= file.size) {
            return file;
        }

        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
    } catch {
        return file;
    }
}

function loadBitmap(file) {
    // createImageBitmap with from-image honours EXIF rotation on phone photos.
    if (window.createImageBitmap) {
        return createImageBitmap(file, { imageOrientation: "from-image" });
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
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
