import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_SERVER_URL: z.url(),
		// R2 public bucket origin — branding/logo-* keys resolve relative to
		// this. Optional; falls back to the production host so dev without
		// the env still works against the real bucket.
		NEXT_PUBLIC_PUBLIC_BUCKET_URL: z.url().default("https://pub.howlcast.tv"),
	},
	runtimeEnv: {
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
		NEXT_PUBLIC_PUBLIC_BUCKET_URL: process.env.NEXT_PUBLIC_PUBLIC_BUCKET_URL,
	},
	emptyStringAsUndefined: true,
});
