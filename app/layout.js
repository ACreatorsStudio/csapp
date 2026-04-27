export const metadata = {
  title: "Creators Studio",
  description: "AI Content System for Creators & Brands",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#f0f0f0" }}>
        {children}
      </body>
    </html>
  );
}
