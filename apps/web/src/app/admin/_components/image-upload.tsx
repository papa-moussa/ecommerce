'use client';

import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { adminApi } from '@/lib/admin-api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, onRemove, folder = 'products' }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const { signature, timestamp, apiKey, cloudName } = await adminApi.uploads.sign(folder);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      onChange(data.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError("Échec de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-brand-ink/[0.08]">
            <Image src={value} alt="Preview" fill className="object-cover" />
            <button
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
              className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-sm"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-brand-ink/[0.12] rounded-2xl cursor-pointer hover:border-brand-gold hover:bg-brand-gold/[0.03] transition-all relative group">
            {loading ? (
              <Loader2 className="animate-spin text-brand-gold" size={28} />
            ) : (
              <>
                <Upload
                  className="text-brand-ink/20 group-hover:text-brand-gold mb-2 transition-colors"
                  size={28}
                />
                <span className="text-xs text-brand-ink/30 group-hover:text-brand-gold/80 font-medium text-center px-2 transition-colors">
                  Cliquez pour uploader
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={onUpload}
              disabled={loading}
            />
          </label>
        )}

        <div className="flex-1">
          <p className="text-xs text-brand-ink/40 leading-relaxed font-medium">
            Format supporté : JPG, PNG, WebP.
            <br />
            Taille max : 5MB.
          </p>
          {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}
