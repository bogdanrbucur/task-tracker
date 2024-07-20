"use client";
import { DatePicker } from "@/app/(protected)/tasks/new/_components/DatePicker";
import { UserExtended } from "@/app/users/_actions/getUserById";
import { UsersSelection } from "@/components/UsersSelection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucia";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import submitTask from "../../new/_actions/submitTask";

const initialState = {
	message: null,
};

const TaskForm = ({ users, user, task }: { users: UserExtended[]; user: User; task?: any }) => {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [formState, formAction] = useFormState(submitTask, initialState);

	return (
		<Card className="container mx-auto max-w-4xl px-4 md:px-6">
			<div className="container mx-auto max-w-4xl px-4 py-6">
				<h1 className="mb-8 text-3xl font-bold">{task ? "Edit Task" : "New Task"}</h1>
				<form className="space-y-4 md:space-y-6" action={formAction}>
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input name="title" placeholder="Enter task title" defaultValue={task ? task.title : undefined} required />
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea name="description" rows={8} placeholder="Enter task description" defaultValue={task ? task.description : undefined} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex md:justify-start">
							<div className="flex flex-col space-y-3 w-60">
								<Label htmlFor="dueDate">Due Date</Label>
								<DatePicker onChange={setSelectedDate} defaultDate={task?.dueDate} />
								<input type="hidden" name="dueDate" value={selectedDate?.toISOString() ?? ""} />
							</div>
						</div>
						<div className="flex md:justify-end">
							<div className="flex flex-col space-y-3 w-60">
								<Label className="text-left" htmlFor="assignedUser">
									Assigned To
								</Label>
								<UsersSelection users={users} onChange={setSelectedUserId} defaultUser={task?.assignedToUser} />
								{/* Hidden input fields ensures formData is submitted */}
								<input type="hidden" name="assignedToUserId" value={selectedUserId ?? ""} />
							</div>
						</div>
					</div>
					{formState?.message && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Task could not be created</AlertTitle>
							<AlertDescription>{formState?.message}</AlertDescription>
						</Alert>
					)}
					<div className="flex justify-between">
						<div className="flex justify-center md:justify-end">
							<Button asChild>
								<Link href={`/tasks/${task?.id ? task.id : "?status=1%2C5%2C2"}`}>Cancel</Link>
							</Button>
						</div>
						<div className="flex justify-center md:justify-end">
							<Button type="submit">{task ? "Save Task" : "Create Task"}</Button>
						</div>
					</div>
					{task && <input type="hidden" name="taskId" value={task.id} />}
					<input type="hidden" name="editingUser" value={user.id} />
				</form>
			</div>
		</Card>
	);
};

export default TaskForm;
