import { getAuth } from "@/app/_auth/actions/get-auth";
import { getUserPermissions } from "@/app/_auth/actions/get-permissions";
import getUsers from "@/app/users/getUsers";
import { notFound } from "next/navigation";
import TaskForm from "../[id]/taskForm";

const NewTaskPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	let userPermissions;
	if (user) userPermissions = await getUserPermissions(user.id);
	if (!userPermissions?.canCreateTasks) return notFound();

	const users = await getUsers();

	return <TaskForm users={users} user={user!} />;
};

export default NewTaskPage;
