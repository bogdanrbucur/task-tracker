"use client";
import { useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";

export default function EmailChecker() {
	const emailIdRef = useRef<string | null>(null);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		emailIdRef.current = localStorage.getItem("emailId");
		const handleStorageChange = () => (emailIdRef.current = localStorage.getItem("emailId"));

		// Listen for storage changes
		window.addEventListener("storage", handleStorageChange);

		// Polling logic
		const interval = setInterval(() => {
			(async () => {
				const currentEmailId = localStorage.getItem("emailId"); // Check localStorage directly
				if (!currentEmailId) return;

				try {
					const res = await fetch(`/api/emailStatus?id=${currentEmailId}`);
					if (!res.ok) return;
					const data = await res.json();

					if (!isMountedRef.current) return;

					if (data?.status === "sent") {
						// Defer the toast to the next macrotask to avoid setState-in-render
						setTimeout(() => toast.success("Email successfully sent."), 0);
						localStorage.removeItem("emailId");
						emailIdRef.current = null;
					} else if (data?.status === "failed") {
						setTimeout(() => toast.error("Failed to send email."), 0);
						localStorage.removeItem("emailId");
						emailIdRef.current = null;
					}
				} catch (err) {
					// optional: handle/log errors
				}
			})();
		}, 2500);

		// Cleanup the event listener and interval on component unmount
		return () => {
			isMountedRef.current = false;
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(interval); // Clear the interval
		};
	}, []); // Empty dependency array to run effect only on mount

	// Toaster is mounted globally in `app/layout.tsx` via `GlobalToaster`.
	// This component only runs the polling/effect and triggers toasts via `toast`.
	return null;
}
