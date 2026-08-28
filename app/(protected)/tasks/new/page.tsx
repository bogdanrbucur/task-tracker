import { getAuth } from "@/actions/auth/get-auth";
import { getPermissions } from "@/actions/auth/get-permissions";
import getUserDetails from "@/app/users/_actions/getUserById";
import getUsers from "@/app/users/_actions/getUsers";
import { notFound } from "next/navigation";
import TaskForm from "../[id]/_components/TaskForm";
import { getEligibleParentTasks } from "../_actions/getEligibleParentTasks";
import { getTaskCopyForPrefill } from "./_actions/getTaskCopyForPrefill";

interface Props {
	// copyFrom prefills the form from an existing task (Duplicate); parent prefills only the
	// parent task field (Add sub-task). Both are ids, loaded server-side rather than round-tripped
	// through the URL - see getTaskCopyForPrefill for why.
	searchParams: { copyFrom?: string; parent?: string };
}

const NewTaskPage = async ({ searchParams }: Props) => {
	// Check user permissions
	const { user } = await getAuth();
	const userPermissions = await getPermissions(user?.id);
	const canCreateTask = userPermissions?.isAdmin || userPermissions?.isManager;
	if (!canCreateTask) return notFound();

	const rawSearchParams = await searchParams;

	// Get logged in user details and all users
	const thisUser = await getUserDetails(user?.id!);
	const allUsers = await getUsers();

	// Filter the users to include only the logged in user and their subordinates, unless they are admin, in which case all users are included
	const subordinates = thisUser?.subordinates;
	let filteredUsers = allUsers!.filter((u) => userPermissions.isAdmin || u.id === thisUser?.id || subordinates?.some((s) => s!.id === u.id));
	// But keep only active users
	filteredUsers = filteredUsers.filter((u) => u.status === "active");

	const eligibleParents = await getEligibleParentTasks();

	const copyFromId = rawSearchParams.copyFrom ? Number(rawSearchParams.copyFrom) : undefined;
	const parentIdParam = rawSearchParams.parent ? Number(rawSearchParams.parent) : undefined;

	const copy = copyFromId && Number.isFinite(copyFromId) ? await getTaskCopyForPrefill(copyFromId) : null;
	// Add sub-task: the parent must actually be eligible (still open, no parent of its own) or the
	// field is simply left blank rather than silently accepting an invalid one.
	const parentFromLink = parentIdParam && eligibleParents.some((p) => p.id === parentIdParam) ? parentIdParam : undefined;

	if (copy) {
		return (
			<TaskForm
				users={filteredUsers}
				prefill={{
					title: copy.title,
					description: copy.description,
					dueDate: copy.dueDate,
					source: copy.source,
					sourceLink: copy.sourceLink,
					assignedToUser: copy.assignedToUser,
				}}
				eligibleParents={eligibleParents}
				defaultChecklistItems={copy.checklistItems}
				copyFromTaskId={copy.copyFromTaskId}
				dueDateWasNotCopied={copy.dueDateWasNotCopied}
			/>
		);
	}

	// copyFromId was given but getTaskCopyForPrefill returned null - the source task doesn't exist,
	// or this user isn't allowed to edit it (Duplicate is shown to anyone who can create tasks, a
	// wider group than can edit any given one - see the button on the detail page). Fall through to
	// a blank form rather than a dead end, but say why nothing was prefilled.
	const copyDenied = !!copyFromId && !copy;

	return (
		<TaskForm
			users={filteredUsers}
			eligibleParents={eligibleParents}
			defaultParentId={parentFromLink}
			notice={copyDenied ? `Task #${copyFromId} could not be duplicated - it may not exist, or you may not have access to it.` : undefined}
		/>
	);
};

export default NewTaskPage;
