"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef } from "react";
import { useFormState } from "react-dom";
import submitUser from "../../new/submitUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialState = {
	message: null,
};

export default function ImagePicker() {
	const [formState, formAction] = useFormState(submitUser, initialState);
	const fileInput = useRef<HTMLInputElement>(null);

	const handleFileChange = async (event: { preventDefault: () => void }) => {
		event.preventDefault();

		if (fileInput.current && fileInput.current.files && fileInput.current.files.length > 0) {
			const file = fileInput.current.files[0];
			const arrayBuffer = await file.arrayBuffer();

			// Convert ArrayBuffer to Blob
			const blob = new Blob([arrayBuffer], { type: file.type });

			// Create a FormData instance
			const formData = new FormData();

			// Append the Blob to the FormData
			formData.append("avatar", blob, file.name);

			// Append other form data
			// formData.append('field', value);

			formAction(formData);
		}
	};

	return (
		<div>
			<Label htmlFor="avatar">Avatar</Label>
			<div className="flex items-center gap-4">
				<Avatar className="h-12 w-12">
					<AvatarImage alt="Avatar" src="/placeholder-avatar.jpg" />
					<AvatarFallback>JD</AvatarFallback>
				</Avatar>
				<Input name="avatar" type="file" ref={fileInput} accept="image/*" onChange={handleFileChange} />
			</div>
		</div>
	);
}
