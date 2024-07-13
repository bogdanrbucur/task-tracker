// Client form component to change user password
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState } from "react-dom";
import forgotUserPassword from "./forgotPassword";

const initialState = {};

export default function ForgotPasswordForm() {
	const [state, formAction] = useFormState(forgotUserPassword, initialState);

	return (
		<div className="fade-in flex flex-col items-center justify-center h-screen -mt-36">
			<Card className="w-[355px]">
				<CardHeader>
					<CardTitle>Forgot password</CardTitle>
					<CardDescription>Enter your email address. If it's registered in the app, you will receive a password reset email.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction} className="flex flex-col gap-y-9">
						<div className="grid w-full gap-4">
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="email">Email</Label>
								<Input name="email" type="email" placeholder="Email" required />
							</div>
							<div className="flex justify-center">
								<Button className="w-fit" type="submit">
									Send password reset email
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className="flex justify-between"></CardFooter>
			</Card>
		</div>
	);
}
