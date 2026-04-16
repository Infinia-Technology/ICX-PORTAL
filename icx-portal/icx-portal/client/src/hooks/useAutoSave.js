import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../lib/api';

export function useAutoSave(url, data, { delay = 2500, enabled = true } = {}) {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const timeoutRef = useRef(null);
  const prevDataRef = useRef(null);

  const save = useCallback(async () => {
    if (!url || !enabled || !data) return;
    setStatus('saving');
    try {
      // Strip empty strings to avoid Mongoose enum validation errors
      // Keep false, 0, arrays, and other falsy-but-valid values
      const cleaned = {};
      for (const [key, val] of Object.entries(data)) {
        if (val === '' || val === undefined) continue;
        cleaned[key] = val;
      }
      await api.put(url, cleaned);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [url, data, enabled]);

  useEffect(() => {
    if (!enabled || !url) return;

    const serialized = JSON.stringify(data);
    if (serialized === prevDataRef.current) return;
    prevDataRef.current = serialized;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delay, enabled, url, save]);

  return { status, retry: save };
}
