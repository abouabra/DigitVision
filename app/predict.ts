"use client"
import * as onnx from "onnxruntime-web"

// Global session to avoid reloading the model
let session: onnx.InferenceSession | null = null

// Layer names for activations - must match the export names in Python
const ACTIVATION_LAYERS = [
  "conv1",
  "conv1_bn",
  "conv1_act",
  "conv1_pool",
  "conv2",
  "conv2_bn",
  "conv2_act",
  "conv2_pool",
  "conv3",
  "conv3_bn",
  "conv3_act",
  "features_flat",
]

export async function initOnnxSession(modelUrl = "/model.onnx"): Promise<boolean> {
  if (!session) {
    try {
      console.log("Initializing ONNX session...")

      // Create session with proper options for web environment
      const options: onnx.InferenceSession.SessionOptions = {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      }

      session = await onnx.InferenceSession.create(modelUrl, options)
      console.log("ONNX session initialized successfully")

      // Log input and output names for debugging
      console.log("Input names:", session.inputNames)
      console.log("Output names:", session.outputNames)

      return true
    } catch (error) {
      console.error("Failed to initialize ONNX session:", error)
      return false
    }
  }
  return true
}

export function preprocessCanvasForOnnx(canvas: HTMLCanvasElement): Float32Array {
  const tempCanvas = document.createElement("canvas")
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })
  if (!tempCtx) {
    throw new Error("Could not get 2D context for preprocessing canvas")
  }

  tempCanvas.width = 28
  tempCanvas.height = 28

  // Use nearest-neighbor interpolation for sharper digit shapes
  tempCtx.imageSmoothingEnabled = false
  tempCtx.fillStyle = "#000000"
  tempCtx.fillRect(0, 0, 28, 28)
  tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 28, 28)

  const imageData = tempCtx.getImageData(0, 0, 28, 28)
  const { data } = imageData

  // Create input tensor with correct shape
  const inputTensor = new Float32Array(28 * 28)

  // Convert to single channel grayscale and normalize
  for (let i = 0; i < 28 * 28; i++) {
    const pixelIndex = i * 4 // RGBA
    inputTensor[i] = data[pixelIndex] / 255.0 // Use only R channel, normalized to [0,1]
  }

  return inputTensor
}

interface PredictionResult {
  prediction: number
  probs: number[]
  activations: Record<
    string,
    {
      data: Float32Array
      dims: number[]
    }
  >
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr)
  const expValues = arr.map((val) => Math.exp(val - max)) // Subtract max for numerical stability
  const expSum = expValues.reduce((sum, val) => sum + val, 0)
  return expValues.map((val) => val / expSum)
}

export async function predictDigit(canvas: HTMLCanvasElement): Promise<PredictionResult> {
  try {
    const sessionReady = await initOnnxSession()
    if (!sessionReady || !session) {
      throw new Error("ONNX session not initialized")
    }

    // Preprocess canvas to get input tensor data
    const inputTensorData = preprocessCanvasForOnnx(canvas)

    // Reshape to match the expected input shape [1, 1, 28, 28]
    // (batch_size=1, channels=1, height=28, width=28)
    const inputShape: number[] = [1, 1, 28, 28]
    const inputTensor = new onnx.Tensor("float32", inputTensorData, inputShape)

    // Run inference with the input tensor
    const feeds: Record<string, onnx.Tensor> = {
      input: inputTensor,
    }

    console.log("Running inference...")
    const results = await session.run(feeds)
    console.log("Inference complete")

    // Extract prediction results (logits) from the 'output' tensor
    if (!results.output) {
      throw new Error("Output tensor not found in results")
    }

    const outputTensor = results.output.data as Float32Array
    const probabilities = softmax(Array.from(outputTensor))
    const prediction = probabilities.indexOf(Math.max(...probabilities))

    // Extract activations
    const activations: Record<string, { data: Float32Array; dims: number[] }> = {}

    for (const layerName of ACTIVATION_LAYERS) {
      if (results[layerName]) {
        activations[layerName] = {
          data: results[layerName].data as Float32Array,
          dims: results[layerName].dims,
        }
      }
    }

    return {
      prediction,
      probs: probabilities,
      activations,
    }
  } catch (error) {
    console.error("Error during prediction:", error)
    throw error
  }
}

// Helper function to visualize activation on canvas
export function visualizeActivation(
  activationTensor: { data: Float32Array; dims: number[] },
  canvas: HTMLCanvasElement,
  channelIndex = 0,
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // Extract dimensions
  const dims = activationTensor.dims

  // For convolutional layers: [batch, channels, height, width]
  if (dims.length === 4) {
    const [_, channels, height, width] = dims

    // Ensure valid channel index
    if (channelIndex >= channels) {
      console.error(`Invalid channel index ${channelIndex}, max is ${channels - 1}`)
      return
    }

    // Resize canvas to match the actual dimensions of the activation
    canvas.width = width
    canvas.height = height

    // Extract channel data
    const channelOffset = channelIndex * width * height
    const channelData = activationTensor.data.slice(channelOffset, channelOffset + width * height)

    // Find min/max for normalization
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (let i = 0; i < channelData.length; i++) {
      min = Math.min(min, channelData[i])
      max = Math.max(max, channelData[i])
    }
    const range = max - min || 1

    // Create image data
    const imageData = ctx.createImageData(width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        const pixelValue = Math.floor(((channelData[i] - min) / range) * 255)

        // RGBA
        const idx = i * 4
        imageData.data[idx] = pixelValue // R
        imageData.data[idx + 1] = pixelValue // G
        imageData.data[idx + 2] = pixelValue // B
        imageData.data[idx + 3] = 255 // A
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }
  // For flat features: [batch, features]
  else if (dims.length === 2) {
    const [_, features] = dims
    const featureData = activationTensor.data

    // Find min/max for normalization
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (let i = 0; i < featureData.length; i++) {
      min = Math.min(min, featureData[i])
      max = Math.max(max, featureData[i])
    }
    const range = max - min || 1

    // Create a bar chart visualization
    const width = Math.min(features, 256) // Limit width
    const height = 100
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.fillStyle = "#111111"
    ctx.fillRect(0, 0, width, height)

    // Draw bars
    const barWidth = width / features
    for (let i = 0; i < features; i++) {
      const normalizedValue = (featureData[i] - min) / range
      const barHeight = normalizedValue * height

      // Use color gradient based on activation value
      const hue = 240 * (1 - normalizedValue) // Blue (240) to Red (0)
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`

      ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight)
    }
  }
}

// Get dimensions of activation tensor
export function getActivationDimensions(activationTensor: {
  data: Float32Array
  dims: number[]
}): { width: number; height: number; channels: number } {
  const dims = activationTensor.dims

  if (dims.length === 4) {
    // [batch, channels, height, width]
    const [_, channels, height, width] = dims
    return { width, height, channels }
  } else if (dims.length === 2) {
    // Flatten features [batch, features]
    const [_, features] = dims
    return { width: features, height: 1, channels: 1 }
  }

  return { width: 0, height: 0, channels: 0 }
}

// Create a multi-channel visualization grid for convolutional layers
export function visualizeFeatureMaps(
  activationTensor: { data: Float32Array; dims: number[] },
  containerElement: HTMLElement,
  maxChannels = 16,
): void {
  const { width, height, channels } = getActivationDimensions(activationTensor)

  // Clear container
  containerElement.innerHTML = ""

  // Limit number of channels to display
  const channelsToShow = Math.min(channels, maxChannels)

  // Create canvas for each channel
  for (let c = 0; c < channelsToShow; c++) {
    const canvas = document.createElement("canvas")
    // Don't set fixed width/height to preserve original size
    canvas.style.border = "1px solid #333"
    canvas.style.borderRadius = "4px"
    canvas.style.backgroundColor = "#111"

    const label = document.createElement("div")
    label.textContent = `Ch ${c}`
    label.style.fontSize = "10px"
    label.style.textAlign = "center"
    label.style.color = "#aaa"
    label.style.marginTop = "2px"
    label.style.whiteSpace = "nowrap"
    label.style.overflow = "hidden"
    label.style.textOverflow = "ellipsis"

    const wrapper = document.createElement("div")
    wrapper.style.display = "flex"
    wrapper.style.flexDirection = "column"
    wrapper.style.alignItems = "center"
    wrapper.style.justifyContent = "center"
    wrapper.style.width = "100%"
    wrapper.appendChild(canvas)
    wrapper.appendChild(label)
    containerElement.appendChild(wrapper)

    // Visualize this channel at its original size
    visualizeActivation(activationTensor, canvas, c)
  }

  // Add info about remaining channels if any
  if (channels > maxChannels) {
    const info = document.createElement("div")
    info.textContent = `+${channels - maxChannels} more channels`
    info.style.gridColumn = "1 / -1"
    info.style.textAlign = "center"
    info.style.marginTop = "10px"
    info.style.color = "#aaa"
    containerElement.appendChild(info)
  }
}

