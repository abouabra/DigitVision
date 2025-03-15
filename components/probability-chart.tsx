"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProbabilityChartProps {
	probabilities: number[];
}

export default function ProbabilityChart({
	probabilities,
}: ProbabilityChartProps) {
	// Format probabilities as percentages
	const percentages = probabilities.map((p) => Math.round(p * 100));

	// Find the highest probability for highlighting
	const maxProb = Math.max(...percentages);

	return (
		<div className="space-y-2.5">
			{percentages.map((percentage, index) => (
				<div key={index} className="grid grid-cols-12 gap-2 items-center">
					<div
						className={cn(
							"col-span-1 font-medium text-sm",
							percentage === maxProb ? "text-cyan-500" : "text-neutral-400"
						)}>
						{index}
					</div>
					<div className="col-span-9">
						<Progress
							value={percentage}
							className={cn(
								"h-2 bg-neutral-800",
								// percentage === maxProb
								// 	? "bg-gradient-to-r from-cyan-500 to-purple-600"
								// 	: ""
							)}
							indicatorClassName={cn(
								percentage === maxProb
									? "bg-gradient-to-r from-cyan-500 to-purple-600"
									: "bg-neutral-500"
							)}
						/>
					</div>
					<div
						className={cn(
							"col-span-2 text-sm text-right",
							percentage === maxProb ? "text-cyan-500" : "text-neutral-400"
						)}>
						{percentage}%
					</div>
				</div>
			))}
		</div>
	);
}
