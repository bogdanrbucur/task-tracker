import { completedColor, dueColor, formatDate } from "@/lib/utilityFunctions";
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Tailwind, Text } from "@react-email/components";
import { EmailTask } from "../email";

interface TaskCompletedEmailProps {
	userFirstName: string;
	userLastName: string;
	comment: string;
	baseUrl: string;
	task: EmailTask;
}

export const TaskCompletedEmail = ({ userFirstName, userLastName, comment, baseUrl, task }: TaskCompletedEmailProps) => {
	const previewText = `Task completed and ready for review - ${task.title}`;

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
							<div style={{ textAlign: "center", width: "100%" }}>
								<img
									src={`${baseUrl}/logo.png`}
									width="140"
									height="68"
									alt="logo"
									style={{
										display: "block",
										margin: "0 auto",
									}}
								/>
							</div>
						</Section>
						<Section>
							<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">Task completed</Heading>
							<Text className="text-black text-[14px] leading-[24px]">Hello {task.assignedToUser?.manager?.firstName},</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								A task was completed by {userFirstName} {userLastName} and it's waiting for your review:
								<p>
									<strong>{task.title}</strong>
								</p>
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								Due on <span className={dueColor(task)}>{formatDate(task.dueDate)}</span>
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								<strong>Completion comment:</strong> {comment}
							</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								Completed on <span className={completedColor(task)}>{formatDate(task.completedOn!)}</span>
							</Text>
						</Section>
						<Text>View the task to Close or Reopen it.</Text>
						<Section className="text-center mt-[32px] mb-[32px]">
							<table role="presentation" style={{ margin: "0 auto" }}>
								<tr>
									<td
										style={{
											backgroundColor: "#000000",
											borderRadius: "5px",
											padding: "10px 30px",
											textAlign: "center",
										}}
									>
										<a
											href={`${baseUrl}/tasks/${task.id}?from=emailTaskCompleted`}
											style={{
												color: "#ffffff",
												fontSize: "14px",
												fontWeight: "bold",
												textDecoration: "none",
												display: "inline-block",
												fontFamily: "Arial, sans-serif",
											}}
										>
											View task
										</a>
									</td>
								</tr>
							</table>
						</Section>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was intended for <span className="text-black">{task.assignedToUser?.manager?.firstName}</span> and was sent by the Task Tracker app. If you are not the intended recipient or have received this email in error, please contact the app administrator.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

// TaskCompletedEmail.PreviewProps = {
// 	managerFistName: "Bogdan",
// 	userFirstName: "John",
// 	userLastName: "Doe",
// 	link: "http://localhost:3001/tasks/13",
// 	taskTitle: "Add comprehensive logging to the application",
// 	dueDate: new Date("2024-06-05"),
// 	completedDate: new Date("2024-07-05"),
// } as TaskCompletedEmailProps;

export default TaskCompletedEmail;
