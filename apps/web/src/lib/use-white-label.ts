"use client";

// Site-wide branding state. Reads from `branding.get` (public) so anonymous
// viewers see the customized logo + platform name. Cached for 5 minutes
// since branding rarely changes per session.
//
// Custom logos stream through the server worker at /api/branding/logo so
// we don't need a public R2 origin. The key is appended as a cache-buster
// so a re-upload invalidates the browser cache automatically.

import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

const STALE_MS = 5 * 60 * 1000;
const LOGO_PROXY_PATH = "/api/branding/logo";

export type WhiteLabel = {
	logoUrl: string;
	platformName: string;
	footerAttribution: "default" | "custom" | "off";
	customFooterText: string | null;
	hasCustomLogo: boolean;
};

const DEFAULTS: WhiteLabel = {
	logoUrl: "/logos/howlcast-mark.svg",
	platformName: "HowlCast",
	footerAttribution: "default",
	customFooterText: null,
	hasCustomLogo: false,
};

export function useWhiteLabel(): WhiteLabel {
	const q = useQuery({
		...trpc.branding.get.queryOptions(),
		staleTime: STALE_MS,
		retry: false,
	});
	if (!q.data) return DEFAULTS;
	return {
		logoUrl: q.data.customLogoKey
			? `${LOGO_PROXY_PATH}?v=${encodeURIComponent(q.data.customLogoKey)}`
			: DEFAULTS.logoUrl,
		platformName: q.data.platformName ?? DEFAULTS.platformName,
		footerAttribution: q.data.footerAttribution as WhiteLabel["footerAttribution"],
		customFooterText: q.data.customFooterText ?? null,
		hasCustomLogo: !!q.data.customLogoKey,
	};
}
