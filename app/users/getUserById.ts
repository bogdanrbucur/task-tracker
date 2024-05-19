import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import NodeCache from "node-cache";
import { isAborted } from "zod";

type Department = {
	id: number;
	name: string;
} | null;

type UserRestricted = {
	id: string;
	firstName: string;
	lastName: string;
	position: string;
	department: Department;
	email: string;
};

export type UserExtended = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	position: string;
	department: Department;
	subordinates: UserRestricted[];
	assignedTasks: Task[];
	manager?: UserRestricted | null;
	active: boolean;
	isAdmin: boolean;
};

export const prismaUserSelection = {
	id: true,
	firstName: true,
	lastName: true,
	email: true,
	position: true,
	department: true,
	subordinates: { select: { id: true, firstName: true, lastName: true, position: true, department: true, email: true } },
	assignedTasks: true,
	manager: { select: { id: true, firstName: true, lastName: true, position: true, department: true, email: true } },
	active: true,
	isAdmin: true,
};

// Cache the users for 10 minutes. Check every min to see if the cache is stale.
const userCache = new NodeCache({ stdTTL: 10 * 60, checkperiod: 1 * 60 });

export default async function getUserDetails(id: string) {
	let user = userCache.get(id) as UserExtended | undefined;

	if (!user) {
		// console.log(`Fetching user ${id} from database...`);

		// Fetch the user from the database by ID
		user = (await prisma.user.findUnique({
			where: { id: id },
			select: prismaUserSelection,
		})) as UserExtended;

		userCache.set(id, user);
	} else {
		// console.log(`Returning user ${id} from cache...`);
	}

	return user;
}
