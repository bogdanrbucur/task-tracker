// src/app/sign-up/page.tsx

import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import { SignUpForm } from "@/app/_auth/components/SignUpForm";
import { notFound } from "next/navigation";

const SignUpPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Only admins can create users
	if (!userPermissions?.isAdmin) return notFound();

	return (
		<>
			<h2>Sign Up Page</h2>
			<SignUpForm />
		</>
	);
};

export default SignUpPage;
