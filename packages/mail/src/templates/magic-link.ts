export interface MagicLinkTemplateInput {
	magicUrl: string;
	expiresInMinutes?: number;
}

export function magicLinkEmail({
	magicUrl,
	expiresInMinutes = 15,
}: MagicLinkTemplateInput): {
	subject: string;
	html: string;
	text: string;
} {
	const subject = "Your HowlCast sign-in link";

	const html = `<!doctype html>
<html>
	<body style="margin:0;padding:0;background:#0a1224;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#f3f4fb;">
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a1224;padding:48px 16px;">
			<tr>
				<td align="center">
					<table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background:#121d36;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:32px;">
						<tr>
							<td align="center" style="padding-bottom:16px;">
								<div style="font-size:18px;font-weight:600;letter-spacing:-0.01em;">HowlCast</div>
							</td>
						</tr>
						<tr>
							<td style="font-size:18px;font-weight:600;padding-bottom:8px;">Sign in to HowlCast</td>
						</tr>
						<tr>
							<td style="font-size:14px;line-height:1.55;color:#b8bdcc;padding-bottom:24px;">
								Click the button below to sign in. This link expires in ${expiresInMinutes} minutes and can only be used once.
							</td>
						</tr>
						<tr>
							<td align="center" style="padding-bottom:24px;">
								<a href="${magicUrl}"
									style="display:inline-block;background:#0FACED;color:#0a1224;font-weight:600;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:8px;">
									Sign in
								</a>
							</td>
						</tr>
						<tr>
							<td style="font-size:12px;line-height:1.55;color:#7d839a;padding-bottom:8px;">
								Or paste this URL into your browser:
							</td>
						</tr>
						<tr>
							<td style="font-size:12px;color:#0FACED;word-break:break-all;padding-bottom:24px;">
								<a href="${magicUrl}" style="color:#0FACED;">${magicUrl}</a>
							</td>
						</tr>
						<tr>
							<td style="font-size:11px;color:#7d839a;border-top:1px solid rgba(255,255,255,.08);padding-top:16px;">
								Didn't request this? You can ignore this email — nothing will happen until the link is clicked.
							</td>
						</tr>
					</table>
					<div style="font-size:11px;color:#5b6079;padding-top:16px;">
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
