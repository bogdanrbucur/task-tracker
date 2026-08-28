// Builds the Prisma where/orderBy for the tasks list.
//
// Shared by the tasks page and the Excel export so the two cannot drift. The export previously
// read a module-level `let query` that the page set during render - a global shared by every
// concurrent request, which leaked one user's filtered result set to another and defaulted to
// "every task in the system" before any page had been rendered.

// Type-only: this module is imported by client components (ExcelExportButton), and a value import
// would pull @prisma/client into the browser bundle
import type { UserExtended } from "@/app/users/_actions/getUserById";
import type { Department, Prisma, Status, Task, User } from "@prisma/client";

/**
 * Lives here rather than in page.tsx so that getTasksForExport does not have to import from the
 * page module. That import created a cycle - page -> TaskTopSection -> ExcelExportButton ->
 * getTasksForExport -> page - which broke the Turbopack dev build manifest for this route.
 */
export interface TaskExtended extends Task {
	assignedToUser?: UserExtended;
	createdByUser?: User;
	status: Status;
	department?: Department;
	_count?: { children: number };
}

type StatusTypes = "1" | "2" | "3" | "4" | "5" | undefined;

// All (default): no filter. hideSubtasks: only tasks with no parent - ordinary tasks and parents,
// just not the sub-tasks under them.
export type HierarchyFilter = "hideSubtasks" | undefined;

export interface TasksQuery {
	status: StatusTypes;
	orderBy: keyof Task;
	sortOrder: "asc" | "desc";
	page: string;
	user: string;
	search: string;
	dept: string;
	hierarchy?: HierarchyFilter;
}

function hierarchyFilter(hierarchy: HierarchyFilter): Prisma.TaskWhereInput | undefined {
	if (hierarchy === "hideSubtasks") return { parentId: null };
	return undefined;
}

export function buildTaskWhere(params: TasksQuery): Prisma.TaskWhereInput | undefined {
	// Split the status string into an array of numbers, as multiple statuses can be selected
	const statuses = params.status ? params.status.split(",").map((statusId) => parseInt(statusId)) : undefined;
	const taskUser = params.user ? params.user : undefined;
	const department = params.dept ? params.dept : undefined;
	const hierarchy = hierarchyFilter(params.hierarchy);

	let searchTermsQuery = params.search ? params.search : undefined;
	let searchTerms: string[] | undefined = undefined;
	// If there are search terms, remove any leading/trailing whitespace and split the terms into an array
	if (searchTermsQuery) {
		searchTermsQuery = searchTermsQuery.trim();
		searchTerms = searchTermsQuery.split(" ");
	}

	// If there's no search terminology, just filter by status, user, department and hierarchy
	if ((statuses || taskUser || department || hierarchy) && !searchTerms) {
		return {
			AND: [
				statuses ? { statusId: { in: statuses } } : undefined,
				taskUser ? { assignedToUserId: taskUser } : undefined,
				department ? { assignedToUser: { department: { id: Number(department) } } } : undefined,
				hierarchy,
			].filter(Boolean) as Prisma.TaskWhereInput[],
		};
	}

	// If there's a search term, search in title, description, assignedToUser, and status
	if (searchTerms) {
		return {
			AND: [
				{
					// for each search term, search in title, description, assignedToUser, and status
					// * This whole exercise is because the id field is a number, and the rest are strings.
					// * So we can't just search all fields together, we need to create separate filters for id and the rest.
					// * Then combine them with OR, and finally combine all terms with AND.
					// * This way, if the term is a number, it will search by id as well as the other fields.
					// * Normally, we'd just have an OR filter with all fields, but Prisma doesn't allow mixing types in a single filter.
					AND: searchTerms.map((term) => {
						const orFilters: Prisma.TaskWhereInput[] = [
							{ title: { contains: term } },
							{ source: { contains: term } },
							{ description: { contains: term } },
							{
								assignedToUser: {
									OR: [
										{ firstName: { contains: term } },
										{ lastName: { contains: term } },
										{ department: { OR: [{ name: { contains: term } }] } },
										{ position: { contains: term } },
									],
								},
							},
							{ status: { displayName: { contains: term } } },
						];
						// If the term is a number, also search by task ID
						if (!isNaN(Number(term))) orFilters.unshift({ id: Number(term) }); // add id filter at the start
						return { OR: orFilters };
					}),
				},
				// A search term still combines with the hierarchy filter - unlike status/user/dept,
				// which a search term deliberately supersedes (matching the behaviour this was
				// extracted from). Hiding sub-tasks while searching is what someone toggling that
				// filter expects to keep doing once they start typing.
				hierarchy,
			].filter(Boolean) as Prisma.TaskWhereInput[],
		};
	}

	return undefined;
}

/**
 * Columns the task list may be sorted by. Defined here rather than imported from TaskTable so that
 * client components never have to reach into the tasks page module - doing so pulled the server
 * page (and prisma) into the browser graph and broke the dev build manifest for the route.
 * Kept in sync with the `columns` array in _components/TaskTable.tsx.
 */
export const SORTABLE_TASK_COLUMNS = ["id", "title", "statusId", "source", "createdAt", "dueDate", "completedOn", "assignedToUserId"];

export function buildTaskOrderBy(params: TasksQuery, columnNames: string[] = SORTABLE_TASK_COLUMNS) {
	return params.orderBy && columnNames.includes(params.orderBy) ? { [params.orderBy]: params.sortOrder } : undefined;
}
