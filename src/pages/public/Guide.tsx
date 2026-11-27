import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Share2,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { CtaBand, FaqList, PageHero, Reveal, Section, SectionHeading, type FaqItem } from '@/components/public'
import { PhoneFrame } from '@/components/guide/GuideMock'
import { GUIDE_CHAPTERS, GUIDE_STEP_MS } from '@/components/guide/guideChapters'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------ helpers */

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Long enough to read the caption — or to hear it read out. */
function stepDuration(ms: number | undefined, say: string, speaking: boolean) {
  const base = ms ?? GUIDE_STEP_MS
  if (!speaking) return base
  return Math.max(base, say.split(/\s+/).length * 420 + 1500)
}

function guideUrl(chapterId?: string) {
  const url = new URL('/guide', window.location.origin)
  if (chapterId) url.searchParams.set('c', chapterId)
  return url.toString()
}

/* -------------------------------------------------------------- content */

const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ClipboardCheck,
    title: 'No more paper register',
    text: 'Every customer, vehicle and job card is saved. Search by name, mobile or number plate in a second.',
  },
  {
    icon: Wallet,
    title: 'Know who still has to pay',
    text: 'Unpaid and part-paid job cards are marked clearly, so no money is forgotten.',
  },
  {
    icon: MessageCircle,
    title: 'Receipts on WhatsApp',
    text: 'The customer gets the payment receipt on WhatsApp — it looks professional and saves paper.',
  },
  {
    icon: BarChart3,
    title: 'Earnings in one tap',
    text: 'See this month’s revenue and download it as Excel or a PDF with your garage name.',
  },
  {
    icon: Smartphone,
    title: 'Works on your phone',
    text: 'Use it at the counter on your mobile, or on a computer in the office — same account.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe and private',
    text: 'Your account is verified with your mobile number. Only you can see your garage data.',
  },
]

const FAQ: FaqItem[] = [
  {
    question: 'Do I need to pay to start?',
    answer: 'No. Every new garage gets a 30-day free trial. No card or payment is needed to register.',
  },
  {
    question: 'Can I use it on my mobile?',
    answer: 'Yes. GaragePilot works in the browser of any smartphone, tablet or computer. Nothing to install.',
  },
  {
    question: 'What if the customer has no vehicle with them today?',
    answer: 'Tap “Save, add vehicle later” while adding the customer. You can add the vehicle any time from their page.',
  },
  {
    question: 'The customer paid only half. What do I do?',
    answer:
      'Tap Collect, choose Half (or type the amount) and tap Receive. The job card shows Partial until the rest is paid.',
  },
  {
    question: 'I forgot my password.',
    answer: (
      <>
        Tap <b>Forgot Password?</b> on the{' '}
        <Link to="/login" className="font-semibold text-primary-600 underline">
          login page
        </Link>
        , verify your mobile number and set a new password.
      </>
    ),
  },
  {
    question: 'Who do I call for help?',
    answer: (
      <>
        Our team is happy to help — see the{' '}
        <Link to="/contact" className="font-semibold text-primary-600 underline">
          Contact Us
        </Link>{' '}
        page for phone, WhatsApp and email.
      </>
    ),
  },
]

/* ---------------------------------------------------------------- page */

/**
 * The public "how to use" page — an animated, step-by-step tour of the app
 * that an admin can send to a new garage owner. Each chapter is a short
 * clip played on a drawn phone, with a plain caption under it, and it can be
 * read out loud. `/guide?c=payment` opens straight at one chapter.
 */
export function Guide() {
  usePageMeta({
    title: 'How to use GaragePilot — step-by-step guide',
    description:
      'A short animated guide for garage owners: register, log in, add customers and vehicles, create job cards, collect payments and download reports.',
  })

  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const startAt = Math.max(
    0,
    GUIDE_CHAPTERS.findIndex((c) => c.id === params.get('c')),
  )

  const [chapter, setChapter] = useState(startAt)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  /** Bumped to replay the current clip from its start. */
  const [run, setRun] = useState(0)
  const [watched, setWatched] = useState<Set<string>>(() => new Set())
  const playerRef = useRef<HTMLDivElement>(null)
  const lessonsRef = useRef<HTMLElement>(null)

  const current = GUIDE_CHAPTERS[chapter]
  const currentStep = current.steps[step]
  const duration = stepDuration(currentStep.ms, currentStep.say, speaking)
  const isLast = chapter === GUIDE_CHAPTERS.length - 1 && step === current.steps.length - 1

  const goTo = useCallback((c: number, s = 0) => {
    setChapter(c)
    setStep(s)
    setRun((r) => r + 1)
  }, [])

  const next = useCallback(() => {
    if (step < current.steps.length - 1) {
      goTo(chapter, step + 1)
      return
    }
    setWatched((w) => new Set(w).add(current.id))
    if (chapter < GUIDE_CHAPTERS.length - 1) goTo(chapter + 1, 0)
    else setPlaying(false)
  }, [chapter, current, goTo, step])

  const prev = () => {
    if (step > 0) goTo(chapter, step - 1)
    else if (chapter > 0) goTo(chapter - 1, GUIDE_CHAPTERS[chapter - 1].steps.length - 1)
    else goTo(0, 0)
  }

  // On a phone the lessons are a sideways strip — keep the open one in view
  // (sideways only, so the page itself never jumps).
  useEffect(() => {
    const strip = lessonsRef.current
    const item = strip?.querySelectorAll('li')[chapter]
    if (!strip || !item || strip.scrollWidth <= strip.clientWidth) return
    strip.scrollTo({ left: item.offsetLeft - 16, behavior: 'smooth' })
  }, [chapter])

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(next, duration)
    return () => window.clearTimeout(t)
  }, [playing, duration, next, run])

  // Keep the link in the address bar pointing at the open chapter.
  useEffect(() => {
    if (params.get('c') === current.id) return
    const p = new URLSearchParams(params)
    p.set('c', current.id)
    setParams(p, { replace: true, preventScrollReset: true })
  }, [current.id, params, setParams])

  // Read the caption out loud.
  useEffect(() => {
    if (!canSpeak()) return
    window.speechSynthesis.cancel()
    if (!speaking) return
    const u = new SpeechSynthesisUtterance(currentStep.say)
    u.lang = 'en-IN'
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }, [speaking, currentStep, run])

  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel()
  }, [])

  const watchTour = (from = 0) => {
    goTo(from, 0)
    setPlaying(true)
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const share = async () => {
    const url = guideUrl()
    const text = 'GaragePilot — watch this short guide to start using your garage app'
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GaragePilot guide', text, url })
        return
      } catch {
        /* closed the share sheet — fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast('Guide link copied', 'success')
    } catch {
      toast(url, 'info')
    }
  }

  const copyChapter = async () => {
    try {
      await navigator.clipboard.writeText(guideUrl(current.id))
      toast(`Link to “${current.title}” copied`, 'success')
    } catch {
      toast(guideUrl(current.id), 'info')
    }
  }

  const whatsappHref = useMemo(
    () =>
      `https://wa.me/?text=${encodeURIComponent(
        `GaragePilot — watch this short guide to start using your garage app: ${typeof window === 'undefined' ? '' : guideUrl()}`,
      )}`,
    [],
  )

  const Icon = current.icon

  return (
    <>
      <PageHero
        id="guide-title"
        eyebrow="Step-by-step guide"
        title="How to use"
        highlight="GaragePilot"
        lead="Watch short animated clips that show every step — from creating your account to collecting payment. No training needed."
      >
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="accent" leftIcon={<Play className="h-5 w-5" />} onClick={() => watchTour(0)}>
            Watch the full tour
          </Button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
          >
            <MessageCircle className="h-5 w-5" /> Share on WhatsApp
          </a>
        </div>
        <p className="mt-4 text-sm text-blue-100/70">
          {GUIDE_CHAPTERS.length} short lessons · about {Math.round(
            GUIDE_CHAPTERS.reduce((t, c) => t + c.steps.reduce((s, st) => s + (st.ms ?? GUIDE_STEP_MS), 0), 0) / 60000,
          )}{' '}
          minutes
        </p>
      </PageHero>

      {/* ------------------------------------------------------- the player */}
      <Section id="tour" labelledBy="tour-title">
        <div ref={playerRef} className="scroll-mt-24">
          <SectionHeading
            id="tour-title"
            eyebrow="Watch & learn"
            title="Pick a lesson or press play"
            lead="Each lesson plays by itself. Pause any time, or tap Next to go at your own speed."
          />

          {/* Lessons — chips on a phone, a list on a computer. */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[17rem_1fr]">
            <nav ref={lessonsRef} aria-label="Lessons" className="relative -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
              <ol className="flex gap-2 lg:flex-col">
                {GUIDE_CHAPTERS.map((c, i) => {
                  const active = i === chapter
                  const done = watched.has(c.id)
                  const CIcon = c.icon
                  return (
                    <li key={c.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => goTo(i, 0)}
                        aria-current={active ? 'step' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                          active
                            ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/50',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                            active ? 'bg-white/20' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {done && !active ? <CheckCircle2 className="h-4 w-4" /> : <CIcon className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className={cn('block text-[11px] font-semibold', active ? 'text-blue-100' : 'text-slate-400')}>
                            Lesson {i + 1}
                          </span>
                          <span className="block whitespace-nowrap text-sm font-bold lg:whitespace-normal">{c.title}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </nav>

            <div className="grid items-start gap-6 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-primary-50/40 p-4 sm:p-6 md:grid-cols-[minmax(0,320px)_1fr] md:gap-8">
              {/* The clip */}
              <div>
                <PhoneFrame>
                  <div key={`${chapter}-${step}-${run}`} className="h-full">
                    {currentStep.screen()}
                  </div>
                </PhoneFrame>
                <div className="mx-auto mt-4 h-1.5 max-w-[320px] overflow-hidden rounded-full bg-slate-200">
                  <div
                    key={`bar-${chapter}-${step}-${run}-${playing}`}
                    className={cn('h-full rounded-full bg-accent-500', playing ? 'g-bar' : 'w-full scale-x-0')}
                    style={{ '--g-duration': `${duration}ms` } as CSSProperties}
                  />
                </div>
              </div>

              {/* The caption and controls */}
              <div className="flex flex-col md:min-h-[560px]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent-600">
                  <Icon className="h-4 w-4" />
                  Lesson {chapter + 1} · {current.title}
                </div>
                <p className="mt-1 text-sm text-slate-500">{current.blurb}</p>

                <div key={`cap-${chapter}-${step}`} className="g-in mt-5">
                  <p className="text-xs font-semibold text-slate-400">
                    Step {step + 1} of {current.steps.length}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold leading-snug text-primary-950 sm:text-2xl">
                    {currentStep.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-700">{currentStep.say}</p>
                </div>

                {/* Step dots */}
                <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Steps in this lesson">
                  {current.steps.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      role="tab"
                      aria-selected={i === step}
                      aria-label={`Step ${i + 1}: ${s.title}`}
                      onClick={() => goTo(chapter, i)}
                      className={cn(
                        'h-2.5 rounded-full transition-all',
                        i === step ? 'w-8 bg-primary-600' : i < step ? 'w-2.5 bg-primary-300' : 'w-2.5 bg-slate-300',
                      )}
                    />
                  ))}
                </div>

                <div className="mt-auto space-y-3 pt-8">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                    <Button variant="outline" onClick={prev} aria-label="Previous step" disabled={chapter === 0 && step === 0}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (playing) {
                          setPlaying(false)
                          return
                        }
                        // Resuming replays the clip, so the picture and the
                        // progress bar start together again.
                        if (isLast) goTo(0, 0)
                        else setRun((r) => r + 1)
                        setPlaying(true)
                      }}
                      leftIcon={playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    >
                      {playing ? 'Pause' : isLast ? 'Play again' : 'Play'}
                    </Button>
                    <Button variant="outline" onClick={next} aria-label="Next step" disabled={isLast}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setRun((r) => r + 1)}>
                      Replay
                    </Button>
                    {canSpeak() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-pressed={speaking}
                        leftIcon={speaking ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        onClick={() => setSpeaking((s) => !s)}
                      >
                        {speaking ? 'Reading aloud' : 'Read aloud'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={copyChapter}>
                      Copy lesson link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------- the benefits */}
      <Section tone="tinted" labelledBy="benefits-title">
        <SectionHeading
          id="benefits-title"
          eyebrow="Why garages use it"
          title="What GaragePilot does"
          highlight="for you"
          lead="Less writing, fewer phone calls, and you always know where your money is."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <b.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-primary-950">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------- the day, short */}
      <Section labelledBy="daily-title">
        <SectionHeading
          id="daily-title"
          eyebrow="Remember this"
          title="Your daily work in 4 steps"
          lead="When a vehicle comes in, this is all you do."
        />
        <ol className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Add customer', 'Name and mobile number', 'customer'],
            ['Add vehicle', 'Number plate and work needed', 'vehicle'],
            ['Create job card', 'Jobs and prices — total adds itself', 'jobcard'],
            ['Collect payment', 'Tap Collect, then Receive', 'payment'],
          ].map(([title, text, id], i) => (
            <Reveal key={id} as="li" delay={i * 100}>
              <button
                type="button"
                onClick={() => watchTour(GUIDE_CHAPTERS.findIndex((c) => c.id === id))}
                className="group h-full w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-primary-300"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-base font-bold text-primary-950">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:underline">
                  <Play className="h-3.5 w-3.5" /> Watch
                </p>
              </button>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ---------------------------------------------------------- answers */}
      <Section tone="tinted" labelledBy="faq-title">
        <SectionHeading id="faq-title" eyebrow="Questions" title="Common questions" />
        <div className="mx-auto mt-8 max-w-3xl">
          <FaqList items={FAQ} />
        </div>
        <div className="mt-8 flex justify-center">
          <Button variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={share}>
            Share this guide
          </Button>
        </div>
      </Section>

      <CtaBand title="Ready? Start your free trial" />
    </>
  )
}
