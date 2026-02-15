import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 mb-4 font-mono">404</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
        <p className="text-sm text-gray-500 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/app"
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Mi dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
