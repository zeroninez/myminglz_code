export const SafeArea = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex flex-col items-center justify-between min-h-dvh p-24">
      <div className="z-10 items-center justify-between w-full max-w-5xl font-mono text-sm checking lg:flex">
        {children}
      </div>
    </main>
  );
};
