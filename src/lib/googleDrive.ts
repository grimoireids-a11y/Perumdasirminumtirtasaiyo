import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

// Target Google Drive Folder ID & Link as specified by User
export const GOOGLE_DRIVE_FOLDER_ID = '1nb053O6l_2BgRgWDZ-OembBPqLsz1AaN';
export const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1nb053O6l_2BgRgWDZ-OembBPqLsz1AaN?usp=sharing';

// In-memory access token cache for Google Drive API operations
let cachedDriveAccessToken: string | null = null;

export const setDriveAccessToken = (token: string | null) => {
  cachedDriveAccessToken = token;
};

export const getDriveAccessToken = (): string | null => {
  return cachedDriveAccessToken;
};

export const clearDriveAccessToken = () => {
  cachedDriveAccessToken = null;
};

/**
 * Ensures a valid Google Drive access token is available.
 * If not present in memory, triggers Google Auth popup requesting drive.file scope.
 */
export const requestDriveAccessToken = async (): Promise<string> => {
  if (cachedDriveAccessToken) {
    return cachedDriveAccessToken;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Gagal mendapatkan token akses Google Drive. Pastikan Anda menyetujui izin akses Google Drive.'
      );
    }
    cachedDriveAccessToken = credential.accessToken;
    return cachedDriveAccessToken;
  } catch (err: any) {
    console.error('Google Drive authorization error:', err);
    throw new Error(
      err?.message || 'Otorisasi Google Drive dibatalkan atau tidak berhasil. Silakan coba kembali.'
    );
  }
};

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  size?: number;
}

/**
 * Uploads an evidence file directly to Google Drive Folder:
 * https://drive.google.com/drive/folders/1nb053O6l_2BgRgWDZ-OembBPqLsz1AaN
 * Uses standard two-step Google Drive v3 upload with parents set to the specified folder.
 */
export const uploadFileToDrive = async (
  file: File,
  unitName?: string,
  recNumber?: string,
  onProgress?: (statusMsg: string) => void
): Promise<DriveUploadResult> => {
  onProgress?.('Menghubungkan otorisasi Google Drive...');
  const token = await requestDriveAccessToken();

  const cleanUnit = (unitName || 'UNIT').replace(/[/\\?%*:|"<>]/g, '-').trim();
  const cleanRec = (recNumber || '').replace(/[/\\?%*:|"<>]/g, '-').trim();
  const timestamp = new Date().toISOString().slice(0, 10);
  const driveFileName = `[${cleanUnit}] ${cleanRec ? `${cleanRec}_` : ''}${timestamp}_${file.name}`;

  onProgress?.('Mempersiapkan berkas pada folder Google Drive SPI...');

  // 1. Create file metadata with parent folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: driveFileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
      mimeType: file.type || 'application/octet-stream',
      description: `Bukti Aksi Tindak Lanjut Rekomendasi ${recNumber || ''} oleh ${unitName || 'Unit Kerja'}. Diunggah via aplikasi SPI SMART.`,
    }),
  });

  if (!createRes.ok) {
    if (createRes.status === 401) {
      cachedDriveAccessToken = null; // Expired token
    }
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message ||
        `Gagal membuat berkas di Google Drive (Kode HTTP: ${createRes.status}). Silakan coba otorisasi ulang.`
    );
  }

  const metadata = await createRes.json();
  const fileId = metadata.id;

  // 2. Upload file binary payload
  onProgress?.('Mengunggah dokumen bukti fisik ke cloud Google Drive...');
  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    }
  );

  if (!uploadRes.ok) {
    // Attempt cleanup of empty metadata file on failure
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message ||
        `Gagal mengunggah konten berkas ke Google Drive (Kode HTTP: ${uploadRes.status}).`
    );
  }

  // 3. Construct shareable webViewLink
  const webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

  onProgress?.('Berhasil tersimpan di Google Drive!');
  return {
    fileId,
    fileName: driveFileName,
    webViewLink,
    size: file.size,
  };
};

/**
 * Permanently deletes a file from Google Drive by its fileId.
 * Used by Superuser when deleting a follow-up action to free up storage.
 */
export const deleteFileFromDrive = async (fileId: string): Promise<boolean> => {
  if (!fileId) return true;

  try {
    const token = await requestDriveAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // If 404, file is already gone (not an error)
      if (res.status === 404) {
        return true;
      }
      if (res.status === 401) {
        cachedDriveAccessToken = null;
      }
      const errData = await res.json().catch(() => ({}));
      console.warn('Gagal menghapus file dari Google Drive:', errData);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error saat menghapus berkas dari Google Drive:', err);
    return false;
  }
};
