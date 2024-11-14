import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Tailwind, Text } from "@react-email/components";
import { PasswordResetEmailProps } from "./PasswordResetRequest";

export const NewUserRegistration = ({ baseUrl, firstName, token }: PasswordResetEmailProps) => {
	const previewText = `Welcome to Task Tracker! 🥳`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
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
							<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">New account created</Heading>
							<Text className="text-black text-[14px] leading-[24px]">Hello {firstName},</Text>
							<Text className="text-black text-[14px] leading-[24px]">Welcome to Task Tracker! 🥳</Text>
							<Text className="text-black text-[14px] leading-[24px]">A new account has been created for you with this email address.</Text>
						</Section>
						<Text>Click the link below to confirm your email and set your account password. The link is valid for 48 hours.</Text>
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
											href={`${baseUrl}/password-reset/?token=${token}`}
											style={{
												color: "#ffffff",
												fontSize: "14px",
												fontWeight: "bold",
												textDecoration: "none",
												display: "inline-block",
												fontFamily: "Arial, sans-serif",
											}}
										>
											Set password
										</a>
									</td>
								</tr>
							</table>
						</Section>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was intended for <span className="text-black">{firstName}</span> and was sent by the Task Tracker app. If you are not the
							intended recipient or have received this email in error, please ignore it.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

// NewTaskEmail.PreviewProps = {
// 	firstName: "Bogdan",
// 	link: "http://localhost:3001/tasks/13",
// 	taskTitle: "Add comprehensive logging to the application",
// 	dueDate: new Date("2024-07-05"),
// } as NewTaskEmailProps;

export default NewUserRegistration;
