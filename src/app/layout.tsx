import "./globals.css";
import { ReactNode } from "react";



export const metadata = {
  title: "Weather Dashboard",
  description: "Live sensor data viewer",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">

      <body>

              {children}

      </body>
    </html>
  );
}
