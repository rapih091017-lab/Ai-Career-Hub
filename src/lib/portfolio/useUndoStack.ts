"use client";

import { useCallback, useRef, useState } from "react";

export function useUndoStack<T>(initial: T, limit = 50) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (Object.is(value, prev)) return prev;
        past.current = [...past.current.slice(-(limit - 1)), prev];
        future.current = [];
        return value;
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    setState((prev) => {
      const last = past.current[past.current.length - 1];
      if (last === undefined) return prev;
      past.current = past.current.slice(0, -1);
      future.current = [prev, ...future.current];
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const [next, ...rest] = future.current;
      if (next === undefined) return prev;
      future.current = rest;
      past.current = [...past.current, prev];
      return next;
    });
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    setState(value);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    reset,
  };
}
