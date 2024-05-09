import { notFound } from "next/navigation";
import { getAuth } from "../_auth/actions/get-auth";
import { getUserPermissions } from "../_auth/actions/get-permissions";

export default async function Home() {
	const { user } = await getAuth();

	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);

	if (!userPermissions?.canCreateTasks) return notFound();

	return <h1>List of users...</h1>;
}
