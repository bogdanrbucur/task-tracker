import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { render } from "@react-email/render";
import React from "react";
import CommentMentionEmail from "./templates/CommentMention";
import NewTaskEmail from "./templates/NewTaskAssigned";
import NewUserNotConfirmedEmail from "./templates/NewUserNotConfirmed";
import NewUserRegistered from "./templates/NewUserRegistered";
import PasswordResetEmail from "./templates/PasswordResetRequest";
import TaskCancelledEmail from "./templates/TaskCancelled";
import TaskCompletedEmail from "./templates/TaskCompleted";
import TaskDueSoonEmail from "./templates/TaskDueSoon";
import TaskOverdueEmail from "./templates/TaskOverdue";
import TaskReopenedEmail from "./templates/TaskReopened";
import { createEmailIdempotencyKey } from "@/lib/utilityFunctions";

type Props = {
	userFirstName?: string;
	userLastName?: string;
	recipients: string[] | string;
	cc?: string[] | string;
	emailType: EmailType;
	comment?: string;
	task?: EmailTask;
	recipientFirstName?: string;
};

export interface EmailTask extends Task {
	assignedToUser: {
		email: string;
		firstName: string;
		manager: {
			email: string;
			firstName: string;
			lastName: string;
		} | null;
	} | null;
}

export interface EmailResponse {
	queued: boolean;
	id: string;
}

const baseUrl = process.env.BASE_URL!;

export type EmailType =
	| "taskAssigned"
	| "taskDueSoon"
	| "taskOverdue"
	| "taskCompleted"
	| "taskReopened"
	| "commentMention"
	| "taskCancelled"
	| "passwordResetRequest"
	| "newUserRegistration"
	| "newUserNotConfirmed";

// Resend email
export async function sendEmail({ userFirstName, userLastName, recipients, cc, emailType, comment, task, recipientFirstName }: Props): Promise<EmailResponse> {
	// Choose the email template based on the emailType

	logger(`Sending ${emailType} email to ${recipients}...`);

	let emailTemplate: any = null;
	let subject = "";
	switch (emailType) {
		case "taskAssigned":
			emailTemplate = React.createElement(NewTaskEmail, { baseUrl, task: task! });
			subject = `New task assigned - ${task?.title}`;
			break;
		case "taskDueSoon":
			emailTemplate = React.createElement(TaskDueSoonEmail, { baseUrl, task: task! });
			subject = `Task due soon - ${task?.title}`;
			break;
		case "taskOverdue":
			emailTemplate = React.createElement(TaskOverdueEmail, { baseUrl, task: task! });
			subject = `Task overdue - ${task?.title}`;
			break;
		case "taskCompleted":
			emailTemplate = React.createElement(TaskCompletedEmail, {
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = `Task ready for review - ${task?.title}`;
			break;
		case "taskReopened":
			emailTemplate = React.createElement(TaskReopenedEmail, {
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = `Task reopened - ${task?.title}`;
			break;
		case "commentMention":
			emailTemplate = React.createElement(CommentMentionEmail, {
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
				recipientFirstName: recipientFirstName!,
			});
			subject = `Comment mention in task - ${task?.title}`;
			break;
		case "taskCancelled":
			emailTemplate = React.createElement(TaskCancelledEmail, {
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = `Task cancelled - ${task?.title}`;
			break;
		case "passwordResetRequest":
			emailTemplate = React.createElement(PasswordResetEmail, { baseUrl, firstName: userFirstName!, token: comment! });
			subject = "Password reset request";
			break;
		case "newUserRegistration":
			emailTemplate = React.createElement(NewUserRegistered, { baseUrl, firstName: userFirstName!, token: comment! });
			subject = "New account created";
			break;
		case "newUserNotConfirmed":
			emailTemplate = React.createElement(NewUserNotConfirmedEmail, { baseUrl, firstName: userFirstName!, lastName: userLastName!, userId: comment! });
			subject = `Newly registered user not confirmed - ${userFirstName} ${userLastName}`;
			break;
		default:
			emailTemplate = null;
	}

	// Convert HTML email to plaintext
	if (!emailTemplate) {
		logger(`No email template found for type: ${emailType}`);
		return { queued: false, id: null! };
	}

	let plainTextBody = await render(emailTemplate, { plainText: true });
	// Debug: also render HTML and log both outputs to help diagnose blank emails
	const htmlBody = await render(emailTemplate);
	// If plain text rendering produced nothing, create a simple fallback by stripping tags from HTML
	if (!plainTextBody || plainTextBody.trim().length === 0) {
		try {
			// naive tag stripper for fallback (keeps text content)
			const stripped = htmlBody
				.replace(/<style[\s\S]*?<\/style>/gi, "")
				.replace(/<script[\s\S]*?<\/script>/gi, "")
				.replace(/<[^>]+>/g, "");
			plainTextBody = stripped.replace(/\s+/g, " ").trim().slice(0, 2000);
			if (!plainTextBody) plainTextBody = `Open the app to view this email: ${baseUrl}`;
		} catch (e) {
			plainTextBody = `Open the app to view this email: ${baseUrl}`;
		}
	}

	let email;
	const idempotencyKey = createEmailIdempotencyKey(emailType, subject, recipients, plainTextBody);
	try {
		const existing = await prisma.emailOutbox.findUnique({ where: { idempotencyKey } });

		if (!existing) {
			email = await prisma.emailOutbox.create({
				data: {
					recipient: Array.isArray(recipients) ? recipients.join(", ") : recipients,
					cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : null,
					subject,
					bodyHtml: htmlBody,
					bodyPlain: plainTextBody,
					idempotencyKey,
				},
			});
			logger(`Email queued successfully to ${recipients}`);
			return { queued: true, id: email.id };
		} else {
			logger(`Duplicate email detected to ${recipients}. Email not queued again.`);
			return { queued: false, id: existing.id };
		}
	} catch (error: any) {
		logger(`Failed to queue email to ${recipients}: ${error.message}`);
		return { queued: false, id: email?.id ?? null! };
	}
}
