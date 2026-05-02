import { env } from "@howlcast/env/web";
import {
	magicLinkClient,
	twoFactorClient,
	usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL:
		typeof window !== "undefined"
			? window.location.origin
			: env.NEXT_PUBLIC_SERVER_URL,
	plugins: [usernameClient(), twoFactorClient(), magicLinkClient()],
});
