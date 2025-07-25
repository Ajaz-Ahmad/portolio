import './globals.css';

export const metadata = {
  title: 'Ajaz Ahmad Portfolio',
  description: 'LLMs, LangChain, Computer Vision Projects',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
