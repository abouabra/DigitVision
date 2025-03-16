"use client";

import * as onnx from "onnxruntime-web"

// Global session to avoid reloading the model
let session: onnx.InferenceSession | null = null;

export async function initOnnxSession(
	modelUrl: string = "/model.onnx"
): Promise<boolean> {
	if (!session) {
		try {
			session = await onnx.InferenceSession.create(modelUrl);
			console.log("ONNX session initialized successfully");
			return true;
		} catch (error) {
			console.error("Failed to initialize ONNX session:", error);
			return false;
		}
	}
	return true;
}

export function preprocessCanvasForOnnx(
	canvas: HTMLCanvasElement
): Float32Array {
	const tempCanvas = document.createElement("canvas");
	const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

	if (!tempCtx) {
		throw new Error("Could not get 2D context for preprocessing canvas");
	}

	tempCanvas.width = 28;
	tempCanvas.height = 28;

	// Use nearest-neighbor interpolation for sharper digit shapes
	tempCtx.imageSmoothingEnabled = false;

	tempCtx.fillStyle = "#000000";
	tempCtx.fillRect(0, 0, 28, 28);

	tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 28, 28);

	const imageData = tempCtx.getImageData(0, 0, 28, 28);
	const { data } = imageData;

	const inputTensor = new Float32Array(28 * 28);

	for (let i = 0; i < 28 * 28; i++) {
		const pixelIndex = i * 4; // 4 channels: R, G, B, A, we multiply by 4 to get the index of the first channel which is R
		inputTensor[i] = data[pixelIndex] / 255.0; // Normalize to [0,1]
	}

	return inputTensor;
}

interface PredictionResult {
	prediction: number;
	probs: number[];
}

function softmax(arr: number[]): number[] {
	const max = Math.max(...arr);
	const expValues = arr.map((val) => Math.exp(val - max)); // Subtract max for numerical stability
	const expSum = expValues.reduce((sum, val) => sum + val, 0);
	return expValues.map((val) => val / expSum);
}

export async function predictDigit( canvas: HTMLCanvasElement ): Promise<PredictionResult> {
	try {
		const sessionReady = await initOnnxSession();
		if (!sessionReady || !session) {
			throw new Error("ONNX session not initialized");
		}

		const inputTensor = preprocessCanvasForOnnx(canvas);

		const inputShape: number[] = [1, 1, 28, 28]; // MNIST expects [batch, channels, height, width]
		const input = new onnx.Tensor("float32", inputTensor, inputShape);

		const feeds: Record<string, onnx.Tensor> = { input: input };
		const results = await session.run(feeds);

		const outputTensor = results.output.data as Float32Array;

		const probabilities = softmax(Array.from(outputTensor));

		const prediction = probabilities.indexOf(Math.max(...probabilities));

		return {
			prediction,
			probs: probabilities,
		};
	} catch (error) {
		console.error("Error during prediction:", error);
		throw error;
	}
}
