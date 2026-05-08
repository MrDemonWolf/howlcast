import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { APP_URL, REPO_URL } from "@/lib/constants.ts";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: "HowlCast",
		},
		links: [
			{
				text: "Live",
				url: APP_URL,
				external: true,
			},
			{
				text: "GitHub",
				url: REPO_URL,
				external: true,
			},
		],
	};
}
