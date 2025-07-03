import React, { ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh">
      {children}
    </div>
  );
}
