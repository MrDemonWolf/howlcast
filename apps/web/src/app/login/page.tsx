// Login route shell. Two tabs per design v2: Sign in / Use invite code.
// LoginForm preserves all existing auth methods (email+password, magic-link,
// passkey, username toggle). Invite tab is a tiny code-paste form that
// redirects to /invite/CODE.

import { BrandMark } from "@howlcast/ui/components/brand-mark";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@howlcast/ui/components/tabs";
import Link from "next/link";

import { InviteCodeForm } from "@/components/auth/invite-code-form";
import LoginForm from "@/components/auth/login-form";
import { PageContainer } from "@/components/layout";

export const metadata = {
	title: "Sign in · HowlCast",
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: Promise<{ tab?: string }>;
}) {
	const sp = (await searchParams) ?? {};
	const initial = sp.tab === "invite" ? "invite" : "signin";
	return (
		<PageContainer variant="narrow" className="flex min-h-svh flex-col justify-center gap-5 py-12">
			<div className="flex justify-center">
				<BrandMark size={28} />
			</div>
			<div
				className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-2)]"
				style={{ borderColor: "var(--line)" }}
			>
				<Tabs defaultValue={initial}>
					<TabsList className="w-full rounded-none border-0 border-b bg-transparent p-0">
						<TabsTrigger value="signin" className="flex-1 rounded-none">
							Sign in
						</TabsTrigger>
						<TabsTrigger value="invite" className="flex-1 rounded-none">
							Use invite code
						</TabsTrigger>
					</TabsList>
					<TabsContent value="signin" className="mt-0 p-5">
						<LoginForm />
					</TabsContent>
					<TabsContent value="invite" className="mt-0 p-5">
						<InviteCodeForm />
					</TabsContent>
				</Tabs>
			</div>
			<div className="text-center text-xs leading-relaxed" style={{ color: "var(--fg-3)" }}>
				By continuing you agree to the{" "}
				<Link href="/terms" style={{ color: "var(--fg-2)" }}>
					Terms
				</Link>{" "}
				and{" "}
				<Link href="/privacy" style={{ color: "var(--fg-2)" }}>
					Privacy Policy
				</Link>
				.
			</div>
		</PageContainer>
	);
}
