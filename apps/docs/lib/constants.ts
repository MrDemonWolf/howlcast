export const APP_URL =
	process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://tv.mrdemonwolf.com";

export const REPO_URL = "https://github.com/MrDemonWolf/howlcast";

// Mirrors next.config.mjs basePath. Use for static asset paths in components
// that don't auto-prefix (raw <img>, inline SVG).
export const BASE_PATH = process.env.NODE_ENV === "production" ? "/howlcast" : "";

export function asset(path: string): string {
	return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
