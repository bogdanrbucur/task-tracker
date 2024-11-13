import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Tailwind, Text } from "@react-email/components";

export interface PasswordResetEmailProps {
	baseUrl: string;
	firstName: string;
	token: string;
}

export const PasswordResetEmail = ({ baseUrl, firstName, token }: PasswordResetEmailProps) => {
	const previewText = `Password reset request`;

	return (
		<Html>
			<Head />
			<Preview>{previewText}</Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Section className="mt-[32px]">
							<Img src={`${baseUrl}/logo.png`} width="140" height="68" alt="logo" className="my-0 mx-auto" />
						</Section>
						<Section>
							<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">Password reset request</Heading>
							<Text className="text-black text-[14px] leading-[24px]">Hello {firstName},</Text>
							<Text className="text-black text-[14px] leading-[24px]">A password reset request has been initiated for your account.</Text>
						</Section>
						<Text>Click the link below to set a new password. The link is valid for 15 minutes.</Text>
						<Section className="text-center mt-[32px] mb-[32px]">
							<Button
								className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline text-center px-5 py-3"
								href={`${baseUrl}/password-reset/?token=${token}`}
							>
								Reset password
							</Button>
						</Section>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was intended for <span className="text-black">{firstName}</span> and was sent by the <a href={baseUrl}>Task Tracker</a> app. If you are not the
							intended recipient or have received this email in error, please contact the app administrator.
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

export default PasswordResetEmail;
