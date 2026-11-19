export const CLOUDINARY_FOLDERS = {
  students: 'madrasa/students',
  teachers: 'madrasa/teachers',
  branding: 'madrasa/branding',
  banners: 'madrasa/banners',
  courses: 'madrasa/courses',
  notices: 'madrasa/notices',
  certificates: 'madrasa/certificates',
  admissions: 'madrasa/admissions',
} as const;

export type CloudinaryFolderKey = keyof typeof CLOUDINARY_FOLDERS;

export const ALLOWED_CLOUDINARY_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_CLOUDINARY_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB pre-compression selection limit
export const MAX_CLOUDINARY_UPLOAD_BYTES = 4.5 * 1024 * 1024; // 4.5 MB compressed limit
export const CLOUDINARY_UPLOAD_TIMEOUT_MS = 35000; // 35s inactivity timeout

export interface CloudinaryPublicConfig {
  cloudName: string;
  uploadPreset: string;
  configured: boolean;
  serverDeleteEnabled: boolean;
}

const PLACEHOLDER_TOKENS = new Set([
  '',
  'MY_CLOUD_NAME',
  '[MY_CLOUD_NAME]',
  'MY_UNSIGNED_UPLOAD_PRESET',
  '[MY_UNSIGNED_UPLOAD_PRESET]',
  'undefined',
  'null',
]);

export function cleanCloudinaryValue(val?: string | null): string {
  const trimmed = (val || '').trim();
  if (!trimmed || PLACEHOLDER_TOKENS.has(trimmed)) {
    return '';
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return '';
  }
  return trimmed;
}

// Compile-time Vite public env fallback (never includes API Secret)
const BUILD_CLOUD_NAME = cleanCloudinaryValue(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
);
const BUILD_UPLOAD_PRESET = cleanCloudinaryValue(
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined
);

let cachedConfig: CloudinaryPublicConfig | null = null;
let inflightPromise: Promise<CloudinaryPublicConfig> | null = null;

export function getStaticCloudinaryConfig(): CloudinaryPublicConfig {
  const configured = Boolean(BUILD_CLOUD_NAME && BUILD_UPLOAD_PRESET);
  return {
    cloudName: BUILD_CLOUD_NAME,
    uploadPreset: BUILD_UPLOAD_PRESET,
    configured,
    serverDeleteEnabled: false,
  };
}

/**
 * Resolves public Cloudinary configuration (cloudName + restricted unsigned uploadPreset).
 * Prefers server /api/cloudinary/config so runtime Secrets work seamlessly without
 * rebuilding Vite, and safely falls back to VITE_* build env variables.
 * Never returns or touches API Secret in the browser.
 */
export async function getCloudinaryConfig(forceRefresh = false): Promise<CloudinaryPublicConfig> {
  if (cachedConfig && !forceRefresh) {
    return cachedConfig;
  }
  if (inflightPromise && !forceRefresh) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const res = await fetch('/api/cloudinary/config', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = (await res.json()) as Partial<CloudinaryPublicConfig>;
        const cloudName = cleanCloudinaryValue(data.cloudName) || BUILD_CLOUD_NAME;
        const uploadPreset = cleanCloudinaryValue(data.uploadPreset) || BUILD_UPLOAD_PRESET;
        const config: CloudinaryPublicConfig = {
          cloudName,
          uploadPreset,
          configured: Boolean(cloudName && uploadPreset),
          serverDeleteEnabled: Boolean(data.serverDeleteEnabled),
        };
        cachedConfig = config;
        return config;
      }
    } catch {
      // Fallback cleanly to Vite build-time env if backend is unreachable
    }

    const fallback = getStaticCloudinaryConfig();
    cachedConfig = fallback;
    return fallback;
  })();

  try {
    return await inflightPromise;
  } finally {
    inflightPromise = null;
  }
}

export function getCloudinaryUploadEndpoint(cloudName: string): string {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
}

export function getCloudinaryFolderPath(folder: CloudinaryFolderKey): string {
  return CLOUDINARY_FOLDERS[folder];
}
