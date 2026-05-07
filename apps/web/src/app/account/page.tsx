import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AccountProfileForm from "@/components/account/profile-form";
import DangerZone from "@/components/account/danger-zone";
import SessionsList from "@/components/account/sessions-list";
import { authClient } from "@/lib/auth-client";

export const metadata = { title: "Account · HowlCast" };

export default async function AccountPage() {
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers() },
	});
	if (!session?.data?.user) {
		redirect("/login");
	}

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-10 lg:px-8">
			<header className="border-border border-b pb-5">
				<span className="font-mono text-[10px] text-cyan uppercase tracking-[0.2em]">Account</span>
				<h1 className="mt-2 font-display font-semibold text-3xl text-foreground tracking-tight">
					Your profile
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Edit how you appear in chat and manage your sessions.
				</p>
			</header>

			<AccountProfileForm />

			<SessionsList />

			<section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
				<header className="border-border border-b pb-3">
					<h2 className="font-display font-semibold text-foreground">Sign-in security</h2>
					<p className="mt-1 text-muted-foreground text-xs">
						Password, 2FA, passkeys, and active sessions live on the security page.
					</p>
				</header>
				<Link
					href="/account/security"
					className="inline-flex h-9 w-fit items-center rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:opacity-90"
				>
					Manage security
				</Link>
			</section>

			<DangerZone />
		</main>
	);
}
