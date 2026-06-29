'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  label?: string;
  accept?: string;
  onFile: (file: File) => void;
  loading?: boolean;
  preview?: string;
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => resolve(blob ? new File([blob], file.name, { type: file.type }) : file),
        file.type,
        quality,
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function FileUpload({ label, accept = 'image/*', onFile, loading, preview }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const src = localPreview ?? preview;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    onFile(compressed);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>}
      {src && (
        <img src={src} alt="preview" className="h-20 w-20 rounded-lg object-cover border border-[var(--color-border)]" />
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()} loading={loading}>
        <Upload size={14} /> Upload
      </Button>
    </div>
  );
}
