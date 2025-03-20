"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { CirclePauseIcon, Rotate3DIcon } from "lucide-react";

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

function Controls({ autoRotate }: { autoRotate: boolean }) {
	const controlsRef = useRef<any>(null);
	const [userInteracted, setUserInteracted] = useState(false);

	useEffect(() => {
		const handleInteraction = () => setUserInteracted(true);
		window.addEventListener("pointerdown", handleInteraction);
		return () => window.removeEventListener("pointerdown", handleInteraction);
	}, []);

	// Auto-rotation
	useFrame(() => {
		if (controlsRef.current && autoRotate && !userInteracted) {
			controlsRef.current.autoRotate = true;
			controlsRef.current.autoRotateSpeed = 0.5;
			controlsRef.current.update();
		} else if (controlsRef.current) {
			controlsRef.current.autoRotate = false;
		}
	});

	return <OrbitControls ref={controlsRef} makeDefault />;
}

export default function Tsne3D() {
	const [data, setData] = useState<Point[]>([]);
	const [processedData, setProcessedData] = useState<Point[]>([]);
	const [autoRotate, setAutoRotate] = useState(true);

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
				{COLORS.map((color, i) => (
					<div
						key={i}
						className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:scale-150 transition-transform"
						style={{ backgroundColor: color }}>
						<span className="text-sm">l</span>
					</div>
				))}
			</div>
		</div>
	);
}
