import { BRAND } from "@howlcast/config/brand";

import { escapeHtml, escapeHtmlAttr } from "../lib/escape";

export interface MagicLinkTemplateInput {
	magicUrl: string;
	expiresInMinutes?: number;
}

export function magicLinkEmail({ magicUrl, expiresInMinutes = 15 }: MagicLinkTemplateInput): {
	subject: string;
	html: string;
	text: string;
} {
	const subject = "Your HowlCast sign-in link";
	// magicUrl comes from better-auth and is server-controlled today, but
	// any future templating change to the URL builder shouldn't be able to
	// inject HTML. Escape href context with attribute encoding and the
	// visible text node with body encoding.
	const hrefSafe = escapeHtmlAttr(magicUrl);
	const textSafe = escapeHtml(magicUrl);

	const html = `<!doctype html>
<html>
	<body style="margin:0;padding:0;background:${BRAND.emailBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.emailFg};">
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.emailBg};padding:48px 16px;">
			<tr>
				<td align="center">
					<table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background:${BRAND.emailCard};border:1px solid ${BRAND.emailCardBorder};border-radius:14px;padding:32px;">
						<tr>
							<td align="center" style="padding-bottom:16px;">
								<div style="font-size:18px;font-weight:600;letter-spacing:-0.01em;">HowlCast</div>
							</td>
						</tr>
						<tr>
							<td style="font-size:18px;font-weight:600;padding-bottom:8px;">Sign in to HowlCast</td>
						</tr>
						<tr>
							<td style="font-size:14px;line-height:1.55;color:${BRAND.emailFgDim};padding-bottom:24px;">
								Click the button below to sign in. This link expires in ${expiresInMinutes} minutes and can only be used once.
							</td>
						</tr>
						<tr>
							<td align="center" style="padding-bottom:24px;">
								<a href="${hrefSafe}"
									style="display:inline-block;background:${BRAND.cyan};color:${BRAND.emailBg};font-weight:600;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:8px;">
									Sign in
								</a>
							</td>
						</tr>
						<tr>
							<td style="font-size:12px;line-height:1.55;color:${BRAND.emailFgFaint};padding-bottom:8px;">
								Or paste this URL into your browser:
							</td>
						</tr>
						<tr>
							<td style="font-size:12px;color:${BRAND.cyan};word-break:break-all;padding-bottom:24px;">
								<a href="${hrefSafe}" style="color:${BRAND.cyan};">${textSafe}</a>
							</td>
						</tr>
						<tr>
							<td style="font-size:11px;color:${BRAND.emailFgFaint};border-top:1px solid ${BRAND.emailRule};padding-top:16px;">
								Didn't request this? You can ignore this email — nothing will happen until the link is clicked.
							</td>
						</tr>
					</table>
					<div style="font-size:11px;color:${BRAND.emailFooterFg};padding-top:16px;">
						Powered by HowlCast by MrDemonWolf, Inc.
					</div>
				</td>
			</tr>
		</table>
	</body>
</html>`;

	const text = [
		"Sign in to HowlCast",
		"",
		`Click to sign in (expires in ${expiresInMinutes} minutes):`,
		magicUrl,
		"",
		"Didn't request this? You can ignore this email.",
	].join("\n");

	return { subject, html, text };
}
