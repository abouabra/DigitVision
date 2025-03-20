import DigitRecognizer from "@/components/digit-recognizer";
import Footer from "@/components/footer";

export default function Home() {
	return (
		<div className="relative min-h-screen w-full">
			<main className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen p-4 md:p-8 bg-transparent">
				<div className="max-w-5xl w-full">
					<div className="text-center mb-12 flex flex-col justify-center items-center">
						<h1 className="w-fit text-4xl md:text-6xl font-bold text-center mb-3 h-[4.1rem] bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
							Digit Vision
						</h1>
						<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
							Interactive Neural Network Digit Recognition and Visualization
						</p>
					</div>

					<DigitRecognizer />
				</div>
			</main>
			<Footer />
		</div>
	);
}
