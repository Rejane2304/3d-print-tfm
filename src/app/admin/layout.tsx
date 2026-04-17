import type { ReactNode } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function Layout({ children }: { readonly children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
