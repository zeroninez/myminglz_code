import { Header } from "./Header";

export const Layout = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => {
  return (
    <html lang="en">
      <body className={`w-screen min-h-dvh`}>
        <Header title={title} />
        {children}
      </body>
    </html>
  );
};
