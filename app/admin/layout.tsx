import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Medical Devices Marketplace',
  description: 'Admin dashboard for managing the medical devices marketplace',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication and admin role
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get user details and check admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      adminProfile: true
    }
  });

  if (!user || user.userType !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        image: user.profileImage
      }} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}