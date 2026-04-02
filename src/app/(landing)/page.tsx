'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2240] to-[#162d50] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center font-bold text-[#0a1628] text-lg">
            T
          </div>
          <span className="text-xl font-semibold tracking-tight">TariffAU</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-blue-200 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
          Australian Tariff
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Classification System
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          The definitive platform for Australian customs compliance. Search tariff codes,
          calculate duties under every FTA, and check permits and prohibited goods — all in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-lg font-semibold transition-colors shadow-lg shadow-blue-500/25"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 border border-slate-500 hover:border-slate-300 rounded-lg text-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Search */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Search</h3>
            <p className="text-slate-400 leading-relaxed">
              Browse 7,600+ tariff classification codes with full descriptions, duty rates,
              statistical codes, and linked TCO references. Instant search across the entire
              Australian Customs Tariff.
            </p>
          </div>

          {/* Calculate */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Calculate</h3>
            <p className="text-slate-400 leading-relaxed">
              Compare duty rates across 16 Free Trade Agreements side by side.
              Calculate landed cost with GST, exchange rates, and transport
              for any country of origin.
            </p>
          </div>

          {/* Comply */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Comply</h3>
            <p className="text-slate-400 leading-relaxed">
              Check permits, prohibited and restricted goods, biosecurity requirements,
              rules of origin, anti-dumping duties, and AQIS approved establishments.
              Stay compliant with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl py-8 px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">7,600+</div>
              <div className="text-sm text-slate-400 mt-1">Tariff Codes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">16</div>
              <div className="text-sm text-slate-400 mt-1">FTA Agreements</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">246</div>
              <div className="text-sm text-slate-400 mt-1">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400">Real-time</div>
              <div className="text-sm text-slate-400 mt-1">Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center">
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Powered by data from the Australian Border Force. This tool is provided for
          reference purposes only and does not constitute legal or professional customs advice.
        </p>
        <p className="text-xs text-slate-600 mt-3">
          &copy; {new Date().getFullYear()} TariffAU. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
