// Client form component to sign in a user
"use client";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useFormState } from "react-dom";
import signIn from "../_actions/sign-in";
import Link from "next/link";

const initialState = {
	message: null,
};

export default function SignInForm() {
	const [state, formAction] = useFormState(signIn, initialState);

	return (
		<div className="fade-in flex flex-col items-center justify-center h-screen -mt-36">
			<Card className="w-[355px]">
				<CardHeader>
					<CardTitle>Login</CardTitle>
					<CardDescription>Use your credentials to login to your account.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction} className="flex flex-col gap-y-9">
						<div className="grid w-full gap-4">
							{state.message && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>{state?.message}</AlertTitle>
								</Alert>
							)}
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="name">Email</Label>
								<Input name="email" type="email" placeholder="Email" />
							</div>
							<div className="flex flex-col space-y-1.5">
								<Label htmlFor="framework">Password</Label>
								<Input name="password" type="password" placeholder="Password" />
							</div>
							<div className="flex justify-center">
								<Button className="w-[120px]" type="submit">
									Login
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
				<CardFooter className="flex justify-center">
					<Link href="/forgot-password">
						<span className="text-xs text-muted-foreground hover:underline p-0">Forgot password</span>
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
