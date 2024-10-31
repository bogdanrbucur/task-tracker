import { dueColor, formatDate } from "@/lib/utilityFunctions";
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Tailwind, Text } from "@react-email/components";
import { EmailTask } from "../email";

interface CommentMentionEmailProps {
	userFirstName: string;
	userLastName: string;
	comment: string;
	baseUrl: string;
	task: EmailTask;
	recipientFirstName: string;
}

export const CommentMentionEmail = ({ userFirstName, userLastName, comment, baseUrl, task, recipientFirstName }: CommentMentionEmailProps) => {
	const previewText = `Comment mention`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<head>
					<style>.dark:text-red-400, color: #f87171; .dark:text-orange-400, color: #f59e0b;</style>
				</head>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Section className="mt-[32px]">
							<Img src={`${baseUrl}/logo.png`} width="140" height="37" alt="logo" className="my-0 mx-auto" />
						</Section>
						<Section>
							<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">Comment mention</Heading>
							<Text className="text-black text-[14px] leading-[24px]">Hello {recipientFirstName},</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								{userFirstName} {userLastName} mentioned you in a comment on the task:
								<p>
									<strong>{task.title}</strong>
								</p>
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								Due on <span className={dueColor(task)}>{formatDate(task.dueDate)}</span>
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								<strong>Comment:</strong> {comment}
							</Text>
						</Section>
						<Text>View the task to see the task details and comments.</Text>
						<Section className="text-center mt-[32px] mb-[32px]">
							<Button className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3" href={`${baseUrl}/tasks/${task.id}`}>
								View task
							</Button>
						</Section>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was intended for <span className="text-black">{recipientFirstName}</span> and was sent by the <a href={baseUrl}>Task Tracker</a> app. If you are
							not the intended recipient or have received this email in error, please contact the app administrator.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

// CommentMentionEmail.PreviewProps = {
// 	firstName: "Bogdan",
// 	userFirstName: "John",
// 	userLastName: "Doe",
// 	link: "http://localhost:3001/tasks/13",
// 	taskTitle: "Add comprehensive logging to the application",
// 	dueDate: new Date("2024-07-05"),
// 	comment: "Hello @Bogdan. Can you please review this task?",
// } as CommentMentionEmailProps;

export default CommentMentionEmail;
