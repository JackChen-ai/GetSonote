export enum ProcessStatus {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  UPLOADING = 'UPLOADING',
  TRANSCRIBING = 'TRANSCRIBING',
  POLISHING = 'POLISHING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface RefinedContent {
  polishedText: string;
  summary: string;
  keywords: string[];
}

export interface BatchFile {
  id: string;
  file: File;
  status: ProcessStatus;
  transcript?: string;
  refined?: RefinedContent;
  error?: string;
  uploadProgress?: number;
}

export interface ProcessingStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}
