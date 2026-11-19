import { auth } from '../firebase';
import {
  ALLOWED_CLOUDINARY_EXTENSIONS,
  ALLOWED_CLOUDINARY_MIME_TYPES,
  CLOUDINARY_UPLOAD_TIMEOUT_MS,
  CloudinaryFolderKey,
  getCloudinaryConfig,
  getCloudinaryFolderPath,
  getCloudinaryUploadEndpoint,
  MAX_CLOUDINARY_UPLOAD_BYTES,
  MAX_RAW_IMAGE_BYTES,
} from '../config/cloudinary';

export type PhotoFolder = CloudinaryFolderKey;
export type UploadStage = 'compressing' | 'uploading' | 'finalizing';

export interface CompressedImageResult {
  blob: Blob;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export interface UploadedPhotoResult {
  url: string;
  cloudinaryImageUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: string;
  folder: string;
  originalSize: number;
  compressedSize: number;
}

export class CloudinaryUploadError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly serverResponse?: string;
  readonly messageEn: string;
  readonly messageBn: string;
  readonly isConfigMissing: boolean;

  constructor(opts: {
    code: string;
    status?: number;
    serverResponse?: string;
    messageEn: string;
    messageBn: string;
    isConfigMissing?: boolean;
  }) {
    super(opts.messageEn);
    this.name = 'CloudinaryUploadError';
    this.code = opts.code;
    this.status = opts.status;
    this.serverResponse = opts.serverResponse;
    this.messageEn = opts.messageEn;
    this.messageBn = opts.messageBn;
    this.isConfigMissing = Boolean(opts.isConfigMissing);
  }
}

export function sanitizePersistedPhotoUrl(url?: string | null): string {
  const trimmed = (url || '').trim().slice(0, 500);
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return '';
  if (!/^https?:\/\//i.test(trimmed)) return '';
  return trimmed;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageFile(file: File): void {
  if (!file || file.size === 0) {
    throw new CloudinaryUploadError({
      code: 'validation/empty-file',
      messageEn: 'Selected file is empty. Please choose a valid photo.',
      messageBn: 'নির্বাচিত ফাইলটি খালি। অনুগ্রহ করে একটি সঠিক ছবি নির্বাচন করুন।',
    });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = (file.type || '').toLowerCase();

  const validMime = ALLOWED_CLOUDINARY_MIME_TYPES.includes(
    mime as (typeof ALLOWED_CLOUDINARY_MIME_TYPES)[number]
  );
  const validExt = ALLOWED_CLOUDINARY_EXTENSIONS.includes(
    ext as (typeof ALLOWED_CLOUDINARY_EXTENSIONS)[number]
  );

  if (!validMime && !(mime === '' && validExt)) {
    throw new CloudinaryUploadError({
      code: 'validation/unsupported-format',
      messageEn: 'Unsupported image format. Please choose a JPG, JPEG, PNG, or WEBP photo.',
      messageBn: 'অসমর্থিত ফরম্যাট। অনুগ্রহ করে JPG, JPEG, PNG অথবা WEBP ছবি নির্বাচন করুন।',
    });
  }

  if (file.size > MAX_RAW_IMAGE_BYTES) {
    throw new CloudinaryUploadError({
      code: 'validation/file-too-large',
      messageEn: `Image is too large (${formatFileSize(file.size)}). Maximum allowed selection size is 15 MB.`,
      messageBn: `ছবিটি অনেক বড় (${formatFileSize(file.size)})। সর্বোচ্চ ১৫ MB পর্যন্ত ছবি নির্বাচন করা যাবে।`,
    });
  }
}

function loadImageElement(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new CloudinaryUploadError({
          code: 'validation/unreadable-image',
          messageEn: 'Could not read the selected image file. Please try another photo.',
          messageBn: 'নির্বাচিত ছবিটি পড়া যায়নি। অনুগ্রহ করে অন্য একটি ছবি চেষ্টা করুন।',
        })
      );
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new CloudinaryUploadError({
              code: 'compression/failed',
              messageEn: 'Failed to process image for upload.',
              messageBn: 'আপলোডের জন্য ছবি প্রস্তুত করতে ব্যর্থ হয়েছে।',
            })
          );
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function compressAndResizeImage(
  file: File,
  maxDimension = 900,
  quality = 0.85
): Promise<CompressedImageResult> {
  validateImageFile(file);

  const { img, objectUrl } = await loadImageElement(file);
  try {
    const naturalW = img.naturalWidth || img.width || 600;
    const naturalH = img.naturalHeight || img.height || 600;

    let targetW = naturalW;
    let targetH = naturalH;

    if (naturalW > maxDimension || naturalH > maxDimension) {
      if (naturalW >= naturalH) {
        targetW = maxDimension;
        targetH = Math.max(1, Math.round((naturalH * maxDimension) / naturalW));
      } else {
        targetH = maxDimension;
        targetW = Math.max(1, Math.round((naturalW * maxDimension) / naturalH));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new CloudinaryUploadError({
        code: 'compression/canvas-unavailable',
        messageEn: 'Browser canvas is unavailable for image compression.',
        messageBn: 'ছবি কমপ্রেস করার জন্য ব্রাউজার ক্যানভাস পাওয়া যায়নি।',
      });
    }

    const lowerMime = (file.type || '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    let outMime: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
    let outExt: 'jpg' | 'png' | 'webp' = 'jpg';

    if (lowerMime === 'image/webp' || ext === 'webp') {
      outMime = 'image/webp';
      outExt = 'webp';
    } else if (lowerMime === 'image/png' || ext === 'png') {
      outMime = 'image/png';
      outExt = 'png';
    }

    if (outMime === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(img, 0, 0, targetW, targetH);

    let blob = await canvasToBlob(canvas, outMime, quality);

    if (outMime === 'image/png' && blob.size > 1.5 * 1024 * 1024) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
      outMime = 'image/jpeg';
      outExt = 'jpg';
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.84);
    }

    if (blob.size > 3 * 1024 * 1024) {
      outMime = 'image/jpeg';
      outExt = 'jpg';
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.72);
    }

    if (blob.size > MAX_CLOUDINARY_UPLOAD_BYTES) {
      throw new CloudinaryUploadError({
        code: 'validation/compressed-too-large',
        messageEn: 'Compressed image still exceeds 4.5 MB limit. Please choose a smaller photo.',
        messageBn: 'কমপ্রেস করার পরও ছবিটি ৪.৫ MB-এর বেশি। অনুগ্রহ করে ছোট ছবি নির্বাচন করুন।',
      });
    }

    return {
      blob,
      contentType: outMime,
      extension: outExt,
      width: targetW,
      height: targetH,
      originalSize: file.size,
      compressedSize: blob.size,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function mapCloudinaryError(error: unknown): CloudinaryUploadError {
  if (error instanceof CloudinaryUploadError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error || 'Unknown upload error');
  return new CloudinaryUploadError({
    code: 'cloudinary/unknown',
    messageEn: `Image upload failed: ${rawMessage}`,
    messageBn: `ছবি আপলোড ব্যর্থ হয়েছে: ${rawMessage}`,
  });
}

function parseCloudinaryResponseError(status: number, responseText: string): CloudinaryUploadError {
  let rawMsg = `HTTP ${status}`;
  try {
    const parsed = JSON.parse(responseText) as { error?: { message?: string } };
    if (parsed?.error?.message) {
      rawMsg = parsed.error.message;
    }
  } catch {
    if (responseText.trim()) rawMsg = responseText.slice(0, 220);
  }

  const lower = rawMsg.toLowerCase();

  if (lower.includes('upload preset') && (lower.includes('not found') || lower.includes('must be specified') || lower.includes('whitelisted'))) {
    return new CloudinaryUploadError({
      code: 'cloudinary/invalid-upload-preset',
      status,
      serverResponse: rawMsg,
      isConfigMissing: true,
      messageEn: `Cloudinary unsigned upload preset error: ${rawMsg}. Verify your preset is configured as "Unsigned" in Cloudinary Settings -> Upload.`,
      messageBn: `Cloudinary আপলোড প্রিসেট ত্রুটি: ${rawMsg}। Cloudinary ড্যাশবোর্ডে Unsigned Upload Preset সঠিকভাবে তৈরি আছে কিনা পরীক্ষা করুন।`,
    });
  }

  if (status === 404 || lower.includes('cloud name') || lower.includes('unknown api key')) {
    return new CloudinaryUploadError({
      code: 'cloudinary/invalid-cloud-name',
      status,
      serverResponse: rawMsg,
      isConfigMissing: true,
      messageEn: `Cloudinary configuration error (HTTP ${status}): ${rawMsg}. Verify VITE_CLOUDINARY_CLOUD_NAME / CLOUDINARY_CLOUD_NAME.`,
      messageBn: `Cloudinary কনফিগারেশন ত্রুটি (HTTP ${status}): ${rawMsg}। অনুগ্রহ করে Cloud Name সঠিকভাবে সেট করুন।`,
    });
  }

  if (status === 401 || status === 403 || lower.includes('not allowed') || lower.includes('restricted')) {
    return new CloudinaryUploadError({
      code: 'cloudinary/unauthorized',
      status,
      serverResponse: rawMsg,
      messageEn: `Upload rejected by Cloudinary security rules (HTTP ${status}): ${rawMsg}`,
      messageBn: `Cloudinary নিরাপত্তা নীতিমালা দ্বারা আপলোড প্রত্যাখ্যাত হয়েছে (HTTP ${status}): ${rawMsg}`,
    });
  }

  if (status === 413 || lower.includes('file size too large')) {
    return new CloudinaryUploadError({
      code: 'cloudinary/file-too-large',
      status,
      serverResponse: rawMsg,
      messageEn: `Image exceeds Cloudinary file size limit: ${rawMsg}`,
      messageBn: `ছবিটি Cloudinary-এর অনুমোদিত ফাইল সাইজের চেয়ে বড়: ${rawMsg}`,
    });
  }

  return new CloudinaryUploadError({
    code: `cloudinary/http-${status || 'error'}`,
    status,
    serverResponse: rawMsg,
    messageEn: `Cloudinary upload failed (HTTP ${status}): ${rawMsg}`,
    messageBn: `Cloudinary আপলোড ব্যর্থ হয়েছে (HTTP ${status}): ${rawMsg}`,
  });
}

export interface UploadCloudinaryPhotoOptions {
  maxDimension?: number;
  onStageChange?: (stage: UploadStage) => void;
  onProgress?: (percent: number) => void;
  onCancelReady?: (cancelFn: () => void) => void;
}

export async function uploadMadrasahPhoto(
  folder: PhotoFolder,
  file: File,
  options: UploadCloudinaryPhotoOptions = {}
): Promise<UploadedPhotoResult> {
  const { maxDimension = 900, onStageChange, onProgress, onCancelReady } = options;

  // 1. Require authenticated verified Firebase user before uploading
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    throw new CloudinaryUploadError({
      code: 'auth/unverified',
      messageEn: 'You must be signed in with a verified account to upload images.',
      messageBn: 'ছবি আপলোড করতে যাচাইকৃত অ্যাকাউন্টে লগইন থাকতে হবে।',
    });
  }

  // 2. Resolve centralized Cloudinary public config (Cloud Name + restricted Unsigned Preset)
  const config = await getCloudinaryConfig();
  if (!config.configured || !config.cloudName || !config.uploadPreset) {
    throw new CloudinaryUploadError({
      code: 'cloudinary/missing-config',
      isConfigMissing: true,
      messageEn:
        'Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET (or VITE_CLOUDINARY_CLOUD_NAME & VITE_CLOUDINARY_UPLOAD_PRESET) in environment Secrets.',
      messageBn:
        'Cloudinary কনফিগার করা হয়নি। অনুগ্রহ করে এনভায়রনমেন্ট Secrets-এ CLOUDINARY_CLOUD_NAME এবং CLOUDINARY_UPLOAD_PRESET সেট করুন।',
    });
  }

  // 3. Validate & compress image on client (NO fake progress emitted)
  onStageChange?.('compressing');
  const compressed = await compressAndResizeImage(file, maxDimension);

  // 4. Begin genuine XHR upload to Cloudinary at 0%
  onStageChange?.('uploading');
  onProgress?.(0);

  const cloudinaryFolder = getCloudinaryFolderPath(folder);
  const uploadUrl = getCloudinaryUploadEndpoint(config.cloudName);

  const formData = new FormData();
  const safeFileName = `mdsm_${folder}_${Date.now()}.${compressed.extension}`;
  formData.append('file', compressed.blob, safeFileName);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', cloudinaryFolder);

  return new Promise<UploadedPhotoResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    let lastLoaded = -1;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (inactivityTimer !== null) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
    };

    const failOnce = (err: CloudinaryUploadError) => {
      if (settled) return;
      settled = true;
      clearTimer();
      reject(err);
    };

    const armTimer = () => {
      clearTimer();
      inactivityTimer = setTimeout(() => {
        if (settled) return;
        try {
          xhr.abort();
        } catch {
          // ignore
        }
        failOnce(
          new CloudinaryUploadError({
            code: 'cloudinary/timeout',
            messageEn: `Upload timed out after ${Math.round(
              CLOUDINARY_UPLOAD_TIMEOUT_MS / 1000
            )}s with no network progress. Check your internet connection and retry.`,
            messageBn: `${Math.round(
              CLOUDINARY_UPLOAD_TIMEOUT_MS / 1000
            )} সেকেন্ড ধরে কোনো ডেটা আপলোড না হওয়ায় আপলোড বন্ধ হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।`,
          })
        );
      }, CLOUDINARY_UPLOAD_TIMEOUT_MS);
    };

    onCancelReady?.(() => {
      if (settled) return;
      clearTimer();
      xhr.abort();
      failOnce(
        new CloudinaryUploadError({
          code: 'cloudinary/canceled',
          messageEn: 'Photo upload was canceled.',
          messageBn: 'ছবি আপলোড বাতিল করা হয়েছে।',
        })
      );
    });

    xhr.open('POST', uploadUrl, true);
    armTimer();

    xhr.upload.onprogress = (event) => {
      if (settled) return;
      if (event.loaded > lastLoaded) {
        lastLoaded = event.loaded;
        armTimer();
      }
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress?.(Math.min(99, Math.max(0, pct)));
      }
    };

    xhr.onload = () => {
      if (settled) return;
      clearTimer();
      onStageChange?.('finalizing');

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            secure_url?: string;
            public_id?: string;
            created_at?: string;
          };
          const secureUrl = sanitizePersistedPhotoUrl(data.secure_url);
          if (!secureUrl || !data.public_id) {
            failOnce(
              new CloudinaryUploadError({
                code: 'cloudinary/invalid-response',
                status: xhr.status,
                messageEn: 'Cloudinary responded without a valid secure_url or public_id.',
                messageBn: 'Cloudinary থেকে সঠিক secure_url বা public_id পাওয়া যায়নি।',
              })
            );
            return;
          }
          settled = true;
          onProgress?.(100);
          resolve({
            url: secureUrl,
            cloudinaryImageUrl: secureUrl,
            cloudinaryPublicId: data.public_id,
            uploadedAt: data.created_at || new Date().toISOString(),
            folder: cloudinaryFolder,
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize,
          });
        } catch {
          failOnce(
            new CloudinaryUploadError({
              code: 'cloudinary/parse-error',
              status: xhr.status,
              messageEn: 'Could not parse Cloudinary upload response.',
              messageBn: 'Cloudinary-এর উত্তর পড়া যায়নি।',
            })
          );
        }
        return;
      }

      failOnce(parseCloudinaryResponseError(xhr.status, xhr.responseText || ''));
    };

    xhr.onerror = () => {
      failOnce(
        new CloudinaryUploadError({
          code: 'cloudinary/network-error',
          messageEn: 'Network error while uploading to Cloudinary. Check your internet connection.',
          messageBn: 'Cloudinary-তে আপলোডের সময় নেটওয়ার্ক ত্রুটি হয়েছে। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।',
        })
      );
    };

    xhr.onabort = () => {
      failOnce(
        new CloudinaryUploadError({
          code: 'cloudinary/canceled',
          messageEn: 'Photo upload was canceled.',
          messageBn: 'ছবি আপলোড বাতিল করা হয়েছে।',
        })
      );
    };

    xhr.send(formData);
  });
}

/**
 * Deletes an old/replaced Cloudinary asset strictly via our authenticated
 * server-side endpoint (/api/cloudinary/delete). Never calls Cloudinary API Secret from client.
 */
export async function deleteMadrasahPhotoByUrl(
  photoUrl?: string | null,
  publicId?: string | null
): Promise<void> {
  const url = (photoUrl || '').trim();
  const pid = (publicId || '').trim();
  if ((!url || url.startsWith('blob:')) && !pid) return;
  if (url && !pid && !url.includes('res.cloudinary.com')) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        publicId: pid || undefined,
        imageUrl: url || undefined,
      }),
    });
    if (!res.ok && res.status !== 501) {
      const errBody = await res.text().catch(() => '');
      console.warn('Server Cloudinary delete returned non-OK status:', res.status, errBody);
    }
  } catch (err) {
    console.warn('Could not delete old Cloudinary asset:', err);
  }
}
