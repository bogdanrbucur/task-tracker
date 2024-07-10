import { Task } from "@prisma/client";
import { Resend } from "resend";
import CommentMentionEmail from "./templates/CommentMention";
import NewTaskEmail from "./templates/NewTaskAssigned";
import TaskCompletedEmail from "./templates/TaskCompleted";
import TaskDueSoonEmail from "./templates/TaskDueSoon";
import TaskOverdueEmail from "./templates/TaskOverdue";
import TaskReopenedEmail from "./templates/TaskReopened";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
	userFirstName?: string;
	userLastName?: string;
	recipients: string[] | string;
	cc?: string[] | string;
	emailType: EmailType;
	comment?: string;
	task: EmailTask;
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

// const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const baseUrl = "https://i.postimg.cc/c193VXkZ" || "http://localhost:3000";

export type EmailType = "taskAssigned" | "taskDueSoon" | "taskOverdue" | "taskCompleted" | "taskReopened" | "commentMention";

// Resend email
export async function sendEmail({ userFirstName, userLastName, recipients, cc, emailType, comment, task }: Props) {
	// Choose the email template based on the emailType

	console.log(`Sending email of type ${emailType} to ${recipients}...`);
	let emailTemplate;
	let subject = "";
	switch (emailType) {
		case "taskAssigned":
			emailTemplate = NewTaskEmail({ baseUrl, task });
			subject = "New task assigned to you";
			break;
		case "taskDueSoon":
			emailTemplate = TaskDueSoonEmail({ baseUrl, task });
			subject = "Task due soon";
			break;
		case "taskOverdue":
			emailTemplate = TaskOverdueEmail({ baseUrl, task });
			subject = "Task overdue";
			break;
		case "taskCompleted":
			emailTemplate = TaskCompletedEmail({
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				baseUrl,
				task,
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
				task,
			});
			subject = "You were mentioned in a task comment";
			break;
		default:
			null;
	}

	try {
		const { data, error } = await resend.emails.send({
			from: "Task Tracker <tasktracker@resend.dev>",
			to: recipients,
			cc: cc,
			subject,
			react: emailTemplate,
			text: "",
		});

		if (error) {
			console.log(error);
			return error;
		}

		console.log(data);
		return data;
	} catch (error) {
		console.log(error);
		return error;
	}
}
