import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Medical Devices Marketplace',
  description: 'Admin dashboard for managing the medical devices marketplace',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        {children}
      </div>
    </div>
  );
}