import Link from "next/link";

import SignUpForm from "@/components/auth/sign-up-form";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000";

type Info = { allowSignups?: boolean };

async function getAllowSignups(): Promise<boolean> {
	try {
		const res = await fetch(`${SERVER_URL}/api/trpc/channel.getInfo`, { cache: "no-store" });
		if (!res.ok) return false;
		const json = (await res.json()) as { result?: { data?: Info } };
		return !!json.result?.data?.allowSignups;
	} catch {
		return false;
	}
}

// Signup gate. Closed by default after first-run; broadcaster flips
// channelConfig.allowSignups from the dashboard (Phase 5.8) to open it.
export default async function SignupPage() {
	const open = await getAllowSignups();

	if (!open) {
		return (
			<main className="flex flex-1 items-center justify-center px-6 py-16">
				<div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
					<h1 className="font-display font-semibold text-foreground text-xl">Signups are closed</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						This den is invite-only. DM <span className="font-mono text-cyan">@mrdemonwolf</span>{" "}
						for an invite.
					</p>
					<Link
						href="/login"
						className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:opacity-90"
					>
						Sign in
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="flex flex-1 items-center justify-center px-6 py-16">
			<SignUpForm />
		</main>
	);
}
