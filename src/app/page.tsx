import Link from 'next/link';

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    title: 'Tu restaurante, tu marca',
    desc: 'Espacio propio con tu nombre, logo y URL personalizada. Cero marcas ajenas.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
      </svg>
    ),
    title: 'QR por cada mesa',
    desc: 'Un escaneo y tu cliente ya tiene el menú completo en su celular. Cero apps.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
      </svg>
    ),
    title: 'Pedidos en tiempo real',
    desc: 'Cada orden aparece al instante en tu panel. Confirma, prepara y entrega sin fricciones.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'Cero comisiones',
    desc: 'Sin porcentaje por venta. Tarifa plana o gratis. Tus ganancias son tuyas.',
  },
];

const STEPS = [
  { num: '01', title: 'Regístrate', desc: 'Crea tu cuenta en 10 segundos. Solo nombre, email y contraseña.' },
  { num: '02', title: 'Arma tu menú', desc: 'Agrega categorías, productos con fotos, precios, variantes y extras.' },
  { num: '03', title: 'Genera tus QRs', desc: 'Crea mesas y descarga los QRs. Imprímelos y ponlos en las mesas.' },
  { num: '04', title: 'Recibe pedidos', desc: 'Tus clientes escanean, ordenan y tú ves todo en tu dashboard.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* ─── Nav ─── */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            <span className="text-brand-600">MEN</span>IUS
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
              Entrar
            </Link>
            <Link href="/signup" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-all hover:shadow-lg">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-brand-200/40 to-teal-200/30 blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-brand-100/30 to-emerald-100/20 blur-3xl animate-float-delayed" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-in-up animate-fade-in-up-1 inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium border border-brand-200/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            Usado por restaurantes en LATAM
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-in-up animate-fade-in-up-2 text-[2.75rem] sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-7"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            El menú que tus clientes{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-brand-500 via-teal-400 to-brand-600 bg-clip-text text-transparent animate-gradient">
                piden con un escaneo
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C40 2 80 1 100 3C120 5 160 6.5 199 3" stroke="url(#underline-grad)" strokeWidth="2.5" strokeLinecap="round" />
                <defs><linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0"><stop stopColor="#05c8a7" /><stop offset="1" stopColor="#2dd4bf" /></linearGradient></defs>
              </svg>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-in-up animate-fade-in-up-3 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Digitaliza tu restaurante en minutos. Menú con QR, pedidos en vivo, cero comisiones.
            <span className="text-gray-700 font-medium"> Tus clientes ordenan desde su celular, tú gestionas todo desde un solo lugar.</span>
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up animate-fade-in-up-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-600 text-white font-semibold text-base shadow-xl shadow-brand-600/20 hover:shadow-2xl hover:shadow-brand-600/30 hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Crear mi menú gratis
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/r/demo"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-base hover:bg-white hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
              Ver demo en vivo
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              Setup en 5 min
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              Sin tarjeta de crédito
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              Cancela cuando quieras
            </div>
          </div>
        </div>
      </section>

      {/* ─── Visual: Phone flow ─── */}
      <section className="relative pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">

            {/* Phone 1: Customer scans QR */}
            <div className="relative">
              <div className="w-[220px] sm:w-[250px] rounded-[2.5rem] bg-gray-900 p-2.5 shadow-2xl shadow-gray-900/30">
                <div className="rounded-[2rem] bg-white overflow-hidden">
                  {/* Status bar */}
                  <div className="h-7 bg-gray-50 flex items-center justify-center">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
                  </div>
                  {/* Menu content */}
                  <div className="p-4 space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-xs font-bold text-brand-600 mb-0.5">TAQUERIA EL FOGON</div>
                      <div className="text-[10px] text-gray-400">Mesa 4</div>
                    </div>
                    {/* Category pill */}
                    <div className="flex gap-1.5">
                      <div className="px-2.5 py-1 rounded-full bg-brand-600 text-white text-[9px] font-semibold">Tacos</div>
                      <div className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[9px] font-medium">Bebidas</div>
                      <div className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[9px] font-medium">Postres</div>
                    </div>
                    {/* Items */}
                    {[
                      { name: 'Al Pastor', price: '$45', tag: 'Popular' },
                      { name: 'Suadero', price: '$40', tag: null },
                      { name: 'Campechano', price: '$50', tag: 'Nuevo' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-sm">
                            🌮
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-gray-800">{item.name}</div>
                            {item.tag && (
                              <span className="text-[8px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">{item.tag}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-gray-700">{item.price}</div>
                      </div>
                    ))}
                    {/* Cart button */}
                    <div className="mt-2 bg-brand-600 text-white text-center py-2.5 rounded-xl text-[11px] font-bold shadow-lg shadow-brand-600/20">
                      Ver carrito (3)
                    </div>
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="text-center mt-5">
                <div className="text-sm font-bold text-gray-800">Tu cliente</div>
                <div className="text-xs text-gray-400">Escanea, elige y ordena</div>
              </div>
            </div>

            {/* Arrow / connector */}
            <div className="flex flex-col items-center gap-2 py-2 sm:py-0">
              <div className="hidden sm:flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Al instante</div>
                <svg className="w-16 h-8 text-brand-400" fill="none" viewBox="0 0 64 32">
                  <path d="M4 16h48m0 0l-8-8m8 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="sm:hidden flex items-center gap-1">
                <svg className="w-8 h-12 text-brand-400" fill="none" viewBox="0 0 32 48">
                  <path d="M16 4v32m0 0l-8-8m8 8l8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Al instante</div>
              </div>
            </div>

            {/* Phone 2: Owner sees order */}
            <div className="relative">
              <div className="w-[220px] sm:w-[250px] rounded-[2.5rem] bg-gray-900 p-2.5 shadow-2xl shadow-gray-900/30">
                <div className="rounded-[2rem] bg-white overflow-hidden">
                  {/* Status bar */}
                  <div className="h-7 bg-gray-50 flex items-center justify-center">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
                  </div>
                  {/* Orders content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-gray-800">Ordenes</div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" />
                        </span>
                        <span className="text-[9px] font-bold text-brand-700">Nueva</span>
                      </div>
                    </div>
                    {/* Order cards */}
                    {[
                      { id: '#001', mesa: 'Mesa 4', time: 'Ahora', status: 'Pendiente', statusColor: 'bg-amber-100 text-amber-700', items: '3x Tacos al pastor\n1x Agua mineral' },
                      { id: '#002', mesa: 'Mesa 7', time: '3 min', status: 'Preparando', statusColor: 'bg-violet-100 text-violet-700', items: '1x Hamburguesa\n2x Limonada' },
                      { id: '#003', mesa: 'Mesa 2', time: '8 min', status: 'Lista', statusColor: 'bg-emerald-100 text-emerald-700', items: '2x Pizza margh.' },
                    ].map((order) => (
                      <div key={order.id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-700">{order.id}</span>
                            <span className="text-[9px] text-gray-400">{order.mesa}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${order.statusColor}`}>{order.status}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 whitespace-pre-line leading-relaxed">{order.items}</div>
                        <div className="text-[9px] text-gray-300">{order.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="text-center mt-5">
                <div className="text-sm font-bold text-gray-800">Tu dashboard</div>
                <div className="text-xs text-gray-400">Gestiona todo en un lugar</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Todo lo que necesitas, <span className="text-brand-600">nada que sobre</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Sin curva de aprendizaje. Si puedes usar WhatsApp, puedes usar MENIUS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200/60 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-2 text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              De cero a recibir pedidos en <span className="text-brand-600">4 pasos</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              Literal. No necesitas a nadie de sistemas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-px bg-gradient-to-r from-brand-300 to-brand-100" />
                )}
                <div className="text-4xl font-extrabold text-brand-100 mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {step.num}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-10 sm:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-teal-600/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Deja de perder pedidos.<br />
                <span className="bg-gradient-to-r from-brand-400 to-teal-300 bg-clip-text text-transparent">
                  Empieza a recibirlos.
                </span>
              </h2>
              <p className="text-gray-400 text-lg max-w-lg mx-auto mb-10">
                Crea tu cuenta en segundos y ten tu menú digital listo hoy mismo. Sin costos ocultos, sin contratos.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold text-base hover:bg-brand-50 hover:shadow-xl transition-all"
              >
                Crear mi cuenta gratis
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              <span className="text-brand-600">MEN</span>IUS
            </span>
            <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>Hecho para restaurantes que quieren crecer</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
