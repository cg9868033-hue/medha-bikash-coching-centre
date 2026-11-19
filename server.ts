import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const BOOTSTRAPPED_SUPER_ADMIN_EMAIL = 'cg9868033@gmail.com';

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(raw) as FirebaseAppletConfig;
}

const PLACEHOLDER_VALUES = new Set([
  '',
  'MY_CLOUD_NAME',
  '[MY_CLOUD_NAME]',
  'MY_UNSIGNED_UPLOAD_PRESET',
  '[MY_UNSIGNED_UPLOAD_PRESET]',
  'MY_CLOUDINARY_API_KEY',
  'MY_CLOUDINARY_API_SECRET',
  'undefined',
  'null',
]);

function cleanEnv(val: string | undefined): string {
  const trimmed = (val || '').trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return '';
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return '';
  return trimmed;
}

function getCloudinaryServerConfig() {
  const cloudName =
    cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) ||
    cleanEnv(process.env.VITE_CLOUDINARY_CLOUD_NAME);
  const uploadPreset =
    cleanEnv(process.env.CLOUDINARY_UPLOAD_PRESET) ||
    cleanEnv(process.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  return {
    cloudName,
    uploadPreset,
    apiKey,
    apiSecret,
    configured: Boolean(cloudName && uploadPreset),
    serverDeleteEnabled: Boolean(cloudName && apiKey && apiSecret),
  };
}

const ALLOWED_MADRASA_PUBLIC_ID_REGEX =
  /^madrasa\/(students|teachers|branding|banners|courses|notices|certificates|admissions)\/[a-zA-Z0-9_\-\/]+$/;

function extractCloudinaryPublicId(imageUrl: string, expectedCloudName: string): string | null {
  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname !== 'res.cloudinary.com') return null;
    const segments = parsed.pathname.split('/').filter(Boolean);
    // Expected path: /<cloudName>/image/upload/(v<version>|<transforms>...)/<publicId>.<ext>
    if (segments.length < 4) return null;
    if (expectedCloudName && segments[0] !== expectedCloudName) return null;
    const uploadIdx = segments.indexOf('upload');
    if (uploadIdx === -1 || uploadIdx + 1 >= segments.length) return null;

    let rest = segments.slice(uploadIdx + 1);
    // Skip optional transformation segments before version or madrasa folder
    const madrasaIdx = rest.indexOf('madrasa');
    if (madrasaIdx === -1) return null;
    rest = rest.slice(madrasaIdx);
    const joined = rest.join('/');
    // Remove file extension on last segment
    const withoutExt = joined.replace(/\.[a-zA-Z0-9]+$/, '');
    return ALLOWED_MADRASA_PUBLIC_ID_REGEX.test(withoutExt) ? withoutExt : null;
  } catch {
    return null;
  }
}

interface VerifiedFirebaseCaller {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: string;
  status: string;
}

async function verifyFirebaseCaller(
  idToken: string,
  fbConfig: FirebaseAppletConfig
): Promise<VerifiedFirebaseCaller | null> {
  if (!idToken || !fbConfig.apiKey || !fbConfig.projectId) {
    return null;
  }

  // 1. Verify Firebase ID Token signature, expiry & emailVerified via Identity Toolkit
  const lookupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(fbConfig.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!lookupRes.ok) {
    return null;
  }
  const lookupData = (await lookupRes.json()) as {
    users?: Array<{
      localId?: string;
      email?: string;
      emailVerified?: boolean;
      disabled?: boolean;
    }>;
  };
  const authUser = lookupData.users?.[0];
  if (!authUser || !authUser.localId || !authUser.email || authUser.disabled) {
    return null;
  }

  const uid = authUser.localId;
  const email = authUser.email;
  const emailVerified = Boolean(authUser.emailVerified);
  if (!emailVerified) {
    return null;
  }

  if (email.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL) {
    return { uid, email, emailVerified, role: 'super_admin', status: 'active' };
  }

  // 2. Fetch caller's Firestore role/status using their own ID token (enforces firestore.rules)
  const dbId = fbConfig.firestoreDatabaseId || '(default)';
  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    fbConfig.projectId
  )}/databases/${encodeURIComponent(dbId)}/documents/users/${encodeURIComponent(uid)}`;

  const docRes = await fetch(docUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!docRes.ok) {
    return { uid, email, emailVerified, role: 'student', status: 'active' };
  }

  const docData = (await docRes.json()) as {
    fields?: {
      role?: { stringValue?: string };
      status?: { stringValue?: string };
    };
  };

  return {
    uid,
    email,
    emailVerified,
    role: docData.fields?.role?.stringValue || 'student',
    status: docData.fields?.status?.stringValue || 'pending',
  };
}

async function createAppServer() {
  const app = express();
  const firebaseConfig = loadFirebaseConfig();

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const cld = getCloudinaryServerConfig();
    res.json({
      ok: true,
      service: 'mdsm-backend',
      cloudinaryConfigured: cld.configured,
      cloudinaryServerDeleteEnabled: cld.serverDeleteEnabled,
    });
  });

  // Safe public Cloudinary settings (NEVER exposes API Key or API Secret)
  app.get('/api/cloudinary/config', (_req: Request, res: Response) => {
    const cld = getCloudinaryServerConfig();
    res.json({
      cloudName: cld.cloudName,
      uploadPreset: cld.uploadPreset,
      configured: cld.configured,
      serverDeleteEnabled: cld.serverDeleteEnabled,
    });
  });

  // Secure authenticated server-side Cloudinary asset deletion
  app.post('/api/cloudinary/delete', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!idToken) {
        res.status(401).json({
          error: 'Authentication token required to delete Cloudinary assets.',
        });
        return;
      }

      const caller = await verifyFirebaseCaller(idToken, firebaseConfig);
      if (!caller) {
        res.status(401).json({
          error: 'Invalid or unverified Firebase authentication token.',
        });
        return;
      }

      const cld = getCloudinaryServerConfig();
      const rawPublicId =
        typeof req.body?.publicId === 'string' ? req.body.publicId.trim() : '';
      const rawImageUrl =
        typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';

      const targetPublicId =
        (ALLOWED_MADRASA_PUBLIC_ID_REGEX.test(rawPublicId) ? rawPublicId : null) ||
        (rawImageUrl ? extractCloudinaryPublicId(rawImageUrl, cld.cloudName) : null);

      if (!targetPublicId) {
        res.status(400).json({
          error: 'Invalid or unauthorized Cloudinary asset identifier.',
        });
        return;
      }

      const isAdmin =
        caller.status === 'active' &&
        (caller.role === 'super_admin' || caller.role === 'admin');
      const isAdmissionDraft = targetPublicId.startsWith('madrasa/admissions/');

      if (!isAdmin && !isAdmissionDraft) {
        res.status(403).json({
          error: 'Only active administrators can delete official Madrasah image assets.',
        });
        return;
      }

      if (!cld.serverDeleteEnabled) {
        res.status(501).json({
          error:
            'Server-side Cloudinary API credentials (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET) are not configured.',
          skipped: true,
        });
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const paramsToSign = `invalidate=true&public_id=${targetPublicId}&timestamp=${timestamp}${cld.apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const form = new URLSearchParams();
      form.set('public_id', targetPublicId);
      form.set('timestamp', String(timestamp));
      form.set('api_key', cld.apiKey);
      form.set('signature', signature);
      form.set('invalidate', 'true');

      const destroyRes = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cld.cloudName)}/image/destroy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        }
      );

      const destroyData = (await destroyRes.json()) as {
        result?: string;
        error?: { message?: string };
      };

      if (!destroyRes.ok) {
        res.status(destroyRes.status).json({
          error: destroyData.error?.message || 'Cloudinary asset deletion failed.',
        });
        return;
      }

      res.json({
        ok: true,
        publicId: targetPublicId,
        result: destroyData.result || 'ok',
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Internal server error during image deletion.',
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meder Dhar Shishu Madrasah server listening on http://0.0.0.0:${PORT}`);
  });
}

createAppServer().catch((err) => {
  console.error('Failed to start Madrasah server:', err);
  process.exit(1);
});
