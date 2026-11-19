import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  CloudUpload,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { getCloudinaryConfig } from '../config/cloudinary';
import {
  CloudinaryUploadError,
  deleteMadrasahPhotoByUrl,
  formatFileSize,
  mapCloudinaryError,
  PhotoFolder,
  uploadMadrasahPhoto,
  UploadStage,
  validateImageFile,
} from '../services/cloudinaryService';
import { Language } from '../types/madrasa';

export interface UploadedCloudinaryAsset {
  url: string;
  cloudinaryImageUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: string;
}

interface ImageUploaderProps {
  folder: PhotoFolder;
  label: string;
  chooseButtonLabel?: string;
  value: string;
  publicId?: string;
  onChange: (url: string) => void;
  onUploadedAsset?: (asset: UploadedCloudinaryAsset | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  lang: Language;
  disabled?: boolean;
  maxDimension?: number;
  aspect?: 'portrait' | 'square' | 'landscape';
  /** Saved URL & publicId on existing Firestore doc so canceling edit never deletes the live asset */
  persistedUrl?: string;
  persistedPublicId?: string;
}

interface UploadErrorDetails {
  code: string;
  messageEn: string;
  messageBn: string;
  isConfigMissing?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  folder,
  label,
  chooseButtonLabel,
  value,
  publicId,
  onChange,
  onUploadedAsset,
  onUploadingChange,
  lang,
  disabled = false,
  maxDimension = 900,
  aspect = 'portrait',
  persistedUrl,
  persistedPublicId,
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);
  const cancelUploadRef = useRef<(() => void) | null>(null);
  const localPreviewUrlRef = useRef<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imgLoadError, setImgLoadError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<UploadErrorDetails | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sizeSummary, setSizeSummary] = useState<string | null>(null);
  const [cloudinaryReady, setCloudinaryReady] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getCloudinaryConfig().then((cfg) => {
      if (active) setCloudinaryReady(cfg.configured);
    });
    return () => {
      active = false;
    };
  }, []);

  const revokeLocalPreview = () => {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
    }
    setLocalPreview(null);
  };

  useEffect(() => {
    return () => {
      cancelUploadRef.current?.();
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
      }
    };
  }, []);

  // Reset transient feedback when external value clears (e.g., after form submit)
  useEffect(() => {
    setImgLoadError(false);
    if (!value && !uploading) {
      revokeLocalPreview();
      setSuccessMsg(null);
      setSizeSummary(null);
      setProgress(0);
      setStage(null);
    }
  }, [value, uploading]);

  const activePreviewUrl = localPreview || value;

  const triggerPicker = () => {
    if (disabled || isUploadingRef.current) return;
    fileInputRef.current?.click();
  };

  const handleCancelUpload = () => {
    if (!isUploadingRef.current) return;
    cancelUploadRef.current?.();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (isUploadingRef.current || disabled) return;

    setErrorDetails(null);
    setSuccessMsg(null);
    setSizeSummary(null);
    setImgLoadError(false);

    try {
      validateImageFile(file);
    } catch (err) {
      const mapped = mapCloudinaryError(err);
      setErrorDetails({
        code: mapped.code,
        messageEn: mapped.messageEn,
        messageBn: mapped.messageBn,
        isConfigMissing: mapped.isConfigMissing,
      });
      return;
    }

    // Immediate local preview only for UI; never persisted to Firestore
    revokeLocalPreview();
    const previewUrl = URL.createObjectURL(file);
    localPreviewUrlRef.current = previewUrl;
    setLocalPreview(previewUrl);

    const previousUnsavedUrl = value && value !== persistedUrl ? value : undefined;
    const previousUnsavedPid =
      publicId && publicId !== persistedPublicId ? publicId : undefined;

    isUploadingRef.current = true;
    cancelUploadRef.current = null;
    setUploading(true);
    setStage('compressing');
    setProgress(0);
    onUploadingChange?.(true);

    try {
      const result = await uploadMadrasahPhoto(folder, file, {
        maxDimension,
        onStageChange: (nextStage) => setStage(nextStage),
        onProgress: (pct) => setProgress(pct),
        onCancelReady: (cancelFn) => {
          cancelUploadRef.current = cancelFn;
        },
      });

      // Only commit secure_url & metadata after Cloudinary confirms upload
      onChange(result.url);
      onUploadedAsset?.({
        url: result.url,
        cloudinaryImageUrl: result.cloudinaryImageUrl,
        cloudinaryPublicId: result.cloudinaryPublicId,
        uploadedAt: result.uploadedAt,
      });
      revokeLocalPreview();
      setCloudinaryReady(true);
      setSizeSummary(
        `${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`
      );
      setSuccessMsg(
        lang === 'bn'
          ? 'Cloudinary-তে ছবি সফলভাবে আপলোড হয়েছে!'
          : 'Photo uploaded to Cloudinary successfully!'
      );

      if (previousUnsavedUrl && previousUnsavedUrl !== result.url) {
        void deleteMadrasahPhotoByUrl(previousUnsavedUrl, previousUnsavedPid);
      }
    } catch (err) {
      revokeLocalPreview();
      setProgress(0);
      const mapped: CloudinaryUploadError = mapCloudinaryError(err);
      setErrorDetails({
        code: mapped.code,
        messageEn: mapped.messageEn,
        messageBn: mapped.messageBn,
        isConfigMissing: mapped.isConfigMissing,
      });
    } finally {
      cancelUploadRef.current = null;
      isUploadingRef.current = false;
      setUploading(false);
      setStage(null);
      onUploadingChange?.(false);
    }
  };

  const handleRemove = async () => {
    if (disabled || isUploadingRef.current) return;
    const urlToClean = value && value !== persistedUrl ? value : undefined;
    const pidToClean = publicId && publicId !== persistedPublicId ? publicId : undefined;
    revokeLocalPreview();
    setErrorDetails(null);
    setSuccessMsg(null);
    setSizeSummary(null);
    setProgress(0);
    setStage(null);
    setImgLoadError(false);
    onChange('');
    onUploadedAsset?.(null);
    if (urlToClean || pidToClean) {
      await deleteMadrasahPhotoByUrl(urlToClean, pidToClean);
    }
  };

  const previewSizeClass =
    aspect === 'landscape'
      ? 'w-36 h-24'
      : aspect === 'square'
        ? 'w-24 h-24'
        : 'w-24 h-28';

  const stageText = (() => {
    if (stage === 'compressing') {
      return lang === 'bn'
        ? 'ছবি কমপ্রেস ও রিসাইজ হচ্ছে...'
        : 'Preparing & resizing photo...';
    }
    if (stage === 'finalizing') {
      return lang === 'bn'
        ? 'নিরাপদ Cloudinary লিংক প্রস্তুত হচ্ছে...'
        : 'Finalizing secure Cloudinary URL...';
    }
    return lang === 'bn'
      ? `Cloudinary-তে আপলোড হচ্ছে (${progress}%)...`
      : `Uploading to Cloudinary (${progress}%)...`;
  })();

  const defaultChooseText =
    chooseButtonLabel ||
    (lang === 'bn' ? 'ছবি নির্বাচন করুন / Choose Photo' : 'Choose Photo / ছবি নির্বাচন করুন');

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-xs font-bold text-[#123466] flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5 text-[#B8860B]" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 text-[#123466]/80 font-medium">
            <CloudUpload className="w-3 h-3 text-[#B8860B]" />
            madrasa/{folder}
          </span>
          <span>· JPG, JPEG, PNG, WEBP</span>
        </div>
      </div>

      {/* Native file picker supporting Android Gallery, iPhone Photos & Desktop File Manager */}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="sr-only"
      />

      {cloudinaryReady === false && !errorDetails && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          {lang === 'bn'
            ? 'Cloudinary সেটআপ বাকি: এনভায়রনমেন্ট Secrets-এ CLOUDINARY_CLOUD_NAME এবং CLOUDINARY_UPLOAD_PRESET (Unsigned) যোগ করুন।'
            : 'Cloudinary setup required: Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET (Unsigned preset) in Secrets before uploading.'}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Live Preview Box */}
        <div
          className={`relative ${previewSizeClass} rounded-xl border-2 border-[#D4AF37]/70 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-sm`}
        >
          {activePreviewUrl && !imgLoadError ? (
            <img
              src={activePreviewUrl}
              alt={label}
              referrerPolicy="no-referrer"
              onError={() => setImgLoadError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 px-2 text-center">
              <ImagePlus className="w-6 h-6 text-[#123466]/50 mb-1" />
              <span className="text-[10px] font-medium leading-tight">
                {lang === 'bn' ? 'কোনো ছবি নেই' : 'No Photo'}
              </span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-[#071426]/70 flex flex-col items-center justify-center text-white px-1 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#F2D06B]" />
              <span className="text-[11px] font-bold font-mono-num mt-1">
                {stage === 'compressing' ? '...' : `${progress}%`}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls & Feedback */}
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {uploading ? (
              <button
                type="button"
                onClick={handleCancelUpload}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 text-xs font-semibold transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Upload / বাতিল করুন</span>
              </button>
            ) : !activePreviewUrl ? (
              <button
                type="button"
                onClick={triggerPicker}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <ImagePlus className="w-4 h-4 text-[#F2D06B]" />
                <span>{defaultChooseText}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={triggerPicker}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#F2D06B]" />
                  <span>{lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ছবি সরান' : 'Remove Photo'}</span>
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            {lang === 'bn'
              ? 'ফোনের গ্যালারি (Android/iPhone) বা কম্পিউটার থেকে ছবি নির্বাচন করুন। বড় ছবি স্বয়ংক্রিয়ভাবে রিসাইজ ও কমপ্রেস হবে।'
              : 'Select from Android Gallery, iPhone Photos, or Computer. Large photos are automatically resized & compressed before upload.'}
          </p>

          {/* Real Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#123466]">
                <span>{stageText}</span>
                {stage !== 'compressing' && (
                  <span className="font-mono-num">{progress}%</span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#123466] to-[#D4AF37] transition-all duration-200"
                  style={{ width: `${stage === 'compressing' ? 0 : progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Feedback */}
          {successMsg && !uploading && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {successMsg}
                {sizeSummary ? ` (${sizeSummary})` : ''}
              </span>
            </div>
          )}

          {/* Bilingual Error Feedback */}
          {errorDetails && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800 space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-rose-900 break-all">
                    Error Code: <span className="font-mono-num">{errorDetails.code}</span>
                  </div>
                  <p className="leading-snug">{errorDetails.messageEn}</p>
                  <p className="leading-snug text-rose-700">{errorDetails.messageBn}</p>
                  {errorDetails.isConfigMissing && (
                    <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      {lang === 'bn'
                        ? 'নোট: কোনো অসম্পূর্ণ বা নকল ছবির লিংক ডাটাবেসে সংরক্ষণ করা হয়নি।'
                        : 'Note: No un-uploaded image URL was saved to Firestore.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
