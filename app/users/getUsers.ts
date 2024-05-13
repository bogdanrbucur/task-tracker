import prisma from "@/prisma/client";
import NodeCache from "node-cache";
import { SelectionUser } from "../(protected)/tasks/[id]/taskForm";

// Cache the users for 5 minutes. Check every 2 min to see if the cache is stale.
const userCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 2 * 60 });

export default async function getUsers() {
	let users = userCache.get("users") as SelectionUser[] | undefined;

	if (!users) {
		// console.log("Fetching users from database...");
		users = (await prisma.user.findMany({
			select: {
				id: true,
				firstName: true,
				lastName: true,
				position: true,
				email: true,
				department: true,
				manager: { select: { id: true, firstName: true, lastName: true, position: true, department: true, email: true } },
				assignedTasks: true,
			},
		})) as SelectionUser[];
		userCache.set("users", users);
	} else {
		// console.log("Returning users from cache...");
	}

	return users;
}
