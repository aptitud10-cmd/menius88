import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Admin header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            <span className="text-red-500">MENIUS</span> <span className="text-gray-500 text-sm font-normal">Admin</span>
          </Link>
          <nav className="flex items-center gap-1 ml-6">
            <Link href="/admin" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              Restaurantes
            </Link>
            <Link href="/admin/users" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              Usuarios
            </Link>
            <Link href="/admin/metrics" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              Métricas
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user.email}</span>
          <Link href="/app" className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
