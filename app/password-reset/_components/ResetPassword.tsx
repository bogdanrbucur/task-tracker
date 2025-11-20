// Client form component to change user password
"use client";

import resetUserPassword from "@/app/password-reset/_actions/resetUserPassword";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useActionState } from "react";


const initialState = {
	success: false,
	message: null,
};

export default function ResetPassword({ userId, firstName }: { userId: string; firstName: string }) {
	const [state, formAction] = useActionState(resetUserPassword, initialState);

	return (
		<div className="fade-in flex flex-col items-center justify-center h-screen -mt-36">
			<Card className="w-[355px]">
				{!state!.success ? (
					<>
						<CardHeader>
							<CardTitle>Set your new password</CardTitle>
							<CardDescription>Hello {firstName} 👋</CardDescription>
							<CardDescription>Please enter your new password.</CardDescription>
						</CardHeader>
						<CardContent>
							<form action={formAction} className="flex flex-col gap-y-9">
								<div className="grid w-full gap-4">
									{state!.message && (
										<Alert variant="destructive">
											<AlertCircle className="h-4 w-4" />
											<AlertTitle>{state?.message}</AlertTitle>
										</Alert>
									)}
									<div className="flex flex-col space-y-1.5">
										<Label htmlFor="newPassword">New password</Label>
										<Input name="newPassword" type="password" placeholder="Password" required />
									</div>
									<div className="flex flex-col space-y-1.5">
										<Label htmlFor="confirmPassword">Confirm password</Label>
										<Input name="confirmPassword" type="password" placeholder="Password" required />
									</div>
									<div className="flex justify-center">
										<Button className="w-fit" type="submit">
											Save new password
										</Button>
									</div>
								</div>
								<input type="hidden" name="id" value={userId} />
							</form>
						</CardContent>
						<CardFooter className="flex justify-between"></CardFooter>
					</>
				) : (
					<PasswordChanged />
				)}
			</Card>
		</div>
	);
}

function PasswordChanged() {
	setTimeout(() => {
		window.location.href = "/sign-in";
	}, 3000);
	return (
		<>
			<CardHeader>
				<CardTitle>New password saved</CardTitle>
				<CardDescription>Your new password has been saved succesfully. You will now be redirected to the login page.</CardDescription>
			</CardHeader>
			<CardFooter className="flex justify-between"></CardFooter>
		</>
	);
}
