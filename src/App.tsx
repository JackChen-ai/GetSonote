import React, { useState, useEffect, useRef } from 'react';
import { DropZone, QueueList, ResultPanel } from './components';
import { BatchFile, ProcessStatus } from './types';
import { transcribeAudio, polishAndSummarize } from './services/apiService';
import { useHistory } from './hooks/useLocalStorage';

const CONCURRENT_LIMIT = 2;

const App: React.FC = () => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [processingCount, setProcessingCount] = useState(0);
  const { addToHistory } = useHistory();
  const savedFilesRef = useRef<Set<string>>(new Set());

  const completedCount = files.filter(f => f.status === ProcessStatus.COMPLETED).length;
  const totalCount = files.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleFilesAdded = (newFiles: File[]) => {
    const batchFiles: BatchFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: ProcessStatus.QUEUED,
    }));
    setFiles(prev => [...prev, ...batchFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) setSelectedFileId(null);
  };

  const handleRetryFile = (id: string) => {
    setFiles(prev => prev.map(f =>
      f.id === id
        ? { ...f, status: ProcessStatus.QUEUED, error: undefined, transcript: undefined, refined: undefined }
        : f
    ));
  };

  const handleCancelFile = (id: string) => {
    setFiles(prev => prev.map(f =>
      f.id === id
        ? { ...f, status: ProcessStatus.ERROR, error: 'Processing cancelled by user' }
        : f
    ));
  };

  const handleBack = () => {
    setSelectedFileId(null);
  };

  useEffect(() => {
    const processQueue = async () => {
      const queuedFiles = files.filter(f => f.status === ProcessStatus.QUEUED);

      if (processingCount < CONCURRENT_LIMIT && queuedFiles.length > 0) {
        const slotsAvailable = CONCURRENT_LIMIT - processingCount;
        const filesToProcess = queuedFiles.slice(0, slotsAvailable);

        filesToProcess.forEach(file => {
          processFile(file);
        });
      }
    };

    const processFile = async (file: BatchFile) => {
      setProcessingCount(prev => prev + 1);

      // Start with uploading status
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.UPLOADING, uploadProgress: 0 } : f));

      try {
        const transcript = await transcribeAudio(file.file, (progress) => {
          setFiles(prev => prev.map(f => f.id === file.id ? { ...f, uploadProgress: progress } : f));
        });

        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.TRANSCRIBING, uploadProgress: 100 } : f));

        // Small delay to show transcribing state
        await new Promise(resolve => setTimeout(resolve, 500));

        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: ProcessStatus.POLISHING, transcript } : f));

        const refined = await polishAndSummarize(transcript);

        setFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: ProcessStatus.COMPLETED,
          refined
        } : f));

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to process";
        console.error("Processing failed for", file.file.name, err);
        setFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: ProcessStatus.ERROR,
          error: errorMessage
        } : f));
      } finally {
        setProcessingCount(prev => prev - 1);
      }
    };

    processQueue();
  }, [files, processingCount]);

  // Save completed files to history
  useEffect(() => {
    files.forEach(file => {
      if (file.status === ProcessStatus.COMPLETED && file.refined && !savedFilesRef.current.has(file.id)) {
        savedFilesRef.current.add(file.id);
        addToHistory({
          fileName: file.file.name,
          fileSize: file.file.size,
          transcript: file.transcript || '',
          refined: {
            polishedText: file.refined.polishedText,
            summary: file.refined.summary,
            keywords: file.refined.keywords,
          },
        });
      }
    });
  }, [files, addToHistory]);

  const isGlobalProcessing = processingCount > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-coffee-600 to-coffee-400 rounded-lg flex items-center justify-center text-white shadow-coffee-200 shadow-lg">
            <i className="fa-solid fa-microphone-lines"></i>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
            Sonote <span className="text-xs font-normal text-gray-400 border border-gray-200 rounded px-1 ml-1">MVP</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {isGlobalProcessing && (
            <div className="flex items-center gap-3 bg-coffee-50 px-4 py-1.5 rounded-full border border-coffee-100">
              <div className="relative w-4 h-4">
                <i className="fa-solid fa-server text-coffee-600 animate-pulse"></i>
              </div>
              <span className="text-xs font-semibold text-coffee-700">Backend Processing...</span>
            </div>
          )}
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-slate-800 transition-colors">
            <i className="fa-brands fa-github text-xl"></i>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Queue */}
        <QueueList
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          onRemoveFile={handleRemoveFile}
        />

        {/* Right: Work Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
          {files.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
                    High-Fidelity Audio <span className="text-coffee-600">Transcription</span>
                  </h2>
                  <p className="text-lg text-gray-500 max-w-lg mx-auto">
                    Powered by Aliyun ASR & Qwen-Max. Drag files to start the batch processing pipeline.
                  </p>
                </div>

                <DropZone onFilesAdded={handleFilesAdded} isProcessing={false} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-center">
                  {[
                    { icon: 'fa-solid fa-server', title: 'Private Backend', desc: 'Secure API Processing' },
                    { icon: 'fa-solid fa-language', title: 'Aliyun ASR', desc: 'SOTA Chinese Recognition' },
                    { icon: 'fa-solid fa-robot', title: 'Qwen Polishing', desc: 'DeepSeek/Qwen Integration' },
                  ].map((feature, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-slate-600 mb-3">
                        <i className={`${feature.icon}`}></i>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                      <p className="text-xs text-gray-500">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            selectedFileId ? (
              <ResultPanel
                file={files.find(f => f.id === selectedFileId)}
                onRetry={handleRetryFile}
                onCancel={handleCancelFile}
                onBack={handleBack}
              />
            ) : (
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8 flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Processing Queue</h2>
                      <p className="text-gray-500">Connected to ASR/LLM Backend Pipeline.</p>
                    </div>
                    <DropZone onFilesAdded={handleFilesAdded} isProcessing={isGlobalProcessing} />
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Total Progress</span>
                      <span className="text-sm font-bold text-coffee-600">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-coffee-500 to-coffee-400 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{files.length}</div>
                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{completedCount}</div>
                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{files.length - completedCount}</div>
                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Pending</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map(file => (
                      <div
                        key={file.id}
                        onClick={() => setSelectedFileId(file.id)}
                        className="bg-white p-4 rounded-lg border border-gray-200 hover:border-coffee-400 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between h-32"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                            <i className="fa-solid fa-file-audio"></i>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            file.status === ProcessStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                              file.status === ProcessStatus.ERROR ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                          }`}>
                            {file.status === ProcessStatus.COMPLETED ? 'Ready' : file.status.toLowerCase()}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 truncate mb-1" title={file.file.name}>{file.file.name}</h4>
                          <p className="text-xs text-gray-400">{(file.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
