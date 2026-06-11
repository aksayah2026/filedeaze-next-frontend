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

export function FileUpload({ label, accept = 'image/*', onFile, loading, preview }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const src = localPreview ?? preview;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      {src && (
        <img src={src} alt="preview" className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <Button variant="outline" size="sm" type="button" onClick={() => inputRef.current?.click()} loading={loading}>
        <Upload size={14} /> Upload
      </Button>
    </div>
  );
}
