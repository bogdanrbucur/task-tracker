import fs from "fs-extra";
import { Resend } from "resend";
import { TaskAssignedEmail } from "./templates/taskAssigned";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
	firstName: string;
	lastName?: string;
	recipients: string[] | string;
	cc?: string[] | string;
	subject: string;
	emailType: EmailType;
	taskTitle?: string;
	dueDate?: string;
	miscPayload?: any;
};

// TODO read the logo.png and convert it to base64
const logo = fs.readFileSync("logo.png", "base64");

export type EmailType = "taskAssigned" | "taskDueSoon" | "taskOverdue";

// Resend email
export async function testEmail({ firstName, lastName, recipients, cc, subject, emailType, taskTitle, dueDate, miscPayload }: Props) {
	try {
		const { data, error } = await resend.emails.send({
			from: "Task Tracker <trasktracker@resend.dev>",
			to: recipients,
			cc: cc,
			subject: subject,
			react: TaskAssignedEmail({ firstName: firstName, dueDate: dueDate!, taskTitle: taskTitle!, link: miscPayload }),
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
