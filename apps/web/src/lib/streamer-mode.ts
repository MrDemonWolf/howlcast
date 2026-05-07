"use client";

// Streamer Mode toggle. Persisted to localStorage so it survives reload.
// Pure event-bus pattern (no Zustand dep). Components subscribe via
// useStreamerMode(); the toggle component flips it via setStreamerMode().
//
// Purpose: while broadcaster is screen-sharing OBS or doing a tutorial,
// flipping this on hides the stream key, Discord webhook URLs, and the
// RTMPS push URL anywhere they're rendered.

import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "howlcast:streamer-mode";

const listeners = new Set<() => void>();

function readInitial(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(KEY) === "1";
	} catch {
		return false;
	}
}

let value = false;
let hydrated = false;

function ensureHydrated() {
	if (hydrated || typeof window === "undefined") return;
	value = readInitial();
	hydrated = true;
}

export function setStreamerMode(next: boolean) {
	ensureHydrated();
	value = next;
	try {
		window.localStorage.setItem(KEY, next ? "1" : "0");
	} catch {
		// storage disabled — best-effort, in-memory only
	}
	listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
	listeners.add(cb);
	return () => listeners.delete(cb);
}

function getSnapshot(): boolean {
	ensureHydrated();
	return value;
}

function getServerSnapshot(): boolean {
	return false;
}

// useSyncExternalStore avoids the SSR/CSR hydration mismatch — server always
// reports false; client reads localStorage on first render after hydration.
export function useStreamerMode(): boolean {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const v = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	return mounted ? v : false;
}

// Mask a string everywhere except a fixed prefix + a small ellipsis. Used
// for Discord webhook URLs etc. so the broadcaster can still tell which
// row is which without leaking the secret.
export function maskWithPrefix(value: string, prefixLen = 32): string {
	if (!value) return value;
	if (value.length <= prefixLen) return "•".repeat(8);
	return `${value.slice(0, prefixLen)}•••`;
}
