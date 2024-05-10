"use client";
import React, { useState } from "react";
import submitTask from "./new/submitTask";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/DatePicker";
import { UsersSelection } from "@/components/UsersSelection";
import { Button } from "@/components/ui/button";

export type SelectionUser = {
	id: string;
	firstName: string;
	lastName: string | null;
	department: {
		id: number;
		name: string;
	} | null;
};

const taskForm = ({ users }: { users: SelectionUser[] }) => {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);

	const handleSubmit = (event: any) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		formData.append("assignedToUserId", selectedUserId ?? "");
		formData.append("dueDate", selectedDate ?? "");

		// Invoke
		submitTask(formData);
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
				<div className="flex justify-center md:justify-end">
					<Button type="submit">Create Task</Button>
				</div>
			</form>
		</div>
	);
};

export default taskForm;
