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
	miscPayload?: any;
};

export type EmailType = "taskAssigned" | "taskDueSoon" | "taskOverdue";

// Resend email
export async function testEmail({ firstName, lastName, recipients, cc, subject, emailType, miscPayload }: Props) {
	try {
		const { data, error } = await resend.emails.send({
			from: "Task Tracker <trasktracker@resend.dev>",
			to: recipients,
			cc: cc,
			subject: subject,
			react: TaskAssignedEmail({ firstName: firstName, link: miscPayload }),
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
