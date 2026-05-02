/**
 * HowlCast mail dispatcher.
 *
 * Transport priority:
 *   1. RESEND_API_KEY set → Resend HTTPS API (works on Cloudflare Workers).
 *   2. SMTP_URL set + reachable → nodemailer (mailpit in dev).
 *   3. Else → console banner. Always works, zero setup.
 */

export interface MailMessage {
	to: string;
	subject: string;
	html: string;
	text?: string;
	from?: string;
}

export interface MailEnv {
	RESEND_API_KEY?: string;
	SMTP_URL?: string;
	MAIL_FROM?: string;
}

const DEFAULT_FROM = "HowlCast <invites@mail.howlcast.tv>";

export async function sendMail(env: MailEnv, msg: MailMessage): Promise<void> {
	const from = msg.from ?? env.MAIL_FROM ?? DEFAULT_FROM;
	const text = msg.text ?? stripHtml(msg.html);

	if (env.RESEND_API_KEY) {
		await sendViaResend(env.RESEND_API_KEY, { ...msg, from, text });
		return;
	}

	if (env.SMTP_URL) {
		try {
			await sendViaSmtp(env.SMTP_URL, { ...msg, from, text });
			return;
		} catch (err) {
			console.warn(
				`[mail] SMTP transport failed (${(err as Error).message}); falling back to console.`,
			);
		}
	}

	logToConsole({ ...msg, from, text });
}

async function sendViaResend(
	apiKey: string,
	msg: Required<Pick<MailMessage, "from" | "text">> & MailMessage,
): Promise<void> {
	const { Resend } = await import("resend");
	const resend = new Resend(apiKey);
	const { error } = await resend.emails.send({
		from: msg.from,
		to: msg.to,
		subject: msg.subject,
		html: msg.html,
		text: msg.text,
	});
	if (error) {
		throw new Error(`Resend error: ${error.message}`);
	}
}

async function sendViaSmtp(
	url: string,
	msg: Required<Pick<MailMessage, "from" | "text">> & MailMessage,
): Promise<void> {
	const nodemailer = await import("nodemailer");
	const transport = nodemailer.createTransport(url);
	await transport.sendMail({
		from: msg.from,
		to: msg.to,
		subject: msg.subject,
		html: msg.html,
		text: msg.text,
	});
}

function logToConsole(
	msg: Required<Pick<MailMessage, "from" | "text">> & MailMessage,
): void {
	const banner = "═".repeat(60);
	console.log(`\n${banner}`);
	console.log("📬  [mail:console] No transport configured — printing email.");
	console.log(`From:    ${msg.from}`);
	console.log(`To:      ${msg.to}`);
	console.log(`Subject: ${msg.subject}`);
	console.log("---");
	console.log(msg.text);
	console.log(`${banner}\n`);
}

function stripHtml(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}
