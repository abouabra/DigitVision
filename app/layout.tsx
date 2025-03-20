import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Digit Recognition - Digit Vision",
	description: "Interactive Neural Network Digit Recognition and Visualization",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					forcedTheme="dark">

          {/* Background */}
					<div className="fixed inset-0 overflow-hidden pointer-events-none">
						<div className="absolute top-0 left-0 w-1/3 h-1/3 bg-purple-500/15 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
						<div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500/15 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
						<div className="absolute top-1/2 right-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl"></div>
					</div>
					
          <NavBar />
					{children}
					<Footer />
				
        </ThemeProvider>
			</body>
		</html>
	);
}
