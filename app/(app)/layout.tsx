import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="page-container">
      <Navbar teacherName={session.teacherName} teacherId={session.teacherId} />
      <main>{children}</main>
    </div>
  );
}
