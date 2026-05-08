"use client";

// Site-wide branding state. Reads from `branding.get` (public) so anonymous
// viewers see the customized logo + platform name. Cached for 5 minutes
// since branding rarely changes per session.

import { env } from "@howlcast/env/web";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

const STALE_MS = 5 * 60 * 1000;
const PUBLIC_BUCKET_BASE = env.NEXT_PUBLIC_PUBLIC_BUCKET_URL;

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
			? `${PUBLIC_BUCKET_BASE}/${q.data.customLogoKey}`
			: DEFAULTS.logoUrl,
		platformName: q.data.platformName ?? DEFAULTS.platformName,
		footerAttribution: q.data.footerAttribution as WhiteLabel["footerAttribution"],
		customFooterText: q.data.customFooterText ?? null,
		hasCustomLogo: !!q.data.customLogoKey,
	};
}
