import { Task } from "@prisma/client";
import { Resend } from "resend";
import CommentMentionEmail from "./templates/CommentMention";
import NewTaskEmail from "./templates/NewTaskAssigned";
import NewUserRegistered from "./templates/NewUserRegistered";
import PasswordResetEmail from "./templates/PasswordResetRequest";
import TaskCancelledEmail from "./templates/TaskCancelled";
import TaskCompletedEmail from "./templates/TaskCompleted";
import TaskDueSoonEmail from "./templates/TaskDueSoon";
import TaskOverdueEmail from "./templates/TaskOverdue";
import TaskReopenedEmail from "./templates/TaskReopened";
import NewUserNotConfirmedEmail from "./templates/NewUserNotConfirmed";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
	userFirstName?: string;
	userLastName?: string;
	recipients: string[] | string;
	cc?: string[] | string;
	emailType: EmailType;
	comment?: string;
	task?: EmailTask;
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
	success: boolean;
	error: string | null;
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
export async function sendEmail({ userFirstName, userLastName, recipients, cc, emailType, comment, task }: Props): Promise<EmailResponse> {
	// Choose the email template based on the emailType

	console.log(`Sending email of type ${emailType} to ${recipients}...`);
	let emailTemplate;
	let subject = "";
	switch (emailType) {
		case "taskAssigned":
			emailTemplate = NewTaskEmail({ baseUrl, task: task! });
			subject = "New task assigned to you";
			break;
		case "taskDueSoon":
			emailTemplate = TaskDueSoonEmail({ baseUrl, task: task! });
			subject = "Task due soon";
			break;
		case "taskOverdue":
			emailTemplate = TaskOverdueEmail({ baseUrl, task: task! });
			subject = "Task overdue";
			break;
		case "taskCompleted":
			emailTemplate = TaskCompletedEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				baseUrl,
				task: task!,
			});
			subject = "Task completed - ready for review";
			break;
		case "taskReopened":
			emailTemplate = TaskReopenedEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = "Task reopened";
			break;
		case "commentMention":
			emailTemplate = CommentMentionEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = "You were mentioned in a task comment";
			break;
		case "taskCancelled":
			emailTemplate = TaskCancelledEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				comment: comment!,
				baseUrl,
				task: task!,
			});
			subject = "Task cancelled";
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
			subject = "Newly registered user not confirmed";
			break;
		default:
			null;
	}

	try {
		const { data, error } = await resend.emails.send({
			from: "Task Tracker <tasks@tasks.tetrabit.dev>",
			to: recipients,
			cc: cc,
			subject,
			react: emailTemplate,
			text: "",
		});

		if (error) {
			console.log(error);
			return { success: false, error: error.message };
		}

		console.log(data);
		return { success: true, error: null };
	} catch (error: any) {
		console.log(error);
		return { success: false, error: error.message };
	}
}
