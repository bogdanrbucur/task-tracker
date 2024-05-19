import { getAuth } from "@/app/_auth/actions/get-auth";
import { getPermissions } from "@/app/_auth/actions/get-permissions";
import getUsers from "@/app/users/getUsers";
import { notFound } from "next/navigation";
import TaskForm from "../[id]/TaskForm";
import getUserDetails from "@/app/users/getUserById";

const NewTaskPage = async () => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	const canCreateTask = userPermissions?.isAdmin || userPermissions?.isManager;
	if (!canCreateTask) return notFound();

	// Get logged in user details and all users
	const thisUser = await getUserDetails(user?.id!);
	const allUsers = await getUsers();

	// Filter the users to include only the logged in user and their subordinates, unless they are admin, in which case all users are included
	const subordinates = thisUser?.subordinates;
	const filteredUsers = allUsers!.filter((u) => userPermissions.isAdmin || u.id === thisUser?.id || subordinates?.some((s) => s!.id === u.id));

	return <TaskForm users={filteredUsers} user={user!} />;
};

export default NewTaskPage;
