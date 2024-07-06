import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Tailwind, Text } from "@react-email/components";
import * as React from "react";

interface TaskCompletedEmailProps {
	managerFistName: string;
	userFirstName: string;
	userLastName: string;
	taskTitle: string;
	dueDate: string;
	completedDate: string;
	link: string;
}

const baseUrl = process.env.BASE_URL ? `https://${process.env.BASE_URL}` : "http://localhost:3001";

export const TaskCompletedEmail = ({ managerFistName, userFirstName, userLastName, taskTitle, dueDate, completedDate, link }: TaskCompletedEmailProps) => {
	const previewText = `Task completed`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Section className="mt-[32px]">
							<Img src={`${baseUrl}/logo.png`} width="140" height="37" alt="logo" className="my-0 mx-auto" />
						</Section>
						<Section>
							<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">Task completed</Heading>
							<Text className="text-black text-[14px] leading-[24px]">Hello {managerFistName},</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								A task was completed by {userFirstName} {userLastName} and it's waiting for your review:
								<p>
									<strong>{taskTitle}</strong>
								</p>
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								Due on <span>{dueDate}</span>
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								Completed on <span>{completedDate}</span>
							</Text>
						</Section>
						<Text>View the task to Close or Reopen it.</Text>
						<Section className="text-center mt-[32px] mb-[32px]">
							<Button className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3" href={link}>
								View task
							</Button>
						</Section>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was intended for <span className="text-black">{managerFistName}</span> and was sent by the <a href={baseUrl}>Task Tracker</a> app. If you are not
							the intended recipient or have received this email in error, please contact the app administrator.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

TaskCompletedEmail.PreviewProps = {
	managerFistName: "Bogdan",
	userFirstName: "John",
	userLastName: "Doe",
	link: "http://localhost:3001/tasks/13",
	taskTitle: "Add comprehensive logging to the application",
	dueDate: "10 May 2024",
	completedDate: "06 Jul 2024",
} as TaskCompletedEmailProps;

export default TaskCompletedEmail;
