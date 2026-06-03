import "./globals.css";

export const metadata = {
  title: "You're Invited — Kompot Road Trip",
  description: "A 2-day road trip invitation to Kompot Province. Join us for an unforgettable adventure — just $15/person covers dinner & house rent.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500&family=Lora:ital,wght@0,400;1,400&family=Syne:wght@700;800&family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
