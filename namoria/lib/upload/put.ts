"use client";

/**
 * Uploads a blob to a presigned R2 PUT URL using XHR so we get upload-progress
 * events (the fetch API can't report request-body progress in browsers).
 */
export function putWithProgress(
  url: string,
  blob: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error(`Upload falhou (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Erro de rede no upload"));
    xhr.onabort = () => reject(new Error("Upload cancelado"));
    xhr.send(blob);
  });
}
