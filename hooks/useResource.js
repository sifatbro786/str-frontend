"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";

/**
 * List-page state machine: query params → fetch → { rows, meta, status }.
 *
 * Two things worth knowing:
 *  · Every fetch carries an AbortController. Typing in the search box fires a
 *    request per debounce tick, and without this a slow early response can
 *    overwrite a fast later one — the classic out-of-order render.
 *  · `params` is stringified into the dependency list. Passing an object
 *    literal from the caller would otherwise re-fetch on every render.
 */
export function useResource(resource, params = {}, { immediate = true } = {}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState(immediate ? "loading" : "idle");
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    try {
      const payload = await api.list(resource, JSON.parse(key));
      if (controller.signal.aborted) return;
      setRows(payload.data ?? []);
      setMeta(payload.meta ?? null);
      setStatus("ready");
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      setStatus("error");
    }
  }, [resource, key]);

  useEffect(() => {
    if (!immediate) return;
    load();
    return () => abortRef.current?.abort();
  }, [load, immediate]);

  return { rows, meta, status, error, reload: load, setRows };
}

/**
 * Debounces a value. 300ms is the point where search feels instant but the
 * network is not doing one request per keystroke.
 */
export function useDebounced(value, delay = 300) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return out;
}
