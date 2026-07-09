'use client';

import { useState, useRef } from 'react';

interface Props {
  accept: string;
  onUpload: (url: string, name: string) => void;
  onError?: (error: string) => void;
  label?: string;
  className?: string;
}

export default function CloudinaryUpload({ accept, onUpload, onError, label, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!cloudName || !uploadPreset) {
      onError?.('Cloudinary no está configurado');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const xhr = new XMLHttpRequest();

      const url = await new Promise<string>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          console.log('[Cloudinary] Response:', xhr.status, xhr.responseText);
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } else {
            const data = JSON.parse(xhr.responseText);
            console.error('[Cloudinary] Error:', data);
            reject(new Error(data.error?.message || `HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          console.error('[Cloudinary] Network error');
          reject(new Error('Error de red'));
        };
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
        xhr.send(formData);
      });

      console.log('[Cloudinary] Upload OK:', url);
      onUpload(url, file.name);
    } catch (err: any) {
      console.error('[Cloudinary] Upload failed:', err);
      onError?.(`Error: ${err.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className={className || 'btn btn-secondary'}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Subiendo {progress}%
          </span>
        ) : (
          label || 'Seleccionar archivo'
        )}
      </button>
    </div>
  );
}
