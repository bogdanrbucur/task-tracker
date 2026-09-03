import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import getUserDetails from "@/app/users/_actions/getUserById";
import getUsers from "@/app/users/_actions/getUsers";
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import { getChecklistTemplatesForPicker } from "@/app/checklist-templates/_actions/getChecklistTemplates";
import { getEligibleParentTasks } from "../../_actions/getEligibleParentTasks";
import TaskForm from "../_components/TaskForm";

const EditTaskpage = async ({ params }: { params: { id: string } }) => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);

	// Await the id param
	const rawParams = await params;
	const taskId = Number(rawParams.id);

	// Fetch the task with the given ID
	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: { assignedToUser: true, attachments: true, checklistItems: { orderBy: { position: "asc" } } },
	});

	// If the task is not found OR task is not In Progress or Overdue, return a 404 page, included in Next.js
	if (!task || (task.statusId !== 1 && task.statusId !== 5)) return notFound();

	// Check if the user has the permission to edit the task = is admin, is manager of the assigned
	// user, or is an assignee who is themselves a manager. A plain assignee may tick checklist
	// items on the detail page but not edit the task's content - mirrors canEditTask in
	// actions/auth/require-auth.ts and the Edit button's visibility on the detail page.
	const canEditTask = userPermissions?.isAdmin || task?.assignedToUser?.managerId === user?.id || (userPermissions?.isManager && task?.assignedToUser?.id === user?.id);
	if (!canEditTask) return notFound();

	// Get logged in user details and all users
	const thisUser = await getUserDetails(user?.id!);
	const allUsers = await getUsers();

	// Filter the users to include only the logged in user and their subordinates, unless they are admin, in which case all users are included
	const subordinates = thisUser?.subordinates;
	let filteredUsers = allUsers!.filter((u) => userPermissions.isAdmin || u.id === thisUser?.id || subordinates?.some((s) => s!.id === u.id));
	// Filter out inactive users
	filteredUsers = filteredUsers.filter((u) => u.status === "active");

	// A task with sub-tasks of its own may never be given a parent (one level deep only) - so it
	// gets no eligible-parents list at all, and the picker never shows if it can't be used.
	const childCount = await prisma.task.count({ where: { parentId: task.id } });
	const eligibleParents = childCount > 0 ? [] : await getEligibleParentTasks(task.id);
	const checklistTemplates = await getChecklistTemplatesForPicker();

	return (
		<TaskForm
			users={filteredUsers}
			task={task}
			eligibleParents={eligibleParents}
			defaultParentId={task.parentId}
			defaultChecklistItems={task.checklistItems.map((i) => ({ id: i.id, text: i.text }))}
			checklistTemplates={checklistTemplates}
		/>
	);
};

export default EditTaskpage;
