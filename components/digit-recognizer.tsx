"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Sparkles, PenLine, X, Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react"
import ProbabilityChart from "@/components/probability-chart"
import { initOnnxSession, predictDigit, visualizeActivation } from "@/app/predict"
import ActivationVisualizer from "@/components/activation-visualizer"
import { Slider } from "@/components/ui/slider"

export default function DigitRecognizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [prediction, setPrediction] = useState<number | null>(null)
  const [probabilities, setProbabilities] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalysing, setIsAnalysing] = useState(true)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [activations, setActivations] = useState<Record<string, { data: Float32Array; dims: number[] }> | null>(null)
  // Update the modal state to include channel index and layer information
  const [modalImage, setModalImage] = useState<{
    src: string
    title: string
    channelIndex: number
    layerName: string | null
    totalChannels: number
  } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Set black background
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Set white drawing
        ctx.lineWidth = 15
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "white"
      }
    }

    // Initialize ONNX session when component mounts
    initOnnxSession()
      .catch(console.error)
      .finally(() => {
        setIsLoading(false)
        setIsAnalysing(false)
      })

    // Add event listener for modal
    const handleClickOutside = (e: MouseEvent) => {
      if (modalImage && e.target instanceof HTMLElement) {
        // Check if the click is on the modal background (not on the modal content)
        if (e.target.classList.contains("modal-background")) {
          setModalImage(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [modalImage])

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setHasDrawn(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    // Calculate the scaling factors between canvas dimensions and display dimensions
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Apply scaling to get the correct canvas coordinates
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    // Calculate the scaling factors between canvas dimensions and display dimensions
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Apply scaling to get the correct canvas coordinates
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    ctx.lineTo(x, y)
    // make the stroke size double
    ctx.lineWidth = 30
    ctx.stroke()
  }

  const endDrawing = () => {
    setIsDrawing(false)
    if (hasDrawn) {
      makePrediction()
    }
  }

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Reset to black background
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setPrediction(null)
    setProbabilities([])
    setActivations(null)
    setHasDrawn(false)
  }

  const makePrediction = async () => {
    setIsAnalysing(true)

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const result = await predictDigit(canvas)

      setPrediction(result.prediction)
      setProbabilities(result.probs)
      setActivations(result.activations)
    } catch (error) {
      console.error("Prediction failed:", error)
    } finally {
      setIsAnalysing(false)
    }
  }

  // Update the handleActivationClick function to accept more parameters
  const handleActivationClick = (
    src: string,
    title: string,
    channelIndex: number,
    layerName: string,
    totalChannels: number,
  ) => {
    setModalImage({
      src,
      title,
      channelIndex,
      layerName,
      totalChannels,
    })
    setZoomLevel(1) // Reset zoom level
  }

  // Add a function to navigate between channels in the modal
  const navigateModalChannel = (direction: "prev" | "next") => {
    if (!modalImage || !activations || !modalImage.layerName) return

    const { channelIndex, layerName, totalChannels } = modalImage
    let newIndex: number

    if (direction === "prev") {
      newIndex = channelIndex === 0 ? totalChannels - 1 : channelIndex - 1
    } else {
      newIndex = channelIndex === totalChannels - 1 ? 0 : channelIndex + 1
    }

    // Get the activation data for the layer
    const layerData = activations[layerName]
    if (!layerData) return

    // Create a temporary canvas to generate the new image
    const tempCanvas = document.createElement("canvas")
    visualizeActivation(layerData, tempCanvas, newIndex)
    const newSrc = tempCanvas.toDataURL("image/png")

    // Update the modal with the new image
    setModalImage({
      ...modalImage,
      src: newSrc,
      channelIndex: newIndex,
      title: `${layerName.replace(/_/g, " ")} - Channel ${newIndex}`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="overflow-hidden border-neutral-800 bg-neutral-900/60 backdrop-blur-sm lg:col-span-3">
          <CardHeader className="px-4 border-b border-neutral-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              <div className="flex items-center">
                <PenLine className="h-5 w-5 mr-2 text-cyan-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
                  Draw a Digit
                </span>
              </div>
            </CardTitle>
            <div className="text-sm text-neutral-400">Draw a single digit (0-9) on the canvas</div>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="relative rounded-lg border border-neutral-700 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={420}
                height={420}
                className="touch-none w-full h-auto cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
              />
              {isAnalysing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-3"></div>
                    <p className="text-cyan-400 font-medium">{isLoading ? "Loading model..." : "Analyzing..."}</p>
                  </div>
                </div>
              )}
              {!hasDrawn && !isAnalysing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-neutral-500 font-medium">Draw a digit here</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={clearCanvas}
                className="border-neutral-700 bg-neutral-800 hover:bg-red-500/70 text-neutral-200 cursor-pointer transition-colors duration-200"
                aria-label="Clear canvas"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="px-4 border-b border-neutral-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-cyan-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
                  AI Prediction
                </span>
              </div>
            </CardTitle>
            <div className="text-sm text-neutral-400">Model's classification result</div>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            {prediction !== null ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="text-8xl md:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
                    {prediction}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-3 text-neutral-300">Confidence Levels</h3>
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

      {prediction !== null && activations && (
        <ActivationVisualizer activations={activations} onImageClick={handleActivationClick} />
      )}

      {/* Full-screen modal for zoomed image */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 modal-background">
          <div className="fixed inset-0 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-700">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-white">{modalImage?.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoomLevel(1)}
                  className="h-8 w-8 border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setModalImage(null)}
                  className="h-8 w-8 border-neutral-700 bg-neutral-800 hover:bg-red-900/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
              {/* Left navigation button */}
              {modalImage && modalImage.totalChannels > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateModalChannel("prev")}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              <div
                className="relative transition-all duration-200 ease-in-out"
                style={{
                  width: `${Math.min(100, 20 * zoomLevel)}%`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              >
                <img
                  src={modalImage?.src || "/placeholder.svg"}
                  alt={modalImage?.title || ""}
                  className="w-full h-auto object-contain border border-neutral-700 rounded-lg pixelated"
                />
              </div>

              {/* Right navigation button */}
              {modalImage && modalImage.totalChannels > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateModalChannel("next")}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 h-12 w-12 rounded-full border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>

            <div className="p-4 bg-neutral-900 border-t border-neutral-700">
              <div className="flex items-center gap-4 max-w-3xl mx-auto">
                <Minimize2 className="h-5 w-5 text-neutral-400" />
                <Slider
                  value={[zoomLevel]}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  className="flex-1"
                />
                <Maximize2 className="h-5 w-5 text-neutral-400" />
                <span className="text-sm text-neutral-400 w-16 text-right">{Math.round(zoomLevel * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

