import React, { useCallback } from 'react';
import { useToast } from './Toast';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, isProcessing }) => {
  const { showToast } = useToast();

  const validateAndFilterFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    let hasInvalidType = false;
    let hasOversized = false;

    files.forEach(file => {
      const isValidType = file.type.startsWith('audio/') || file.type.startsWith('video/');
      const isValidSize = file.size <= MAX_FILE_SIZE;

      if (!isValidType) {
        hasInvalidType = true;
      } else if (!isValidSize) {
        hasOversized = true;
      } else {
        validFiles.push(file);
      }
    });

    if (hasInvalidType) {
      showToast('Unsupported file format. Please use MP3, WAV, M4A, or MP4.', 'error');
    }
    if (hasOversized) {
      showToast('Some files exceed the 100MB size limit.', 'error');
    }

    return validFiles;
  }, [showToast]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;

      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      const validFiles = validateAndFilterFiles(droppedFiles);

      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    },
    [onFilesAdded, isProcessing, validateAndFilterFiles]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const validFiles = validateAndFilterFiles(selectedFiles);
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative group border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
        isProcessing
          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          : 'border-coffee-300 bg-white hover:border-coffee-500 hover:bg-coffee-50 cursor-pointer shadow-sm hover:shadow-md'
      }`}
    >
      <input
        type="file"
        multiple
        accept="audio/*,video/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isProcessing ? 'bg-gray-100 text-gray-400' : 'bg-coffee-100 text-coffee-600'}`}>
          <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-700">
            {isProcessing ? 'Processing in progress...' : 'Drop audio files here'}
          </p>
          <p className="text-sm text-gray-500">
            Support MP3, WAV, M4A, MP4 (Audio). Batch processing ready.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <i className="fa-solid fa-info-circle mr-1"></i>
            Max file size: 100MB per file
          </p>
        </div>
        {!isProcessing && (
          <button className="px-4 py-2 text-sm font-medium text-coffee-700 bg-coffee-100 rounded-md hover:bg-coffee-200 transition-colors">
            Or select files
          </button>
        )}
      </div>
    </div>
  );
};
