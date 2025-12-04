import { useState, useEffect, useCallback } from 'react';

interface HistoryRecord {
  id: string;
  fileName: string;
  fileSize: number;
  transcript: string;
  refined: {
    polishedText: string;
    summary: string;
    keywords: string[];
  };
  completedAt: string;
}

const STORAGE_KEY = 'sonote_history';
const MAX_HISTORY_ITEMS = 50;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('Failed to load history from localStorage:', e);
      setHistory([]);
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveHistory = useCallback((records: HistoryRecord[]) => {
    try {
      // Keep only the most recent items
      const trimmed = records.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setHistory(trimmed);
    } catch (e) {
      console.error('Failed to save history to localStorage:', e);
    }
  }, []);

  const addToHistory = useCallback((record: Omit<HistoryRecord, 'id' | 'completedAt'>) => {
    const newRecord: HistoryRecord = {
      ...record,
      id: Math.random().toString(36).substring(7),
      completedAt: new Date().toISOString(),
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev];
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(h => h.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};

export type { HistoryRecord };
