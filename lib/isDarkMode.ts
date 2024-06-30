import { useEffect, useState } from "react";

export default function useDarkMode() {
	const [isDarkMode, setIsDarkMode] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
			setIsDarkMode(prefersDarkMode);
		}
	}, []);

	return isDarkMode;
}
