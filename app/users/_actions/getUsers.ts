import prisma from "@/prisma/client";
import NodeCache from "node-cache";
import { UserExtended, prismaExtendedUserSelection } from "./getUserById";

// Cache the users for 5 minutes. Check every min to see if the cache is stale.
const userCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 1 * 60 });

export default async function getUsers() {
	let users = userCache.get("users") as UserExtended[] | undefined;

	if (!users) {
		// console.log("Fetching users from database...");
		users = (await prisma.user.findMany({
			select: prismaExtendedUserSelection,
		})) as UserExtended[];
		userCache.set("users", users);
	} else {
		// console.log("Returning users from cache...");
	}

	return users;
}

// Call after any mutation that changes the set of users or their status/manager/department
// (create, update, activate/deactivate, delete). Without this the 5 minute TTL lets a
// just-deactivated user keep showing up as selectable in the task assignee dropdowns.
export function invalidateUsersCache() {
	userCache.del("users");
}
