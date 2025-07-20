import React, { useState, useRef } from 'react';
import { FaFileUpload, FaFile, FaTimes, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface DocumentUploaderProps {
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  isProcessing: boolean;
  supportedTypes?: string[];
  maxSize?: number;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFile,
  isProcessing,
  supportedTypes = ['pdf', 'docx', 'txt'],
  maxSize = 50 * 1024 * 1024 // 50MB default
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setError('');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!supportedTypes.includes(fileExtension || '')) {
      setError(`${t('Unsupported file type. Please upload:')} ${supportedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`${t('File too large. Maximum size:')} ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    onFileUpload(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploadedFile) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaFile className="text-green-600 text-xl" />
            <div>
              <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
              <p className="text-xs text-green-600">{formatFileSize(uploadedFile.size)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isProcessing && (
              <FaSpinner className="text-green-600 animate-spin" />
            )}
            <button
              onClick={onFileRemove}
              className="text-green-600 hover:text-green-800 transition-colors"
              disabled={isProcessing}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-[#10A3A2] bg-[#10A3A2]/10'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={supportedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="space-y-2">
            <FaSpinner className="text-4xl text-[#10A3A2] mx-auto animate-spin" />
            <p className="text-[#10A3A2] font-medium">{t('Processing document...')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <FaFileUpload className="text-4xl text-gray-400 mx-auto" />
            <p className="text-gray-600 font-medium">
              {t('Drag and drop your document here, or click to browse')}
            </p>
            <p className="text-sm text-gray-500">
              {t('Supported:')} {supportedTypes.join(', ').toUpperCase()} (max {(maxSize / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
}; 