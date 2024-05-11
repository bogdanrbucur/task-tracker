"use client";
import React, { useState } from "react";
import submitTask from "./new/submitTask";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/DatePicker";
import { UsersSelection } from "@/components/UsersSelection";
import { Button } from "@/components/ui/button";
import { getAuth } from "@/app/_auth/actions/get-auth";
import { User } from "lucia";
import { useFormState } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export type SelectionUser = {
	id: string;
	firstName: string;
	lastName: string | null;
	department: {
		id: number;
		name: string;
	} | null;
};

const initialState = {
	message: null,
};

const taskForm = ({ users, user }: { users: SelectionUser[]; user: User }) => {
	const [state, formAction] = useFormState(submitTask, initialState);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const handleSubmit = (event: any) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		formData.append("assignedToUserId", selectedUserId ?? "");
		formData.append("dueDate", selectedDate?.toISOString() ?? "");
		formData.append("createdByUserId", user.id);

		// Invoke the server side function to add new task
		formAction(formData);
	};

	return (
		<div className="container mx-auto max-w-2xl px-4 py-12">
			<h1 className="mb-8 text-3xl font-bold">New Task</h1>
			<form className="space-y-6" onSubmit={handleSubmit}>
				<div className="space-y-2">
					<label className="text-sm font-medium" htmlFor="title">
						Title
					</label>
					<Input name="title" placeholder="Enter task title" />
				</div>
				<div className="space-y-2">
					<label className="text-sm font-medium" htmlFor="description">
						Description
					</label>
					<Textarea name="description" placeholder="Enter task description" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-2">
						<label className="text-sm font-medium" htmlFor="dueDate">
							Due Date
						</label>
						<div>
							<DatePicker onChange={setSelectedDate} />
						</div>
					</div>
					<div className="flex md:justify-end">
						<div className="flex flex-col space-y-3">
							<label className="text-sm font-medium text-left" htmlFor="assignedUser">
								Assigned To
							</label>
							<UsersSelection users={users} onChange={setSelectedUserId} />
						</div>
					</div>
				</div>
				{state?.message && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Task could not be created</AlertTitle>
						<AlertDescription>{state?.message}</AlertDescription>
					</Alert>
				)}
				<div className="flex justify-center md:justify-end">
					<Button type="submit">Create Task</Button>
				</div>
			</form>
		</div>
	);
};

export default taskForm;
