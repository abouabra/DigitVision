import DigitRecognizer from "@/components/digit-recognizer";

export default function Home() {
	return (
		<div className="relative min-h-screen w-full">
			{/* Background container that covers the entire page */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 left-0 w-1/3 h-1/3 bg-purple-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
				<div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
				<div className="absolute top-1/2 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
			</div>

			{/* Main content */}
			<main className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen p-4 md:p-8 bg-transparent">
				<div className="max-w-5xl w-full">
					<div className="text-center mb-12">
						<h1 className="text-4xl md:text-6xl font-bold text-center mb-3 h-[4.1rem] bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
							Neural Digit Scanner
						</h1>
						<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
							Draw a digit and watch our AI instantly recognize it with
							precision
						</p>
					</div>

					<DigitRecognizer />

					<footer className="mt-16 text-center text-sm text-muted-foreground pb-8">
						<p>Powered by advanced convolutional neural networks</p>
					</footer>
				</div>
			</main>
		</div>
	);
}
