import React, { useState } from 'react';
import { BatchFile, ProcessStatus } from '../types';
import { downloadJSON, downloadText } from '../services/utils';
import { useToast } from './Toast';

interface ResultPanelProps {
  file: BatchFile | undefined;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  onBack?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ file, onRetry, onCancel, onBack }) => {
  const [activeTab, setActiveTab] = useState<'clean' | 'raw' | 'summary'>('clean');
  const { showToast } = useToast();

  const getFriendlyErrorMessage = (error: string | undefined): string => {
    if (!error) return "An unknown error occurred during processing.";

    const errorMap: Record<string, string> = {
      'Failed to process': 'The file could not be processed. Please check the file format and try again.',
      'Network Error': 'Unable to connect to the server. Please check your network connection.',
      'Failed to fetch': 'Unable to connect to the server. Please ensure the backend is running.',
      'timeout': 'The request timed out. The file may be too large or the server is busy.',
      'Unsupported': 'This file format is not supported. Please use MP3, WAV, M4A, or MP4.',
      'Too large': 'The file exceeds the maximum size limit of 100MB.',
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    return error;
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-wave-square text-4xl text-gray-300"></i>
        </div>
        <p className="text-lg font-medium text-gray-400">Select a file to view results</p>
      </div>
    );
  }

  if (file.status === ProcessStatus.ERROR) {
    const friendlyError = getFriendlyErrorMessage(file.error);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 md:hidden flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back
          </button>
        )}

        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
          <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Failed</h3>
        <p className="text-gray-600 max-w-md mb-6">{friendlyError}</p>
        {onRetry && (
          <button
            onClick={() => onRetry(file.id)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-coffee-600 rounded-lg hover:bg-coffee-700 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-rotate-right"></i>
            Retry Processing
          </button>
        )}
      </div>
    );
  }

  if (file.status !== ProcessStatus.COMPLETED) {
    const isUploading = file.status === ProcessStatus.UPLOADING;
    const statusText = isUploading
      ? 'Uploading...'
      : file.status === ProcessStatus.TRANSCRIBING
        ? 'Transcribing...'
        : 'AI Polishing...';
    const statusDescription = isUploading
      ? `Uploading "${file.file.name}" to server`
      : file.status === ProcessStatus.TRANSCRIBING
        ? 'Processing audio with ASR engine'
        : 'Removing filler words and generating summary';

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 md:hidden flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Back
          </button>
        )}

        {/* Progress Circle or Spinner */}
        <div className="relative w-24 h-24 mb-8">
          {isUploading ? (
            <>
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="#c08e72"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - (file.uploadProgress || 0) / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-coffee-600 font-bold text-lg">
                {file.uploadProgress || 0}%
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-coffee-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-coffee-600">
                <i className="fa-solid fa-wand-magic-sparkles text-2xl animate-pulse"></i>
              </div>
            </>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2">{statusText}</h3>
        <p className="text-gray-500 text-center max-w-md mb-6">{statusDescription}</p>

        {onCancel && (
          <button
            onClick={() => onCancel(file.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
            Cancel Processing
          </button>
        )}
      </div>
    );
  }

  const handleExport = () => {
    const data = {
      filename: file.file.name,
      date: new Date().toISOString(),
      raw_transcript: file.transcript,
      polished_transcript: file.refined?.polishedText,
      summary: file.refined?.summary,
      keywords: file.refined?.keywords
    };
    downloadJSON(`sonote_${file.file.name.split('.')[0]}.json`, data);
    showToast('JSON exported successfully', 'success');
  };

  const handleDownloadText = (type: 'raw' | 'clean') => {
    const text = type === 'clean' ? file.refined?.polishedText : file.transcript;
    if (text) {
      downloadText(`${file.file.name}_${type}.txt`, text);
      showToast('Text file downloaded', 'success');
    }
  };

  const handleCopy = (content: string | undefined, label: string) => {
    if (content) {
      navigator.clipboard.writeText(content);
      showToast(`${label} copied to clipboard`, 'success');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
        <div className="flex items-start gap-3">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{file.file.name}</h2>
            <div className="flex gap-2">
              {file.refined?.keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-coffee-50 text-coffee-700 text-xs rounded-md border border-coffee-100">
                #{kw}
              </span>
            ))}
          </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
            <i className="fa-solid fa-download"></i> Export JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        {[
          { id: 'clean', label: 'Polished', icon: 'fa-solid fa-sparkles' },
          { id: 'summary', label: 'Summary', icon: 'fa-solid fa-list-check' },
          { id: 'raw', label: 'Raw Transcript', icon: 'fa-solid fa-align-left' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'clean' | 'raw' | 'summary')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-coffee-600 text-coffee-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className={`${tab.icon} ${activeTab === tab.id ? 'text-coffee-500' : 'text-gray-400'}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-full relative group">

          {/* Copy/Download Action for Text Area */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            {(activeTab === 'clean' || activeTab === 'raw') && (
              <button
                onClick={() => handleDownloadText(activeTab === 'clean' ? 'clean' : 'raw')}
                className="p-2 text-gray-400 hover:text-coffee-600 bg-gray-50 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-all"
                title="Download .txt"
              >
                <i className="fa-solid fa-file-arrow-down"></i>
              </button>
            )}
            <button
              onClick={() => {
                const content = activeTab === 'clean' ? file.refined?.polishedText
                  : activeTab === 'raw' ? file.transcript
                    : file.refined?.summary;
                const label = activeTab === 'clean' ? 'Polished text'
                  : activeTab === 'raw' ? 'Raw transcript'
                    : 'Summary';
                handleCopy(content, label);
              }}
              className="p-2 text-gray-400 hover:text-coffee-600 bg-gray-50 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-all"
              title="Copy to Clipboard"
            >
              <i className="fa-regular fa-copy"></i>
            </button>
          </div>

          {activeTab === 'clean' && (
            <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
              {file.refined?.polishedText || "No content generated."}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="prose prose-slate max-w-none text-gray-600 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {file.transcript || "No transcript available."}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Executive Summary</h4>
                <p className="text-lg text-gray-800 leading-relaxed">
                  {file.refined?.summary}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">File Name:</span>
                    <span className="ml-2 text-gray-800">{file.file.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">File Size:</span>
                    <span className="ml-2 text-gray-800">{(file.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Processing Status:</span>
                    <span className="ml-2 text-green-600 font-medium">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
