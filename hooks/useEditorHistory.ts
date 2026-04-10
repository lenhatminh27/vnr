"use client";

import { useCallback, useMemo, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useEditorHistory<T>(initialPresent: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const set = useCallback((next: T | ((current: T) => T), skipHistory = false) => {
    setHistory((currentHistory) => {
      const resolved =
        typeof next === "function"
          ? (next as (current: T) => T)(currentHistory.present)
          : next;

      if (Object.is(resolved, currentHistory.present)) {
        return currentHistory;
      }

      if (skipHistory) {
        return {
          ...currentHistory,
          present: resolved,
        };
      }

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: resolved,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      const previous = currentHistory.past.at(-1);
      if (!previous) {
        return currentHistory;
      }

      return {
        past: currentHistory.past.slice(0, -1),
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      const next = currentHistory.future[0];
      if (!next) {
        return currentHistory;
      }

      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: currentHistory.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((nextInitial: T) => {
    setHistory({
      past: [],
      present: nextInitial,
      future: [],
    });
  }, []);

  return useMemo(
    () => ({
      state: history.present,
      set,
      undo,
      redo,
      reset,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }),
    [history, redo, reset, set, undo],
  );
}
