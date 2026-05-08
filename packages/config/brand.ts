// HowlCast brand tokens for contexts where CSS variables don't resolve:
//   - OG image generation (next/og runs in the Edge runtime, no CSS)
//   - global-error.tsx (renders outside Providers, no var()-resolving DOM)
//   - email HTML (no CSS support across mail clients)
//   - Discord embed colors (int form, not CSS)
//
// Anywhere a CSS variable IS available, prefer the var (e.g. `var(--cyan)`)
// over importing from here. This file is the "no-CSS escape hatch".

export const BRAND = {
	// Primary hues — match design-handoff/project/shared.css.
	navy: "#091533",
	cyan: "#0FACED",

	// Email-template palette. Slightly off the navy/cyan because mail clients
	// punish high-contrast pure colors and the existing template went lighter.
	emailBg: "#0a1224",
	emailCard: "#121d36",
	emailFg: "#f3f4fb",
	emailFgDim: "#b8bdcc",
	emailFgFaint: "#7d839a",
	emailRule: "rgba(255,255,255,.08)",
	emailCardBorder: "rgba(255,255,255,.12)",
	emailFooterFg: "#5b6079",

	// OG-image palette (next/og runs in Edge — must inline hex).
	ogGradStart: "#091533",
	ogGradMid: "#0a1a40",
	ogGradEnd: "#0f2a55",
	ogFg: "#e6ecff",
	ogFgDim: "#aab4d3",
	ogFgFaint: "#7d89b0",

	// Discord embed colors — int form, the embed schema requires a number.
	discordLive: 0x0faced,
	discordEnd: 0x55667a,
} as const;

export type BrandToken = keyof typeof BRAND;
