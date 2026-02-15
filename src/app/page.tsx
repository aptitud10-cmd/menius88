import Link from 'next/link';

/* ─── Icon components (thin line style) ─── */
const IconQR = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
  </svg>
);

const IconBolt = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const IconShield = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconChart = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const ArrowRight = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/* ─── Data ─── */

const FEATURES = [
  {
    icon: <IconQR />,
    title: 'Menu digital con QR',
    desc: 'Cada mesa tiene su codigo. Tu cliente escanea y accede al menu completo desde su celular. Sin apps, sin esperas.',
  },
  {
    icon: <IconBolt />,
    title: 'Pedidos en tiempo real',
    desc: 'Las ordenes llegan al instante a tu panel. Confirma, prepara y entrega con un flujo visual tipo kanban.',
  },
  {
    icon: <IconShield />,
    title: 'Tu marca, tu control',
    desc: 'URL personalizada, tu nombre, tus precios. Sin logos de terceros. Sin comisiones por venta.',
  },
  {
    icon: <IconChart />,
    title: 'Panel completo',
    desc: 'Categorias, productos, variantes, extras, mesas y ordenes. Todo desde un dashboard pensado para ti.',
  },
];

const STEPS = [
  { title: 'Crea tu cuenta', desc: 'Registrate en segundos. Solo nombre, email y contrasena. Sin tarjeta.' },
  { title: 'Configura tu menu', desc: 'Agrega categorias, platos, precios, fotos y variantes como quieras.' },
  { title: 'Imprime los QRs', desc: 'Genera codigos QR unicos por mesa. Descarga e imprime en un click.' },
  { title: 'Recibe pedidos', desc: 'Tus clientes ordenan desde su telefono. Tu ves cada orden al instante.' },
];

/* ─── Page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative grain">

      {/* ── Ambient background glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gold-500/[0.04] blur-[120px] animate-glow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gold-400/[0.03] blur-[100px] animate-glow delay-2" />
      </div>

      {/* ══════════════ NAV ══════════════ */}
      <header className="fixed top-0 w-full z-50 bg-charcoal-950/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <Link href="/" className="text-xl font-bold tracking-tight font-display">
            <span className="text-gold-gradient">MEN</span>
            <span className="text-white/90">IUS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-white/50 hover:text-white/80 transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-charcoal-950 hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative z-10 pt-36 sm:pt-44 pb-24 sm:pb-36">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Eyebrow */}
          <div className="animate-fade-up delay-1 inline-flex items-center gap-2.5 mb-10 px-5 py-2 rounded-full border border-gold-500/20 bg-gold-500/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            <span className="text-xs font-medium tracking-wider uppercase text-gold-300/80">
              Plataforma para restaurantes
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-2 font-display text-[2.75rem] sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
            <span className="text-white/95">Transforma la experiencia</span>
            <br />
            <span className="text-gold-gradient">de tu restaurante</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up delay-3 text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-14 leading-relaxed font-light">
            Menu digital elegante. Pedidos desde el celular de tu cliente.
            <span className="text-white/60"> Sin comisiones, sin intermediarios, sin complicaciones.</span>
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 text-charcoal-950 font-semibold text-base shadow-xl shadow-gold-500/15 hover:shadow-2xl hover:shadow-gold-500/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5"
            >
              Crear mi restaurante
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/r/tacos-mexicanos"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 text-white/70 font-medium text-base hover:bg-white/[0.03] hover:border-white/15 hover:text-white/90 transition-all flex items-center justify-center gap-2.5"
            >
              Ver demo en vivo
            </Link>
          </div>

          {/* Trust markers */}
          <div className="animate-fade-up delay-5 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/25 font-medium tracking-wide uppercase">
            <span>Setup en 5 minutos</span>
            <span className="hidden sm:inline text-white/10">|</span>
            <span>Sin tarjeta de credito</span>
            <span className="hidden sm:inline text-white/10">|</span>
            <span>Cancela cuando quieras</span>
          </div>
        </div>
      </section>

      {/* ── Gold divider ── */}
      <div className="gold-divider max-w-xl mx-auto" />

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold-400/60 mb-4">Funcionalidades</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white/90 mb-5">
              Todo lo que necesitas,<br className="hidden sm:inline" />
              <span className="text-gold-gradient"> nada que sobre</span>
            </h2>
            <p className="text-base text-white/35 max-w-lg mx-auto leading-relaxed font-light">
              Herramientas precisas para gestionar tu restaurante. Cada funcion tiene un proposito claro.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-7 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold-500/15 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gold-500/[0.08] text-gold-400 flex items-center justify-center mb-5 group-hover:bg-gold-500/[0.12] transition-colors duration-500">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-white/85 mb-2.5">{f.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gold divider ── */}
      <div className="gold-divider max-w-xl mx-auto" />

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold-400/60 mb-4">Proceso</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white/90 mb-5">
              Cuatro pasos.<br />
              <span className="text-gold-gradient">Cero complicaciones.</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                {/* Step number */}
                <div className="font-display text-6xl font-bold text-gold-500/[0.08] mb-4 leading-none select-none">
                  {String(i + 1).padStart(2, '0')}
                </div>
                {/* Connector dot */}
                <div className="w-2 h-2 rounded-full bg-gold-500/30 mb-5" />
                <h3 className="font-display text-xl font-semibold text-white/85 mb-3">{step.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gold divider ── */}
      <div className="gold-divider max-w-xl mx-auto" />

      {/* ══════════════ SOCIAL PROOF / NUMBERS ══════════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              { number: '5 min', label: 'Para tener tu menu listo' },
              { number: '0%', label: 'De comision por venta' },
              { number: '24/7', label: 'Tu menu siempre disponible' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-4xl sm:text-5xl font-bold text-gold-gradient mb-3">
                  {stat.number}
                </div>
                <p className="text-sm text-white/35 font-light">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.02] p-12 sm:p-20 text-center">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gold-500/[0.06] rounded-full blur-[80px]" />

            <div className="relative">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold-400/60 mb-6">Empieza hoy</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white/90 mb-6 leading-tight">
                Tu restaurante merece<br />
                <span className="text-gold-gradient">una mejor experiencia</span>
              </h2>
              <p className="text-base text-white/35 max-w-md mx-auto mb-10 leading-relaxed font-light">
                Crea tu cuenta en segundos. Configura tu menu hoy y empieza a recibir pedidos digitales manana.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 text-charcoal-950 font-semibold text-base shadow-xl shadow-gold-500/15 hover:shadow-2xl hover:shadow-gold-500/25 hover:-translate-y-0.5 transition-all"
                >
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight font-display">
              <span className="text-gold-gradient">MEN</span>
              <span className="text-white/60">IUS</span>
            </span>
            <span className="text-xs text-white/20">&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-white/20 font-light">
            Hecho para restaurantes que buscan excelencia
          </p>
        </div>
      </footer>
    </div>
  );
}
