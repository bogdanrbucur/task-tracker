import prisma from "@/prisma/client";
import NodeCache from "node-cache";

export type UserNameAndDept = {
	id: string;
	firstName: string;
	lastName: string;
	departmentId: number;
	department: {
		id: number;
		name: string;
	} | null;
};

// Cache the users for 60 minutes. Check every 10 min to see if the cache is stale.
const userCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 10 * 60 });

export default async function getUserNameAndDeptById(id: string) {
	let user = userCache.get(id) as UserNameAndDept | undefined;

	if (!user) {
		// console.log(`Fetching user ${id} from database...`);

		// Fetch the user from the database by ID
		user = (await prisma.user.findUnique({
			where: { id: id },
			select: { id: true, firstName: true, lastName: true, departmentId: true },
		})) as UserNameAndDept;

		// If the user has no department, set it to null
		if (user.departmentId === null) user.department = null;
		// If the user has a department, fetch the department from the database
		else {
			const department = await prisma.department.findUnique({
				where: { id: user.departmentId! },
			});

			if (department) user.department = { id: department.id, name: department.name };
		}

		// TODO get the user manager
		//

		userCache.set(id, user);
	} else {
		// console.log(`Returning user ${id} from cache...`);
	}

	return user;
}
