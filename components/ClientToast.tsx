"use client";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";

function ClientToast({ status, message }: { status?: "success" | "fail"; message?: string }) {
	useEffect(() => {
		// Set a timeout to delay the toast display
		const timer = setTimeout(() => {
			if (status === "success") toast.success(message);
			else if (status === "fail") toast.error(message);
		}, 500); // 500ms delay

		return () => {
			clearTimeout(timer);
		};
	}, [status, message]);

	return <Toaster richColors />;
}

export default ClientToast;
