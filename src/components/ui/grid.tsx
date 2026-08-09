// Modified from: https://ui.aceternity.com/components/grid-and-dot-backgrounds

import { cn } from "@/lib/utils";

export function Grid() {
  return (
    <div className="relative flex h-full min-h-screen w-full items-center justify-center bg-[#fafafa] dark:bg-[#000000]">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#ebebeb_1px,transparent_1px),linear-gradient(to_bottom,#ebebeb_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)]",
        )}
      />
    </div>
  );
}
