import { ImageInfo } from './types';

export type UploadCallback = (info: ImageInfo) => void;
export type UploadErrorCallback = (message: string) => void;

// Module-level variable to track the previous object URL for revocation
let prevUrl: string = '';

function processFile(file: File, onSuccess: UploadCallback, onError: UploadErrorCallback): void {
  // 1. Validate file type
  if (!file.type.startsWith('image/')) {
    onError('Please upload an image file.');
    return;
  }

  // 2. Revoke previous object URL to free memory
  if (prevUrl) {
    URL.revokeObjectURL(prevUrl);
  }

  // 3. Create a new object URL
  const objectUrl = URL.createObjectURL(file);
  prevUrl = objectUrl;

  // 4. Create a new Image element
  const img = new Image();

  // 5. Set onload handler
  img.onload = () => {
    const { naturalWidth, naturalHeight } = img;
    if (naturalWidth === 0 || naturalHeight === 0) {
      onError('Image could not be read.');
      return;
    }
    onSuccess({ naturalWidth, naturalHeight, objectUrl });
  };

  // 6. Set onerror handler
  img.onerror = () => {
    onError('Image failed to load.');
  };

  // 7. Set img.src to trigger loading
  img.src = objectUrl;
}

export function bindImageUpload(
  fileInputEl: HTMLInputElement,
  dropZoneEl: HTMLElement,
  onSuccess: UploadCallback,
  onError: UploadErrorCallback
): void {
  // PATH A — File input
  fileInputEl.addEventListener('change', () => {
    const file = fileInputEl.files?.[0];
    if (file) {
      processFile(file, onSuccess, onError);
    }
  });

  // PATH B — Drag and drop
  dropZoneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZoneEl.classList.add('drag-over');
  });

  dropZoneEl.addEventListener('dragleave', () => {
    dropZoneEl.classList.remove('drag-over');
  });

  dropZoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZoneEl.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) {
      processFile(file, onSuccess, onError);
    }
  });
}
