import Link from "next/link";

import HeaderStrip from "@/components/dashboard/header-strip";
import ProfileForm from "@/components/dashboard/account/profile-form";

export const metadata = { title: "Account · HowlCast" };

export default function AccountPage() {
	return (
		<>
			<HeaderStrip
				title="Account"
				subtitle="Your broadcaster profile and security settings."
				eyebrow="SETTINGS"
			/>
			<ProfileForm />
			<section className="rounded-lg border border-border bg-card p-5 text-muted-foreground text-sm">
				<p className="font-medium text-foreground">Security</p>
				<p className="mt-2">
					Password, 2FA, passkeys, and active sessions live on the dedicated security page.
				</p>
				<Link
					href="/account/security"
					className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:opacity-90"
				>
					Manage security
				</Link>
			</section>
		</>
	);
}
