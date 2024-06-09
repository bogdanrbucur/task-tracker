import * as React from "react";

interface EmailTemplateProps {
	firstName: string;
	link: string;
}

export const TaskAssignedEmail: React.FC<Readonly<EmailTemplateProps>> = ({ firstName, link }) => (
	<div>
		<p>Hello, {firstName}.</p>
		<p>
			A new task has been assigned to you. See it <a href={link}>here</a>.
		</p>
	</div>
);
