import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import Footer from "./_components/Footer";
import Navbar from "./_components/Navbar";
import "./globals.css";
import EmailChecker from "@/components/EmailChecker";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Task Tracker",
	description: "Create, assign and manage tasks with ease.",
	robots: {
		index: false, // Prevent indexing
		follow: false, // Prevent following links
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
				{/* TODO Component to check email ID in local storage and if available check the status */}
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<div className="flex flex-col" style={{ minHeight: "calc(100vh - 0px)" }}>
						<Navbar />
						<EmailChecker />
						<main className="p-3 flex-1">{children}</main>
						<Footer />
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
