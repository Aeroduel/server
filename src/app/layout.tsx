"use client";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <head>
        <title>Aeroduel Server</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="title" content="Aeroduel Server" />
        <meta name="description" content="Aeroduel match hosting server" />
      </head>
      <html lang="en">
      <body
        className="antialiased flex min-h-screen w-full flex-col p-4 items-center justify-center bg-img"
      >
        {children}
      </body>
      </html>
    </>
  );
}
