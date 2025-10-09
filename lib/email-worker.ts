import * as dotenv from "dotenv";
import log from "log-to-file";
import { Resend } from "resend";
import prisma from "../prisma/client";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY!);

// Get today in YYYY.MM.DD.log
export function logDate() {
	let logDate: any = new Date();
	return `${logDate.getFullYear()}.${String(logDate.getMonth() + 1).padStart(2, "0")}.${String(logDate.getDate()).padStart(2, "0")}.log`;
}

// Simple logger function to log to console and file
export function logger(message: string) {
	console.log(message);
	log(message, `${process.env.LOGS_PATH}/${logDate()}`);
}

async function sendEmail(limit = 10) {
	const emails = await prisma.emailOutbox.findMany({
		where: { status: { in: ["queued", "failed"] }, attempts: { lt: 5 }, nextTryAt: { lte: new Date() } },
		orderBy: { createdAt: "asc" },
		take: limit,
	});
	if (emails.length === 0) return;

	logger(`Found ${emails.length} email(s) to process.`);

	for (const e of emails) {
		// Lock the email for processing to prevent race conditions (duplicate sends)
		const locked = await prisma.emailOutbox.updateMany({
			where: { id: e.id, status: e.status },
			data: { status: "processing" },
		});
		// If the email was already processed by another worker, skip it
		if (locked.count === 0) continue;
		logger(`Processing email ID ${e.id} to ${e.recipient}...`);

		// Send the email using the Resend API
		try {
			const sent = await resend.emails.send({
				from: process.env.EMAILS_FROM!,
				to: e.recipient,
				cc: e.cc ? e.cc : undefined,
				subject: e.subject,
				html: e.bodyHtml,
				text: e.bodyPlain,
			});

			if (sent.error) throw new Error(sent.error.message);

			// If the email was sent successfully, mark it as sent
			await prisma.emailOutbox.update({ where: { id: e.id }, data: { status: "sent", sentAt: new Date(), lastError: null } });
			logger(`Email ID ${e.id} sent successfully to ${e.recipient}.`);
		} catch (error: any) {
			// If the email failed to send, increment the attempts counter and set the next try time with exponential backoff
			// Max backoff is 15 minutes
			// If max attempts reached, mark the email as failed
			const attempts = e.attempts + 1;
			const isMaxAttemptsReached = attempts >= e.maxAttempts;
			const backoffSec = Math.min(20 * 60, 4 ** attempts);

			await prisma.emailOutbox.update({
				where: { id: e.id },
				data: {
					attempts,
					lastError: String(error?.message || "error"),
					status: isMaxAttemptsReached ? "failed" : "queued",
					nextTryAt: new Date(Date.now() + backoffSec * 1000),
				},
			});
			logger(`Failed to send email ID ${e.id} to ${e.recipient}: ${error?.message || error}.`);
		}
	}
}

// Run the email worker every 5 seconds
async function main() {
	while (true) {
		await sendEmail();
		await new Promise((r) => setTimeout(r, 5000));
	}
}
main();
