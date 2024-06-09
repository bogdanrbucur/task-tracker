import prisma from "@/prisma/client";
import { Editor, NewTask } from "./submitTask";
import { recordTaskHistory } from "../[id]/recordTaskHistory";
import { testEmail } from "@/app/email/email";

// Create a new task in the database
export async function createTask(task: NewTask, editingUser: Editor) {
	const newTask = await prisma.task.create({
		data: {
			title: task.title,
			description: task.description,
			dueDate: task.dueDate,
			assignedToUserId: task.assignedToUserId,
			createdByUserId: task.createdByUserId,
		},
		include: { assignedToUser: true },
	});

	if (!newTask) throw new Error("Task creation failed");

	console.log(`Task ${newTask.id} created successfully`);

	// TODO: Send email notification to the assigned user
	const email = (await testEmail({
		firstName: newTask.assignedToUser!.firstName,
		recipients: newTask.assignedToUser!.email,
		subject: "New Task Assigned",
		emailType: "taskAssigned",
		miscPayload: `${process.env.BASE_URL}/tasks/${newTask.id}`,
	})) as { id: string };

	console.log(`Email ID ${email.id} sent to ${newTask.assignedToUser!.email}`);

	// Record the task creation in the task history
	const newChange = await recordTaskHistory(newTask, editingUser);
	return newTask;
}
