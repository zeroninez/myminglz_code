import { Header } from "./Header";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={`w-screen min-h-dvh`}>
        <Header />
        {children}
      </body>
    </html>
  );
};
