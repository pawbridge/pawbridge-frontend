import type { ReactNode } from 'react';
export default function ShelterLayout({ children }: { children: ReactNode }) {
  return <main className="container mx-auto min-h-[60vh] flex-1 px-4 py-8">{children}</main>;
}
