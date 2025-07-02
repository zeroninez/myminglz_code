import React, { ReactNode } from "react";

export function SafeArea({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center w-screen min-h-dvh">
      {children}
    </div>
  );
}
