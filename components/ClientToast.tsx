"use client";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";

function ClientToast({ status, message, emailId }: { status?: "success" | "fail"; message?: string; emailId?: string }) {
	useEffect(() => {
		// Set a timeout to delay the toast display
		const timer = setTimeout(() => {
			if (status === "success") {
				toast.info(message);
				if (emailId) localStorage.setItem("emailId", emailId); // Save the email id in local storage to check the status in EmailChecker.tsx
			} else if (status === "fail") toast.error(message);
		}, 500); // 500ms delay

		return () => clearTimeout(timer);
	}, [status, message]);

	return <Toaster richColors />;
}

export default ClientToast;
