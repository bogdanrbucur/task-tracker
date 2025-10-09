import { logger } from "@/lib/utilityFunctions";
import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import { render } from "@react-email/render";
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

	let emailTemplate;
	let subject = "";
	switch (emailType) {
		case "taskAssigned":
			emailTemplate = NewTaskEmail({ baseUrl, task: task! });
			subject = `New task assigned - ${task?.title}`;
			break;
		case "taskDueSoon":
			emailTemplate = TaskDueSoonEmail({ baseUrl, task: task! });
			subject = `Task due soon - ${task?.title}`;
			break;
		case "taskOverdue":
			emailTemplate = TaskOverdueEmail({ baseUrl, task: task! });
			subject = `Task overdue - ${task?.title}`;
			break;
		case "taskCompleted":
			emailTemplate = TaskCompletedEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = `Task ready for review - ${task?.title}`;
			break;
		case "taskReopened":
			emailTemplate = TaskReopenedEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = `Task reopened - ${task?.title}`;
			break;
		case "commentMention":
			emailTemplate = CommentMentionEmail({
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
			emailTemplate = TaskCancelledEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = `Task cancelled - ${task?.title}`;
			break;
		case "passwordResetRequest":
			emailTemplate = PasswordResetEmail({
				baseUrl,
				firstName: userFirstName!,
				token: comment!,
			});
			subject = "Password reset request";
			break;
		case "newUserRegistration":
			emailTemplate = NewUserRegistered({
				baseUrl,
				firstName: userFirstName!,
				token: comment!,
			});
			subject = "New account created";
			break;
		case "newUserNotConfirmed":
			emailTemplate = NewUserNotConfirmedEmail({
				baseUrl,
				firstName: userFirstName!,
				lastName: userLastName!,
				userId: comment!,
			});
			subject = `Newly registered user not confirmed - ${userFirstName} ${userLastName}`;
			break;
		default:
			null;
	}

	// Convert HTML email to plaintext
	const plainTextBody = await render(emailTemplate!, { plainText: true });

	let email;
	try {
		email = await prisma.emailOutbox.create({
			data: {
				recipient: Array.isArray(recipients) ? recipients.join(", ") : recipients,
				cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : null,
				subject,
				bodyHtml: render(emailTemplate!),
				bodyPlain: plainTextBody,
				idempotencyKey: `${emailType}-${Date.now()}`,
			},
		});
		logger(`Email queued successfully to ${recipients}`);
		return { queued: true, id: email.id };
	} catch (error: any) {
		logger(`Failed to queue email to ${recipients}: ${error.message}`);
		return { queued: false, id: email?.id ?? null! };
	}
}
