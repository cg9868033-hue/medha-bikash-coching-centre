export {
  CloudinaryUploadError,
  CloudinaryUploadError as StorageUploadError,
  compressAndResizeImage,
  deleteMadrasahPhotoByUrl,
  formatFileSize,
  mapCloudinaryError,
  mapCloudinaryError as mapFirebaseStorageError,
  sanitizePersistedPhotoUrl,
  uploadMadrasahPhoto,
  validateImageFile,
} from './cloudinaryService';
export type {
  CompressedImageResult,
  PhotoFolder,
  UploadedPhotoResult,
  UploadStage,
} from './cloudinaryService';
