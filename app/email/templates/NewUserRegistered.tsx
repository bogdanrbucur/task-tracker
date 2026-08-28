import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Tailwind, Text } from "@react-email/components";
import { PasswordResetEmailProps } from "./PasswordResetRequest";

export interface NewUserRegisteredProps extends PasswordResetEmailProps {
	/** Whether M365 sign-in is enabled - offers "Sign in with Microsoft" as the primary action. */
	m365Enabled?: boolean;
	/** Whether the password form still exists - hides the "Set password" fallback when it doesn't. */
	passwordAuthEnabled?: boolean;
}

export const NewUserRegistration = ({ baseUrl, firstName, token, m365Enabled = false, passwordAuthEnabled = true }: NewUserRegisteredProps) => {
	const previewText = `Welcome to Task Tracker! 🥳`;

	// The official "Sign in with Microsoft" button, per Microsoft's identity-platform branding
	// guidelines: #2F2F2F background, Segoe UI 15px label, 21px Microsoft symbol, square corners.
	// Built with a table so it survives email clients; the symbol is a hosted PNG (SVG is stripped
	// by Gmail and others).
	const microsoftButton = (href: string) => (
		<table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "0 auto" }}>
			<tr>
				<td style={{ backgroundColor: "#2F2F2F", padding: "10px 12px" }}>
					<a href={href} style={{ textDecoration: "none", color: "#ffffff", display: "inline-block" }}>
						<table role="presentation" cellPadding={0} cellSpacing={0}>
							<tr>
								<td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
									<img src={`${baseUrl}/microsoft-logo.png`} width="21" height="21" alt="" style={{ display: "block", border: "0" }} />
								</td>
								<td
									style={{
										verticalAlign: "middle",
										color: "#ffffff",
										fontSize: "15px",
										fontWeight: "bold",
										fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
										whiteSpace: "nowrap",
									}}
								>
									Sign in with Microsoft
								</td>
							</tr>
						</table>
					</a>
				</td>
			</tr>
		</table>
	);

	// Generic pill button used for the password fallback.
	const button = (label: string, href: string, primary: boolean) => (
		<table role="presentation" style={{ margin: "0 auto" }}>
			<tr>
				<td
					style={{
						backgroundColor: primary ? "#000000" : "#ffffff",
						border: primary ? "none" : "1px solid #cccccc",
						borderRadius: "5px",
						padding: "10px 30px",
						textAlign: "center",
					}}
				>
					<a
						href={href}
						style={{
							color: primary ? "#ffffff" : "#000000",
							fontSize: "14px",
							fontWeight: "bold",
							textDecoration: "none",
							display: "inline-block",
							fontFamily: "Arial, sans-serif",
						}}
					>
						{label}
					</a>
				</td>
			</tr>
		</table>
	);

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

						{m365Enabled && (
							<>
								<Text>Click below to sign in with your Microsoft 365 account.</Text>
								<Section className="text-center mt-[32px] mb-[8px]">{microsoftButton(`${baseUrl}/api/auth/m365/login`)}</Section>
							</>
						)}

						{passwordAuthEnabled && (
							<>
								<Text>
									{m365Enabled
										? "Or, if you'd rather use a password, click below to set one. The link is valid for 48 hours."
										: "Click the link below to confirm your email and set your account password. The link is valid for 48 hours."}
								</Text>
								<Section className="text-center mt-[8px] mb-[32px]">
									{button("Set password", `${baseUrl}/password-reset/?token=${token}`, !m365Enabled)}
								</Section>
							</>
						)}

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

export default NewUserRegistration;
