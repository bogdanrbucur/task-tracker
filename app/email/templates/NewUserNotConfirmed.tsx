import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Tailwind, Text } from "@react-email/components";

export interface NewUserNotConfirmedEmailProps {
	baseUrl: string;
	firstName: string;
	lastName: string;
	userId: string;
}

export const NewUserNotConfirmedEmail = ({ baseUrl, firstName, lastName, userId }: NewUserNotConfirmedEmailProps) => {
	const previewText = `Newly registered user not confirmed - ${firstName} ${lastName}`;

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
							<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
								User {firstName} {lastName} not confirmed
							</Heading>
							<Text className="text-black text-[14px] leading-[24px]">Hello,</Text>
							<Text className="text-black text-[14px] leading-[24px]">
								User {firstName} {lastName} has not confirmed their email and has not set a login password. They will not be able to login and receive tasks until they
								follow the link in the email and set an account password.
							</Text>
						</Section>
						<Text>You may resend the welcome email or delete the user from their profile page.</Text>
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
											href={`${baseUrl}/users/${userId}`}
											style={{
												color: "#ffffff",
												fontSize: "14px",
												fontWeight: "bold",
												textDecoration: "none",
												display: "inline-block",
												fontFamily: "Arial, sans-serif",
											}}
										>
											View user
										</a>
									</td>
								</tr>
							</table>
						</Section>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							This email was sent by the Task Tracker app. If you are not the intended recipient or have received this email in error, please
							contact the app administrator.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default NewUserNotConfirmedEmail;
