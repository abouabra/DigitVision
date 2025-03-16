"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Download, Sparkles } from "lucide-react";
import ProbabilityChart from "@/components/probability-chart";
import { initOnnxSession, predictDigit } from "@/app/predict";

export default function DigitRecognizer() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [prediction, setPrediction] = useState<number | null>(null);
	const [probabilities, setProbabilities] = useState<number[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isAnalysing, setIsAnalysing] = useState(true);
	const [hasDrawn, setHasDrawn] = useState(false);

	// Initialize canvas
	useEffect(() => {
		if (canvasRef.current) {
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				// Set black background
				ctx.fillStyle = "#000";
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				// Set white drawing
				ctx.lineWidth = 15;
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				ctx.strokeStyle = "white";
			}
		}

		// Initialize ONNX session when component mounts
		initOnnxSession()
			.catch(console.error)
			.finally(() => {
				setIsLoading(false);
				setIsAnalysing(false);
			});

	}, []);

	// Drawing functions
	const startDrawing = (
		e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
	) => {
		setIsDrawing(true);
		setHasDrawn(true);

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const rect = canvas.getBoundingClientRect();
		let clientX, clientY;

		if ("touches" in e) {
			// Touch event
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			// Mouse event
			clientX = e.clientX;
			clientY = e.clientY;
		}

		// Calculate the scaling factors between canvas dimensions and display dimensions
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		// Apply scaling to get the correct canvas coordinates
		const x = (clientX - rect.left) * scaleX;
		const y = (clientY - rect.top) * scaleY;

		ctx.beginPath();
		ctx.moveTo(x, y);
	};

	const draw = (
		e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
	) => {
		if (!isDrawing) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const rect = canvas.getBoundingClientRect();
		let clientX, clientY;

		if ("touches" in e) {
			// Touch event
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			// Mouse event
			clientX = e.clientX;
			clientY = e.clientY;
		}

		// Calculate the scaling factors between canvas dimensions and display dimensions
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		// Apply scaling to get the correct canvas coordinates
		const x = (clientX - rect.left) * scaleX;
		const y = (clientY - rect.top) * scaleY;

		ctx.lineTo(x, y);
		// make the stroke size double
		ctx.lineWidth = 30;
		ctx.stroke();
	};

	const endDrawing = () => {
		setIsDrawing(false);
		if (hasDrawn) {
			makePrediction();
		}
	};

	// Clear canvas
	const clearCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Reset to black background
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		setPrediction(null);
		setProbabilities([]);
		setHasDrawn(false);
	};

	// Save canvas as image
	const saveCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dataURL = canvas.toDataURL("image/png");
		const link = document.createElement("a");
		link.download = "digit-drawing.png";
		link.href = dataURL;
		link.click();
	};

	const makePrediction = async () => {
		setIsAnalysing(true);

		const canvas = canvasRef.current;
		if (!canvas) return;

		try {
			const { prediction, probs } = await predictDigit(canvas);

			setPrediction(prediction);
			setProbabilities(probs);
		} catch (error) {
			console.error("Prediction failed:", error);
		} finally {
			setIsAnalysing(false);
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[700px]">
			<Card className="overflow-hidden border-neutral-800 bg-neutral-900/60 backdrop-blur-sm lg:col-span-3">
				<CardContent className="p-6">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold text-white">
							Draw a digit (0-9)
						</h2>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={saveCanvas}
								disabled={!hasDrawn}
								className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
								aria-label="Save drawing">
								<Download className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={clearCanvas}
								className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
								aria-label="Clear canvas">
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
					<div className="relative rounded-lg border border-neutral-700 overflow-hidden">
						<canvas
							ref={canvasRef}
							width={420}
							height={420}
							className="touch-none w-full h-auto cursor-crosshair"
							onMouseDown={startDrawing}
							onMouseMove={draw}
							onMouseUp={endDrawing}
							//onMouseLeave={endDrawing}
							onTouchStart={startDrawing}
							onTouchMove={draw}
							onTouchEnd={endDrawing}
						/>
						{isAnalysing && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
								<div className="flex flex-col items-center">
									<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-3"></div>
									<p className="text-cyan-400 font-medium">
										{isLoading ? "Loading..." : "Analyzing..." }
									</p>
								</div>
							</div>
						)}
						{!hasDrawn && !isAnalysing && (
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<p className="text-neutral-500 font-medium">
									Draw a digit here
								</p>
							</div>
						)}
					</div>
					<div className="mt-4 text-sm text-neutral-400">
						Use your mouse or finger to draw a single digit (0-9) in the canvas
						above
					</div>
				</CardContent>
			</Card>

			<Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-sm lg:col-span-2">
				<CardContent className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Sparkles className="h-5 w-5 text-cyan-500" />
						<h2 className="text-xl font-semibold text-white">AI Prediction</h2>
					</div>

					{prediction !== null ? (
						<div className="space-y-6">
							<div className="flex items-center justify-center py-6">
								<div className="text-8xl md:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
									{prediction}
								</div>
							</div>
							<div>
								<h3 className="text-sm font-medium mb-3 text-neutral-300">
									Confidence Levels
								</h3>
								<ProbabilityChart probabilities={probabilities} />
							</div>
						</div>
					) : (
						<div className="h-[280px] flex items-center justify-center text-neutral-500">
							Draw a digit to see the prediction
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
