// Client form component to sign in a user
"use client";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import signIn from "../_actions/sign-in";

// The official Microsoft four-square logo (Wikimedia "Microsoft logo.svg" colors), inlined
// rather than loaded via <img>: flex centering can place the mark on a fractional device
// pixel, and a rasterized <img> then blits unevenly (fat/soft gutter on one axis only).
// Inline SVG is drawn by the vector renderer at the final position, so both gutters stay even.
function MicrosoftLogo() {
	return (
		<svg width="21" height="21" viewBox="0 0 21 21" aria-hidden="true" shapeRendering="crispEdges" className="shrink-0">
			<rect x="0" y="0" width="10" height="10" fill="#f35325" />
			<rect x="11" y="0" width="10" height="10" fill="#81bc06" />
			<rect x="0" y="11" width="10" height="10" fill="#05a6f0" />
			<rect x="11" y="11" width="10" height="10" fill="#ffba08" />
		</svg>
	);
}

// The official "Sign in with Microsoft" button, per Microsoft's identity-platform branding
// guidelines: 41px tall, #2F2F2F background, Segoe UI 15px label, 21px Microsoft symbol,
// square corners, 12px padding/gap. Content is left-aligned (as in Microsoft's artwork) so
// the logo sits at a fixed 12px - flex centering would drop it on a fractional pixel and
// smear the mark's 1px gutters on one axis.
function MicrosoftSignInButton() {
	return (
		<a
			href="/api/auth/m365/login"
			data-testid="m365-signin"
			className="flex h-[41px] w-full items-center justify-center gap-3 bg-[#2F2F2F] px-3 text-white transition-colors hover:bg-[#3d3d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F2F2F]"
			style={{ fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif' }}
		>
			<MicrosoftLogo />
			<span className="text-[15px] font-semibold leading-none">Sign in with Microsoft</span>
		</a>
	);
}

export default function SignInForm({
	m365Enabled = false,
	passwordEnabled = true,
	initialMessage = null,
}: {
	m365Enabled?: boolean;
	passwordEnabled?: boolean;
	initialMessage?: string | null;
}) {
	// Seeding the state with initialMessage lets an OAuth failure surface in the same Alert as a
	// bad password, instead of needing its own error UI.
	const [state, formAction] = useActionState(signIn, { message: initialMessage });

	return (
		<div className="fade-in flex flex-col items-center justify-center min-h-full py-10">
			<Card className="w-[355px]">
				<CardHeader>
					<CardTitle>Login</CardTitle>
					<CardDescription>{m365Enabled ? "Sign in with your organization account." : "Use your credentials to login to your account."}</CardDescription>
				</CardHeader>
				<CardContent>
					{state?.message && (
						<Alert variant="destructive" className="mb-5">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>{state?.message}</AlertTitle>
						</Alert>
					)}

					{m365Enabled && (
						// A plain link, not a form: the login route is a GET that redirects to Microsoft.
						<MicrosoftSignInButton />
					)}

					{m365Enabled && passwordEnabled && (
						<div className="flex items-center gap-3 my-5">
							<span className="h-px flex-1 bg-border" />
							<span className="text-xs text-muted-foreground">or</span>
							<span className="h-px flex-1 bg-border" />
						</div>
					)}

					{passwordEnabled && (
						<form action={formAction} className="flex flex-col gap-y-9">
							<div className="grid w-full gap-4">
								<div className="flex flex-col space-y-1.5">
									<Label htmlFor="name">Email</Label>
									<Input name="email" type="email" placeholder="Email" />
								</div>
								<div className="flex flex-col space-y-1.5">
									<Label htmlFor="framework">Password</Label>
									<Input name="password" type="password" placeholder="Password" />
								</div>
								<div className="flex justify-center">
									<Button className="w-[120px]" variant={m365Enabled ? "outline" : "default"} type="submit">
										Login
									</Button>
								</div>
							</div>
						</form>
					)}
				</CardContent>
				{passwordEnabled && (
					<CardFooter className="flex justify-center">
						<Link href="/forgot-password">
							<span className="text-xs text-muted-foreground hover:underline p-0">Forgot password</span>
						</Link>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
