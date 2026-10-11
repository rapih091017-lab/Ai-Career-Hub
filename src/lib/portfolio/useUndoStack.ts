"use client";

import { useCallback, useState } from "react";

export function useUndoStack<T>(initial: T, limit = 50) {
  const [stack, setStack] = useState<{ past: T[]; present: T; future: T[] }>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      setStack((current) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(current.present) : next;
        if (Object.is(value, current.present)) return current;
        return {
          past: [...current.past.slice(-(limit - 1)), current.present],
          present: value,
          future: [],
        };
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    setStack((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setStack((current) => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      const newFuture = current.future.slice(1);
      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((value: T) => {
    setStack({
      past: [],
      present: value,
      future: [],
    });
  }, []);

  return {
    state: stack.present,
    set,
    undo,
    redo,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
    reset,
  };
}
