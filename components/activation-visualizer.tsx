"use client"

import { useEffect, useRef, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { visualizeFeatureMaps, getActivationDimensions } from "@/app/predict"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"

// Update the LAYER_DESCRIPTIONS to match the new architecture
const LAYER_DESCRIPTIONS: Record<string, string> = {
  conv1: "First convolutional layer (16 filters, 3x3)",
  conv1_act: "ReLU activation after first conv layer",
  conv1_pool: "Max pooling after first conv (2x2)",
  conv2: "Second convolutional layer (32 filters, 3x3)",
  conv2_act: "ReLU activation after second conv layer",
  conv2_pool: "Max pooling after second conv (2x2)",
  conv3: "Third convolutional layer (64 filters, 3x3)",
  conv3_act: "ReLU activation after third conv layer",
}

// Update the LAYER_GROUPS to be more accurate and remove batch normalization tabs
const LAYER_GROUPS = [
  {
    name: "Convolution Layer 1",
    layers: ["conv1", "conv1_act", "conv1_pool"],
  },
  {
    name: "Convolution Layer 2",
    layers: ["conv2", "conv2_act", "conv2_pool"],
  },
  {
    name: "Convolution Layer 3",
    layers: ["conv3", "conv3_act"],
  },
]

// Update the onImageClick prop type to include the additional parameters
interface ActivationVisualizerProps {
  activations: Record<string, { data: Float32Array; dims: number[] }>
  onImageClick?: (src: string, title: string, channelIndex: number, layerName: string, totalChannels: number) => void
}

export default function ActivationVisualizer({ activations, onImageClick }: ActivationVisualizerProps) {
  const [activeTab, setActiveTab] = useState("Convolution Layer 1")
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Set initial selected layer and handle tab changes
  useEffect(() => {
    // Find the first available layer in the active group
    const activeGroup = LAYER_GROUPS.find((group) => group.name === activeTab)
    if (activeGroup) {
      for (const layer of activeGroup.layers) {
        if (activations[layer]) {
          setSelectedLayer(layer)
          break
        }
      }
    }
  }, [activeTab, activations])

  // Render visualizations when selected layer changes
  useEffect(() => {
    if (!selectedLayer || !containerRef.current || !activations[selectedLayer]) return

    // Clear previous visualizations
    containerRef.current.innerHTML = ""

    // Create visualization with all channels
    visualizeFeatureMaps(activations[selectedLayer], containerRef.current, 999) // Show all channels

    // Add click event to show modal
    const canvases = containerRef.current.querySelectorAll("canvas")
    canvases.forEach((canvas, index) => {
      canvas.classList.add("cursor-pointer")
      canvas.classList.add("hover:ring-2")
      canvas.classList.add("hover:ring-cyan-500/50")
      canvas.classList.add("transition-all")

      // Update the click event handler to pass more information
      // In the useEffect where we add click events to canvases:
      canvas.addEventListener("click", () => {
        const dataUrl = canvas.toDataURL("image/png")
        if (onImageClick && selectedLayer) {
          const { channels } = getActivationDimensions(activations[selectedLayer])
          onImageClick(
            dataUrl,
            `${selectedLayer.replace(/_/g, " ")} - Channel ${index}`,
            index,
            selectedLayer,
            channels,
          )
        }
      })
    })
  }, [selectedLayer, activations, onImageClick])

  // Get dimensions for the selected layer
  const getDimensionsText = () => {
    if (!selectedLayer || !activations[selectedLayer]) return ""

    const { width, height, channels } = getActivationDimensions(activations[selectedLayer])

    if (selectedLayer === "features_flat") {
      return `${width} features`
    }

    return `${width}×${height} × ${channels} channels`
  }

  // Navigate between layers
  const navigateLayer = (direction: "prev" | "next") => {
    if (!selectedLayer) return

    // Get all available layers
    const allLayers = LAYER_GROUPS.flatMap((group) => group.layers.filter((layer) => activations[layer]))

    const currentIndex = allLayers.indexOf(selectedLayer)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === "prev") {
      newIndex = currentIndex === 0 ? allLayers.length - 1 : currentIndex - 1
    } else {
      newIndex = currentIndex === allLayers.length - 1 ? 0 : currentIndex + 1
    }

    // Update active tab if needed
    for (const group of LAYER_GROUPS) {
      if (group.layers.includes(allLayers[newIndex])) {
        if (group.name !== activeTab) {
          setActiveTab(group.name)
        }
        break
      }
    }

    // Set the selected layer after a short delay to ensure tab change is processed
    setTimeout(() => {
      setSelectedLayer(allLayers[newIndex])
    }, 50)
  }

  return (
    <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-sm">
      <CardHeader className="px-4 py-4 border-b border-neutral-800 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          <div className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-cyan-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
              Neural Network Activations
            </span>
          </div>
        </CardTitle>
        <div className="text-sm text-neutral-400">Visualize how the network processes your drawing</div>
      </CardHeader>

      <CardContent className="p-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap h-full bg-neutral-800 border border-neutral-700 rounded-lg p-1 min-h-14 mb-4">
            {LAYER_GROUPS.map((group) => (
              <TabsTrigger
                key={group.name}
                value={group.name}
                className="flex-1 flex p-3 h-full text-base font-medium rounded-md transition-all data-[state=active]:bg-neutral-700 data-[state=active]:text-white data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-neutral-700/30"
              >
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {LAYER_GROUPS.map((group) => (
            <TabsContent key={group.name} value={group.name} className="mt-4">
              <div className="flex w-full gap-3 mb-4">
                {group.layers.map((layer) => (
                  <button
                    key={layer}
                    className={`p-2 w-full rounded-md text-sm text-left transition-colors ${
                      selectedLayer === layer
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/40 text-white"
                        : "bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                    }`}
                    onClick={() => setSelectedLayer(layer)}
                    disabled={!activations[layer]}
                  >
                    <div className="font-medium">{layer.replace(/_/g, " ")}</div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {LAYER_DESCRIPTIONS[layer] || "Layer visualization"}
                    </div>
                  </button>
                ))}
              </div>

              {selectedLayer && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <button
                        onClick={() => navigateLayer("prev")}
                        className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 cursor-pointer mr-4"
                        aria-label="Previous layer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <h3 className="text-lg font-medium text-white min-w-[150px] text-center">
                        {selectedLayer.replace(/_/g, " ")}
                      </h3>

                      <button
                        onClick={() => navigateLayer("next")}
                        className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 cursor-pointer ml-4"
                        aria-label="Next layer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center">
                      <div className="text-sm text-neutral-400 mr-2">{getDimensionsText()}</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <Info className="h-4 w-4 text-neutral-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Click on any activation to see a larger view with zoom controls.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg border border-neutral-700 p-4">
                    <div
                      ref={containerRef}
                      className="min-h-[200px] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 justify-items-center"
                    >
                      <div className="animate-pulse text-neutral-400 col-span-full flex items-center justify-center">
                        Loading visualizations...
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-neutral-400">
                    <p>
                      {selectedLayer === "features_flat"
                        ? "Each bar represents a feature extracted from your drawing. Higher values (taller bars) indicate stronger feature activations."
                        : "Each grid shows a different filter's response to your drawing. Click on any activation to examine it in detail."}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

