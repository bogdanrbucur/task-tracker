import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import Navbar from "./_components/Navbar";
import "./globals.css";

import { cn } from "@/lib/utils";
import Footer from "./_components/Footer";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Task Tracker",
	description: "Create, assign and manage tasks with ease.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<div className="flex flex-col" style={{ minHeight: "calc(100vh - 0px)" }}>
						<Navbar />
						<main className="p-3 flex-1">{children}</main>
						<Footer />
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
