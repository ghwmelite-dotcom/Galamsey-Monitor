'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, File, Loader2, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: 'image' | 'video' | 'document';
  thumbnail_url?: string;
}

interface ImageUploaderProps {
  onUpload: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  className?: string;
}

export default function ImageUploader({
  onUpload,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = 'image/*,video/mp4,application/pdf',
  className = '',
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    // Check file count
    const remainingSlots = maxFiles - files.length;
    if (fileList.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more file(s)`);
      return;
    }

    const filesToUpload = Array.from(fileList);

    // Validate files
    for (const file of filesToUpload) {
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return;
      }
    }

    setUploading(true);

    try {
      const uploaded: UploadedFile[] = [];

      for (const file of filesToUpload) {
        const result = await uploadFile(file);
        if (result) {
          uploaded.push(result);
        }
      }

      const newFiles = [...files, ...uploaded];
      setFiles(newFiles);
      onUpload(newFiles);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [files, maxFiles, maxSize, onUpload]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-ghana-green bg-ghana-green/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-ghana-green animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Images, PDF, or MP4 (max {maxSize / 1024 / 1024}MB each)
            </p>
            {files.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {files.length} of {maxFiles} files uploaded
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {file.file_type === 'image' ? (
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={file.thumbnail_url || file.file_url}
                    alt={file.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : file.file_type === 'video' ? (
                <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-6 w-6 text-purple-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <File className="h-6 w-6 text-blue-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file_size)}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
