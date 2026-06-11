'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Globe2, Music, Rocket, ShieldCheck, Sparkles } from 'lucide-react';

const featureList = [
  {
    title: 'IMVU Music Bot Control',
    description: 'Deploy, configure and manage Arcana Music Bot across virtual rooms with real-time analytics.',
    icon: Music,
  },
  {
    title: 'Immersive Room Payments',
    description: 'Accept subscriptions and microtransactions via PayPal with secure backend validation.',
    icon: CreditCard,
  },
  {
    title: 'Live Metaverse Insights',
    description: 'Track room engagement, audio performance and audience mood from a single dashboard.',
    icon: Globe2,
  },
  {
    title: 'Premium world building',
    description: 'Design experiences for social rooms, events and premium audio environments.',
    icon: Rocket,
  },
];

const pricingPlans = [
  {
    name: 'Launch',
    price: '$29',
    description: 'Core Arcana Music Bot deployment for one IMVU room.',
    bullets: ['Bot setup', 'License manager', 'Basic analytics'],
    highlight: false,
  },
  {
    name: 'Venture',
    price: '$79',
    description: 'Premium orchestration for 3 rooms with PayPal and analytics upgrades.',
    bullets: ['Multi-room deployments', 'PayPal billing', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Realm',
    price: '$149',
    description: 'Enterprise metaverse package for studios and immersive audio experiences.',
    bullets: ['Unlimited rooms', 'Custom experience design', 'Dedicated onboarding'],
    highlight: false,
  },
];

const faqs = [
  {
    question: '¿Arcana Music Bot funciona con IMVU rooms?',
    answer: 'Sí, está diseñado para integrarse con salas IMVU y ofrecer control remoto de playlists, audio y eventos dentro del mundo virtual.',
  },
  {
    question: '¿Puedo probar antes de comprar?',
    answer: 'Claro, inicia el período de prueba gratuito y valida el servicio en tu sala IMVU antes de elegir un plan.',
  },
  {
    question: '¿Cómo se manejan los pagos?',
    answer: 'Los pagos se procesan con PayPal en el backend, garantizando seguridad y separación completa entre frontend y credenciales.',
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-cosmos text-white">
      <div className="star-field" />
      <div className="nebula-glow" />
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="glass-card relative overflow-hidden rounded-[2rem] border border-white/10 px-8 py-12 shadow-glow sm:px-12 sm:py-16"
        >
          <div className="absolute -left-20 top-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-6 top-20 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_0.6fr]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-white/5 px-4 py-2 text-sm font-medium uppercase tracking-[0.28em] text-cyan-200">
                <Sparkles className="h-4 w-4 text-cyan-300" /> New launch
              </span>
              <h1 className="mt-8 text-5xl font-black tracking-tight text-white md:text-6xl lg:text-7xl font-orbitron">
                Building Immersive Virtual Worlds
              </h1>
              <p className="mt-6 max-w-xl text-slate-300 sm:text-lg">
                Arcana Realm Studios presenta Arcana Music Bot, la plataforma premium para gestionar audio, monetización y experiencias inmersivas dentro de salas IMVU.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#trial"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:bg-cyan-300"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300"
                >
                  View Plans
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Launch-ready', value: 'IMVU Rooms' },
                  { label: 'Premium UX', value: 'Glassmorphism' },
                  { label: 'Secure', value: 'PayPal backend' },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[#8b5cf6]/20 via-transparent to-[#22d3ee]/10 blur-3xl" />
              <div className="relative z-10 rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-xl">
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Arcana Music Bot</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Your room, powered by immersive audio.</h2>
                <p className="mt-4 text-slate-300">Automate playlists, monetize experiences and launch premium virtual concert spaces inside IMVU.</p>
                <div className="mt-8 grid gap-4">
                  {['Dynamic theme sync', 'PayPal subscriptions', 'Event-based audio flows'].map((text) => (
                    <div key={text} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                        <Rocket className="h-5 w-5" />
                      </span>
                      <span className="text-sm text-slate-200">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-10 sm:pb-28" id="features">
        <div className="mb-12 flex flex-col gap-4 text-center">
          <span className="mx-auto inline-flex rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-200">
            Futuristic SaaS for the metaverse
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl font-orbitron">Features crafted for modern virtual experiences</h2>
          <p className="mx-auto max-w-2xl text-slate-300">A premium toolkit to manage audio, spaces, monetization and analytics across IMVU rooms with elegant motion and secure payments.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featureList.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="glass-card rounded-[2rem] border-white/10 p-8"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20" id="pricing">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Pricing</p>
          <h2 className="mt-4 text-4xl font-bold text-white font-orbitron">Plans for every realm-builder</h2>
          <p className="mt-4 mx-auto max-w-2xl text-slate-300">Elige el plan que mejor se adapte a tu estudio, desde lanzamiento rápido hasta experiencias ilimitadas.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`glass-card relative overflow-hidden rounded-[2rem] border-white/10 p-8 ${plan.highlight ? 'border-cyan-300/30 bg-[#0c1330]/95' : ''}`}
            >
              {plan.highlight && <div className="absolute -top-4 right-4 rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">Most popular</div>}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 text-5xl font-bold tracking-tight text-white">{plan.price}<span className="text-base font-medium text-slate-400">/mo</span></p>
              <p className="mt-4 text-slate-300">{plan.description}</p>
              <ul className="mt-8 space-y-3 text-sm text-slate-300">
                {plan.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <ShieldCheck className="mt-1 h-4 w-4 text-cyan-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="#trial"
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${plan.highlight ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'border border-white/10 bg-white/5 text-white hover:border-cyan-300'}`}
              >
                Choose {plan.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20" id="trial">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
          className="glass-card rounded-[2rem] border border-white/10 p-10 text-center"
        >
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-cyan-200 shadow-glow">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Free trial</p>
          <h2 className="mt-4 text-4xl font-bold text-white font-orbitron">Launch your Arcana experience today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Prueba el Arcana Music Bot completamente gratis y comienza a monetizar tus salas IMVU con un flujo premium de audio y pagos seguros.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="#contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#pricing" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300">
              Explore Plans
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-20" id="faq">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">FAQ</p>
          <h2 className="mt-4 text-4xl font-bold text-white font-orbitron">Frequently asked questions</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {faqs.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-[1.8rem] border border-white/10 p-7"
            >
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-4 text-slate-300 leading-7">{item.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24" id="contact">
        <div className="glass-card rounded-[2rem] border border-white/10 p-10 sm:p-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Contact</p>
              <h2 className="mt-4 text-4xl font-bold text-white font-orbitron">Ready to build your realm?</h2>
              <p className="mt-4 max-w-xl text-slate-300">Habla con el equipo de Arcana Realm Studios y transforma tus salas IMVU en experiencias musicales premium con pagos integrados.</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-400">Email</p>
                <p className="mt-2 text-lg font-semibold text-white">hello@arcanarealm.studio</p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm text-slate-400">Discord</p>
                <p className="mt-2 text-lg font-semibold text-white">discord.gg/arcanarealm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Arcana Realm Studios</p>
            <p className="mt-3 max-w-xl text-sm text-slate-500">Premium metaverse SaaS for music and virtual world creators.</p>
          </div>
          <p className="text-sm text-slate-500">© 2026 Arcana Realm Studios. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
