"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { CirclePauseIcon, Rotate3DIcon, InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Point = {
    x: number;
    y: number;
    z: number;
    label: number;
};

// Color palette for more distinct colors
const COLORS = [
    "#FF3B30", // Red
    "#34C759", // Green
    "#007AFF", // Blue
    "#FF9500", // Orange
    "#AF52DE", // Purple
    "#00C7BE", // Teal
    "#FFCC00", // Yellow
    "#FF2D55", // Pink
    "#5856D6", // Indigo
    "#8E8E93", // Gray
];

function PointCloud({ points }: { points: Point[] }) {
    // Create geometry
    const geometry = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());

    useEffect(() => {
        if (!points.length) return;

        // Create positions array
        const positions = new Float32Array(points.length * 3);
        const colors = new Float32Array(points.length * 3);
        const colorObj = new THREE.Color();

        points.forEach((point, i) => {
            // Set positions
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;

            // Set colors
            colorObj.set(COLORS[point.label % COLORS.length]);
            colors[i * 3] = colorObj.r;
            colors[i * 3 + 1] = colorObj.g;
            colors[i * 3 + 2] = colorObj.b;
        });

        geometry.current.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );
        geometry.current.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
        );
        geometry.current.computeBoundingSphere();
    }, [points]);

    return (
        <points geometry={geometry.current}>
            <pointsMaterial
                size={0.15}
                vertexColors
                sizeAttenuation
                transparent
                opacity={0.8}
            />
        </points>
    );
}

// Fixed Controls component that properly handles rotation toggle
function Controls({ autoRotate }: { autoRotate: boolean }) {
    const controlsRef = useRef<any>(null);
    
    // Apply auto-rotation setting whenever it changes
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotate;
        }
    }, [autoRotate]);
    
    // Update controls on each frame
    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.update();
        }
    });

    return (
        <OrbitControls 
            ref={controlsRef} 
            makeDefault 
            autoRotate={autoRotate} 
            autoRotateSpeed={1}
        />
    );
}

export default function Tsne3D() {
    const [data, setData] = useState<Point[]>([]);
    const [processedData, setProcessedData] = useState<Point[]>([]);
    const [autoRotate, setAutoRotate] = useState(true);
    const [uniqueLabels, setUniqueLabels] = useState<number[]>([]);

    // Process the data to limit points per label
    useEffect(() => {
        if (!data.length) return;

        const pointsPerLabel = 1000;
        const labelGroups: Record<number, Point[]> = {};

        // Group points by label
        data.forEach((point) => {
            if (!labelGroups[point.label]) {
                labelGroups[point.label] = [];
            }
            labelGroups[point.label].push(point);
        });

        // Store unique labels for the legend
        setUniqueLabels(Object.keys(labelGroups).map(Number).sort((a, b) => a - b));

        // Get subset of points for each label
        const result: Point[] = [];
        Object.entries(labelGroups).forEach(([label, points]) => {
            const selectedPoints =
                points.length <= pointsPerLabel
                    ? points
                    : points.sort(() => 0.5 - Math.random()).slice(0, pointsPerLabel);
            result.push(...selectedPoints);
        });

        setProcessedData(result);
    }, [data]);

    useEffect(() => {
        fetch("/tsne_data.json")
            .then((res) => res.json())
            .then((data) => setData(data));
    }, []);

    return (
        <div className="relative w-full h-full">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 50]} fov={50} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                {processedData.length > 0 && <PointCloud points={processedData} />}
                <Controls autoRotate={autoRotate} />
            </Canvas>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute top-4 right-4 flex border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm p-2 rounded-2xl items-center justify-center shadow-lg cursor-pointer hover:bg-neutral-700/70 transition-colors">
                            <InfoIcon className="size-5" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-md p-4 bg-neutral-900/95 border-neutral-800 text-white backdrop-blur-md">
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg">3D t-SNE Brain Visualization</h3>
                            <p>
                                This 3D visualization uses t-SNE to simplify complex features from the convolutional layer of my MNIST CNN. Each colored dot represents a pattern, and dots with the same color are grouped together because they represent the same digit.                            </p>
                            <div className="pt-2">
                                <h4 className="font-medium mb-2">Controls:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>• <span className="font-medium">Rotate:</span> Click and drag to rotate the visualization</li>
                                    <li>• <span className="font-medium">Zoom:</span> Use mouse wheel or pinch gesture</li>
                                    <li>• <span className="font-medium">Pan:</span> Right-click and drag</li>
                                    <li>• <span className="font-medium">Auto-rotation:</span> Toggle with the button at bottom right</li>
                                </ul>
                            </div>
                            <div className="pt-2">
                                <h4 className="font-medium mb-2">Color Legend:</h4>
                                <p className="text-sm">The colored dots at the bottom left show which label corresponds to each color.</p>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <button
                className="absolute bottom-4 right-4 flex border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm p-2 rounded-2xl items-center justify-center gap-3 shadow-lg cursor-pointer hover:bg-neutral-700/70 transition-colors"
                onClick={() => setAutoRotate(!autoRotate)}>
                {autoRotate ? (
                    <div className="flex justify-center items-center gap-2">
                        <CirclePauseIcon className="size-4" />
                        <span className="text-sm">Stop Rotation</span>
                    </div>
                ) : (
                    <div className="flex justify-center items-center gap-2">
                        <Rotate3DIcon className="size-4" />
                        <span className="text-sm">Start Rotation</span>
                    </div>
                )}
            </button>
            <div className="absolute bottom-4 left-4 flex border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm p-2 rounded-2xl items-center justify-center gap-3 shadow-lg">
                {uniqueLabels.map((label, i) => (
                    <div
                        key={i}
                        className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:scale-150 transition-transform"
                        style={{ backgroundColor: COLORS[label % COLORS.length] }}>
                        <span className="text-xs text-white font-bold">{label}</span>
                    </div>
                ))}
            </div>
            
        </div>
    );
}