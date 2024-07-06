import { Resend } from "resend";
import CommentMentionEmail from "./templates/CommentMention";
import NewTaskEmail from "./templates/NewTaskAssigned";
import TaskCompletedEmail from "./templates/TaskCompleted";
import TaskDueSoonEmail from "./templates/TaskDueSoon";
import TaskOverdueEmail from "./templates/TaskOverdue";
import TaskReopenedEmail from "./templates/TaskReopened";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
	recipientFirstName: string;
	userFirstName?: string;
	userLastName?: string;
	recipients: string[] | string;
	cc?: string[] | string;
	emailType: EmailType;
	taskTitle: string;
	dueDate: Date;
	completedDate?: Date;
	comment?: string;
	link: string;
};

// const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const baseUrl = "https://i.postimg.cc/c193VXkZ" || "http://localhost:3000";

export type EmailType = "taskAssigned" | "taskDueSoon" | "taskOverdue" | "taskCompleted" | "taskReopened" | "commentMention";

// Resend email
export async function sendEmail({ recipientFirstName, userFirstName, userLastName, recipients, cc, emailType, taskTitle, dueDate, completedDate, comment, link }: Props) {
	// Choose the email template based on the emailType

	console.log(`Sending email of type ${emailType} to ${recipients}...`);
	let emailTemplate;
	let subject = "";
	switch (emailType) {
		case "taskAssigned":
			emailTemplate = NewTaskEmail({ firstName: recipientFirstName, dueDate: dueDate, taskTitle: taskTitle, link: link, baseUrl });
			subject = "New task assigned to you";
			break;
		case "taskDueSoon":
			emailTemplate = TaskDueSoonEmail({ firstName: recipientFirstName, dueDate: dueDate, taskTitle: taskTitle, link: link, baseUrl });
			subject = "Task due soon";
			break;
		case "taskOverdue":
			emailTemplate = TaskOverdueEmail({ firstName: recipientFirstName, dueDate: dueDate, taskTitle: taskTitle, link: link, baseUrl });
			subject = "Task due today";
			break;
		case "taskCompleted":
			emailTemplate = TaskCompletedEmail({
				managerFistName: recipientFirstName,
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				dueDate: dueDate,
				taskTitle: taskTitle,
				completedDate: completedDate || new Date(),
				link: link,
				baseUrl,
			});
			subject = "Task completed - ready for review";
			break;
		case "taskReopened":
			emailTemplate = TaskReopenedEmail({
				firstName: recipientFirstName,
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				dueDate: dueDate,
				taskTitle: taskTitle,
				link: link,
				baseUrl,
			});
			subject = "Task reopened";
			break;
		case "commentMention":
			emailTemplate = CommentMentionEmail({
				firstName: recipientFirstName,
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				taskTitle: taskTitle,
				dueDate: dueDate,
				comment: comment!,
				link: link,
				baseUrl,
			});
			subject = "You were mentioned in a comment";
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

		return data;
	} catch (error) {
		console.log(error);
		return error;
	}
}
