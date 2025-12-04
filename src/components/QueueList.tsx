import React from 'react';
import { BatchFile, ProcessStatus } from '../types';

interface QueueListProps {
  files: BatchFile[];
  onSelectFile: (id: string) => void;
  selectedFileId: string | null;
  onRemoveFile: (id: string) => void;
}

export const QueueList: React.FC<QueueListProps> = ({ files, onSelectFile, selectedFileId, onRemoveFile }) => {
  const getStatusIcon = (status: ProcessStatus) => {
    switch (status) {
      case ProcessStatus.COMPLETED:
        return <i className="fa-solid fa-circle-check text-green-500"></i>;
      case ProcessStatus.ERROR:
        return <i className="fa-solid fa-circle-exclamation text-red-500"></i>;
      case ProcessStatus.UPLOADING:
        return <i className="fa-solid fa-arrow-up text-blue-500 animate-bounce"></i>;
      case ProcessStatus.TRANSCRIBING:
      case ProcessStatus.POLISHING:
        return <i className="fa-solid fa-circle-notch fa-spin text-blue-500"></i>;
      case ProcessStatus.QUEUED:
        return <i className="fa-regular fa-clock text-gray-400"></i>;
      default:
        return <i className="fa-regular fa-circle text-gray-300"></i>;
    }
  };

  const getStatusText = (file: BatchFile) => {
    if (file.status === ProcessStatus.UPLOADING) return `Uploading ${file.uploadProgress || 0}%`;
    if (file.status === ProcessStatus.TRANSCRIBING) return 'Transcribing...';
    if (file.status === ProcessStatus.POLISHING) return 'Polishing...';
    return file.status.toLowerCase();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full md:w-80 lg:w-96 flex-shrink-0">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-coffee-600"></i>
          Queue ({files.length})
        </h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
          {files.filter(f => f.status === ProcessStatus.COMPLETED).length} Done
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <i className="fa-solid fa-mug-hot text-4xl mb-4 opacity-30"></i>
            <p className="text-sm">No files yet.</p>
            <p className="text-xs opacity-70">Drag files to start.</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                selectedFileId === file.id
                  ? 'border-coffee-500 bg-coffee-50 ring-1 ring-coffee-500'
                  : 'border-gray-200 hover:border-coffee-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-lg text-gray-400">
                    {file.file.type.includes('video') ? <i className="fa-regular fa-file-video"></i> : <i className="fa-regular fa-file-audio"></i>}
                  </span>
                  <h3 className="font-medium text-sm text-gray-800 truncate" title={file.file.name}>
                    {file.file.name}
                  </h3>
                </div>
                {file.status === ProcessStatus.IDLE && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                    className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(file.status)}
                  <span className={`capitalize ${file.status === ProcessStatus.ERROR ? 'text-red-500' : 'text-gray-500'}`}>
                    {getStatusText(file)}
                  </span>
                </div>
                <span className="text-gray-400">{(file.file.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>

              {(file.status === ProcessStatus.UPLOADING || file.status === ProcessStatus.TRANSCRIBING || file.status === ProcessStatus.POLISHING) && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 rounded-b-lg overflow-hidden w-full">
                  {file.status === ProcessStatus.UPLOADING ? (
                    <div
                      className="h-full bg-coffee-500 transition-all duration-300"
                      style={{ width: `${file.uploadProgress || 0}%` }}
                    ></div>
                  ) : (
                    <div className="h-full w-full bg-blue-500 animate-pulse opacity-50"></div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
