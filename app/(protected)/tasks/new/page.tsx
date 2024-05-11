import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import getUsers from "@/app/users/getUsers";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import TaskForm from "../taskForm";

const NewTaskPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);
	if (!userPermissions?.canCreateTasks) return notFound();

	const users = await getUsers();

	return (
		<Card className="container mx-auto px-4 py-8 md:px-6 md:py-12">
			<TaskForm users={users} user={user!} />
		</Card>
	);
};

export default NewTaskPage;
