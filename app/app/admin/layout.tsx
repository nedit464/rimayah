import { AdminShell } from '@/components/layout/AdminShell'

export const metadata = {
  title: 'Admin Panel - Sa\'ad Al-Furusiyah',
  description: 'Sistem Manajemen Keuangan Sa\'ad Al-Furusiyah',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
