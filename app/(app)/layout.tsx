import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="page-container">
      <Sidebar teacherName={session.teacherName} teacherId={session.teacherId} isAdmin={session.isAdmin} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
