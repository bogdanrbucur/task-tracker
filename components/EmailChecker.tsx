"use client";
import { useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";

export default function EmailChecker() {
	const emailIdRef = useRef<string | null>(localStorage.getItem("emailId"));

	useEffect(() => {
		const handleStorageChange = () => emailIdRef.current = localStorage.getItem("emailId");

		// Listen for storage changes
		window.addEventListener("storage", handleStorageChange);

		// Polling logic
		const interval = setInterval(async () => {
			const currentEmailId = localStorage.getItem("emailId"); // Check localStorage directly
			if (currentEmailId) {
				const res = await fetch(`/api/emailStatus?id=${currentEmailId}`);
				const data = await res.json();

				if (data.status === "sent") {
					toast.success(`Email sent successfully.`);
					localStorage.removeItem("emailId");
					emailIdRef.current = null; // Clear emailId from ref
				}
        
        else if (data.status === "failed") {
					toast.error(`Failed to send email.`);
					localStorage.removeItem("emailId");
					emailIdRef.current = null; // Clear emailId from ref
				}
			}
		}, 5000);

		// Cleanup the event listener and interval on component unmount
		return () => {
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(interval); // Clear the interval
		};
	}, []); // Empty dependency array to run effect only on mount

	return <Toaster position="bottom-right" richColors />;
}
