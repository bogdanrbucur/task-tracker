import prisma from "@/prisma/client";
import { Task } from "@prisma/client";
import NodeCache from "node-cache";
import { cache } from "react";

type Department = {
	id: number;
	name: string;
} | null;

export type UserRestricted = {
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

export const prismaRestrictedUserSelection = {
	id: true,
	firstName: true,
	lastName: true,
	position: true,
	department: true,
	email: true,
};

export const prismaExtendedUserSelection = {
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
// const userCache = new NodeCache({ stdTTL: 5, checkperiod: 5 });

const getUserDetails = cache(async (id: string) => {
	// console.log("User details called for ID: ", id);
	const user = (await prisma.user.findUnique({
		where: { id: id },
		select: prismaExtendedUserSelection,
	})) as UserExtended;

	return user;
});

export default getUserDetails;
