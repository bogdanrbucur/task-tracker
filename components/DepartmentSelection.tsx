"use client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Department } from "@prisma/client";
import { useEffect, useState } from "react";

interface Props {
	departments: Department[];
	onChange: (value: number | null) => void;
	defaultDept?: Department;
	disabled?: boolean;
}

export function DepartmentSelection({ departments, onChange, defaultDept, disabled }: Props) {
	const [dept, setDept] = useState<number | null>(defaultDept?.id ?? null);

	// Set the default date as the return from the compoennt, if it is provided
	useEffect(() => {
		if (defaultDept) handleOnChange(defaultDept.id);
	}, [defaultDept]);

	function handleOnChange(user: number | null) {
		setDept(user);
		onChange(user);
	}

	const defaultDeptDisplay = defaultDept ? defaultDept.name : null;

	return (
		<Select onValueChange={(e) => handleOnChange(Number(e))} disabled={disabled}>
			<SelectTrigger className={cn("max-w-prose", !dept && "text-muted-foreground")}>
				<SelectValue placeholder={!dept ? "Select a department" : defaultDeptDisplay} />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{/* <SelectLabel>Department</SelectLabel> */}
					{departments.map((dept) => (
						<SelectItem key={dept.id} value={String(dept.id)}>
							<div className="flex gap-2 items-center">
								<div>{dept.name}</div>
							</div>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
