import HeaderStrip from "@/components/dashboard/header-strip";
import BrandingForm from "@/components/dashboard/branding/branding-form";
import LegalEditor from "@/components/dashboard/branding/legal-editor";

export const metadata = { title: "Branding · HowlCast" };

export default function BrandingPage() {
	return (
		<>
			<HeaderStrip title="Branding" subtitle="Server · logo, name, footer, legal docs" />
			<BrandingForm />
			<LegalEditor />
		</>
	);
}
