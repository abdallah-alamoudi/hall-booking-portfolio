import React, { useRef, useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hallApi } from '@/shared/api/halls';
import { API_BASE_URL } from '@/shared/api/client';
import { cn } from '@/lib/utils';

export function ImageUploader({ photos = [], onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validation: Max 10 photos total
    if (photos.length + files.length > 10) {
      setError('You can only upload a maximum of 10 photos.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validation: Max 5MB per file
    const MAX_SIZE = 5 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > MAX_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload files sequentially or in parallel
      const uploadPromises = files.map(async (file) => {
        const response = await hallApi.uploadPhoto(file);
        return {
          url: response.url,
          isCover: false, // Default to false, will handle logic below
        };
      });

      const newPhotos = await Promise.all(uploadPromises);
      
      // Combine with existing photos
      const updatedPhotos = [...photos, ...newPhotos];

      // Ensure at least one cover photo exists if we have photos
      if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isCover)) {
        updatedPhotos[0].isCover = true;
      }

      onChange(updatedPhotos);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload one or more images. Please try again.');
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove) => {
    const newPhotos = photos.filter((_, index) => index !== indexToRemove);
    
    // If we removed the cover photo, make the new first photo the cover
    if (photos[indexToRemove].isCover && newPhotos.length > 0) {
      newPhotos[0].isCover = true;
    }

    onChange(newPhotos);
  };

  const setCover = (indexToSet) => {
    const newPhotos = photos.map((photo, index) => ({
      ...photo,
      isCover: index === indexToSet
    }));
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Uploading...' : 'Add Photos'}
        </Button>
        <span className="text-sm text-muted-foreground">
          Supported: JPEG, PNG, WebP (Max 5MB)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={cn(
                "group relative aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                photo.isCover && "ring-2 ring-primary border-primary"
              )}
              onClick={() => setCover(index)}
            >
              <img
                src={photo.url.startsWith('http') ? photo.url : `${API_BASE_URL}${photo.url}`}
                alt={`Venue photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Cover Badge */}
              {photo.isCover && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Cover
                </div>
              )}

              {/* Hover overlay for actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              
              {!photo.isCover && (
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    Click to set as cover
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
          <div className="flex justify-center mb-2">
            <ImageIcon className="h-8 w-8 opacity-50" />
          </div>
          <p>No photos added yet (Max 10)</p>
          <p className="text-xs mt-1">Photos generally improve booking rates</p>
        </div>
      )}
    </div>
  );
}
