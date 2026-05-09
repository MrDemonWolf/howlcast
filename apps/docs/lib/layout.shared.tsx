import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { APP_URL, asset, REPO_URL } from "@/lib/constants.ts";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<>
					{/* biome-ignore lint/a11y/useAltText: alt provided */}
					<img src={asset("/logo.svg")} alt="HowlCast" width={20} height={20} />
					<span className="hc-display font-bold tracking-[-0.02em]">HowlCast</span>
				</>
			),
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
