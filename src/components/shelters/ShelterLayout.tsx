import type { ReactNode } from 'react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
export default function ShelterLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background-light font-display text-text-light dark:bg-background-dark dark:text-text-dark">
    <Header /><main className="container mx-auto min-h-[60vh] px-4 py-8">{children}</main><Footer />
  </div>;
}
