import fs from "fs-extra";
import { Resend } from "resend";
import { NewTaskEmail } from "./templates/NewTaskAssigned";
import TaskOverdueEmail from "./templates/TaskOverdue";
import TaskDueSoonEmail from "./templates/TaskDueSoon";
import TaskCompletedEmail from "./templates/TaskCompleted";
import TaskReopenedEmail from "./templates/TaskReopened";
import CommentMentionEmail from "./templates/CommentMention";
import { sub } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
	recipientFirstName: string;
	userFirstName?: string;
	userLastName?: string;
	recipients: string[] | string;
	cc?: string[] | string;
	emailType: EmailType;
	taskTitle: string;
	dueDate: string;
	completedDate?: string;
	comment?: string;
	link: string;
};

// TODO read the logo.png and convert it to base64
// const logo = fs.readFileSync("logo.png", "base64");

export type EmailType = "taskAssigned" | "taskDueSoon" | "taskOverdue" | "taskCompleted" | "taskReopened" | "commentMention";

// Resend email
export async function testEmail({ recipientFirstName, userFirstName, userLastName, recipients, cc, emailType, taskTitle, dueDate, completedDate, comment, link }: Props) {
	// Choose the email template based on the emailType
	let emailTemplate;
	let subject = "";
	switch (emailType) {
		case "taskAssigned":
			emailTemplate = NewTaskEmail({ firstName: recipientFirstName, dueDate: dueDate, taskTitle: taskTitle, link: link });
			subject = "New task assigned to you";
		case "taskDueSoon":
			emailTemplate = TaskDueSoonEmail({ firstName: recipientFirstName, dueDate: dueDate, taskTitle: taskTitle, link: link });
			subject = "Task due soon";
		case "taskOverdue":
			emailTemplate = TaskOverdueEmail({ firstName: recipientFirstName, dueDate: dueDate, taskTitle: taskTitle, link: link });
			subject = "Task due today";
		case "taskCompleted":
			emailTemplate = TaskCompletedEmail({
				managerFistName: recipientFirstName,
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				dueDate: dueDate,
				taskTitle: taskTitle,
				completedDate: completedDate!,
				link: link,
			});
			subject = "Task completed - ready for review";
		case "taskReopened":
			emailTemplate = TaskReopenedEmail({
				firstName: recipientFirstName,
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				dueDate: dueDate,
				taskTitle: taskTitle,
				link: link,
			});
			subject = "Task reopened";
		case "commentMention":
			emailTemplate = CommentMentionEmail({
				firstName: recipientFirstName,
				userFirstName: userFirstName!,
				userLastName: userLastName!,
				taskTitle: taskTitle,
				dueDate: dueDate,
				comment: comment!,
				link: link,
			});
			subject = "You were mentioned in a comment";
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
