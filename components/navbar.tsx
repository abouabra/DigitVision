"use client";
import { cn } from "@/lib/utils";
import { BrainIcon, BrushIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavBar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Draw", href: "/", icon: BrushIcon },
    { name: "3D Visualization", href: "/visualization", icon: BrainIcon },
  ];

  return (
    <div className="flex justify-center w-full p-4">
      <nav className="flex border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm p-1.5 rounded-2xl items-center justify-center gap-3 shadow-lg">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href}>
              <button
                className={cn("flex cursor-pointer border px-4 py-2 rounded-xl items-center justify-center gap-2 transition-all duration-200",
                  isActive
                    ? "border-cyan-600/60 bg-cyan-900/20 text-cyan-400" 
                    : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 text-neutral-300 hover:text-white"
                )}
              >
                <item.icon className={`size-4 ${isActive ? "text-cyan-400" : ""}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default NavBar;