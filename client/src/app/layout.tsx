import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load the Inter font with specific subsets and display settings
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Mahjongg Tools',
  description: 'Mahjong hand analysis and training application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-gray-100">
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-3">
              <h1 className="text-2xl font-bold">Mahjongg Tools</h1>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; {new Date().getFullYear()} Mahjongg Tools. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
