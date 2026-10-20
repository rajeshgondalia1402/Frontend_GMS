import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquare,
  Phone,
  Store,
  User,
  Wrench,
} from 'lucide-react'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { ContactCards, PageHero, Section } from '@/components/public'
import { usePageMeta } from '@/hooks/usePageMeta'
import { contactEnquiryEnabled } from '@/config/env'
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
} from '@/lib/publicContact'
import { contactService } from '@/services/contactService'
import { ApiError } from '@/services/httpClient'
import {
  GARAGE_NAME_MAX_LENGTH,
  fullNameRules,
  mobileNumberRules,
  normalizeMobileInput,
  optionalEmailRules,
} from '@/lib/validation'

interface ContactForm {
  name: string
  mobileNumber: string
  email: string
  garageName: string
  subject: string
  message: string
}

const SUBJECTS = [
  { label: 'Starting the free trial', value: 'Starting the free trial' },
  { label: 'Subscription and pricing', value: 'Subscription and pricing' },
  { label: 'A question about a feature', value: 'A question about a feature' },
  { label: 'Trouble signing in', value: 'Trouble signing in' },
  { label: 'Something else', value: 'Something else' },
]

const MESSAGE_MAX_LENGTH = 1000

const messageRules = {
  required: 'Please tell us what you need',
  validate: (value: string) => {
    const text = (value ?? '').trim()
    if (!text) return 'Please tell us what you need'
    if (text.length < 10) return 'A little more detail helps us answer properly'
    if (text.length > MESSAGE_MAX_LENGTH) {
      return `Message must be at most ${MESSAGE_MAX_LENGTH} characters`
    }
    return true
  },
}

const optionalGarageNameRules = {
  validate: (value: string) => {
    const text = (value ?? '').trim()
    if (text.length > GARAGE_NAME_MAX_LENGTH) {
      return `Garage name must be at most ${GARAGE_NAME_MAX_LENGTH} characters`
    }
    return true
  },
}

/** Where a visitor can get an answer immediately, without waiting on a reply. */
const shortcuts = [
  {
    icon: CreditCard,
    title: 'Plans and prices',
    body: 'The three plans, what each one costs and how long it runs.',
    to: '/subscription',
    label: 'Subscription',
  },
  {
    icon: Wrench,
    title: 'What the app does',
    body: 'Every feature that is live today, with the detail behind each one.',
    to: '/features',
    label: 'Features',
  },
  {
    icon: KeyRound,
    title: 'Cannot sign in?',
    body: 'Forgot Password sends a fresh code to your registered mobile number.',
    to: '/forgot-password',
    label: 'Reset password',
  },
]

export function Contact() {
  usePageMeta({
    title: 'Contact Us — GaragePilot',
    description:
      `Questions about GaragePilot, the free trial or a subscription plan? Call ${CONTACT_PHONE_DISPLAY}, email ${CONTACT_EMAIL}, or send us the details of your garage.`,
    type: 'article',
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ContactForm>({
    mode: 'onTouched',
    defaultValues: {
      name: '',
      mobileNumber: '',
      email: '',
      garageName: '',
      subject: SUBJECTS[0].value,
      message: '',
    },
  })

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const mobileField = register('mobileNumber', mobileNumberRules)

  const onSubmit = async (values: ContactForm) => {
    setSending(true)
    setFormError(null)

    const email = values.email.trim()
    const garageName = values.garageName.trim()

    try {
      await contactService.submitContactEnquiry({
        name: values.name.trim(),
        mobileNumber: values.mobileNumber.trim(),
        subject: values.subject,
        message: values.message.trim(),
        // Optional — omitted rather than sent empty, as on the register form.
        ...(email ? { email } : {}),
        ...(garageName ? { garageName } : {}),
      })

      setSent(true)
      reset()
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.fieldErrors) {
          if (field.field in values) {
            setError(field.field as keyof ContactForm, { type: 'server', message: field.message })
          }
        }
        setFormError(error.message)
      } else {
        setFormError(
          error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        )
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHero
        id="contact-title"
        eyebrow="Contact us"
        title="Tell us about"
        highlight="your garage"
        lead="Questions about the free trial, a plan, or whether GaragePilot fits the way you work — call, email or WhatsApp us and we will come back to you."
        className="pb-24 sm:pb-28"
      />

      <section aria-label="Ways to reach us" className="relative z-10 -mt-16 sm:-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ContactCards />
        </div>
      </section>

      <Section labelledBy="contact-form-title">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-primary-900/5 sm:p-8">
            <div aria-hidden="true" className="bg-brand-flame absolute inset-x-0 top-0 h-1" />
            <h2 id="contact-form-title" className="text-xl font-extrabold text-primary-950">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields marked with * are required.
            </p>

            {/* The form has nowhere to post until the API exposes an enquiry
                endpoint, so it says so plainly rather than accepting a message
                and reporting a delivery that never happened. */}
            {!contactEnquiryEnabled && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                />
                <p className="text-sm leading-relaxed text-amber-800">
                  <strong className="font-semibold">Message delivery is being set up.</strong> This
                  form is not connected to our inbox yet, so we have left it switched off rather
                  than tell you a message was sent when it was not. In the meantime, call us on{' '}
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="whitespace-nowrap font-semibold text-amber-900 underline hover:no-underline"
                  >
                    {CONTACT_PHONE_DISPLAY}
                  </a>{' '}
                  or email{' '}
                  <a
                    href={CONTACT_EMAIL_HREF}
                    className="[overflow-wrap:anywhere] font-semibold text-amber-900 underline hover:no-underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  {' '}— or{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-amber-900 underline hover:no-underline"
                  >
                    start the free trial
                  </Link>
                  , which needs nothing from us to begin.
                </p>
              </div>
            )}

            {sent && (
              <div
                role="status"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                />
                <p className="text-sm font-medium text-emerald-800">
                  Thanks — your message has been sent. We will get back to you on the number you
                  gave us.
                </p>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Your Name *"
                  placeholder="Rajesh Patel"
                  autoComplete="name"
                  leftIcon={<User className="h-4 w-4" />}
                  error={errors.name?.message}
                  {...register('name', fullNameRules)}
                />

                <Input
                  label="Mobile Number *"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9876543210"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.mobileNumber?.message}
                  {...mobileField}
                  onChange={(event) => {
                    event.target.value = normalizeMobileInput(event.target.value)
                    void mobileField.onChange(event)
                  }}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  hint="Optional"
                  error={errors.email?.message}
                  {...register('email', optionalEmailRules)}
                />

                <Input
                  label="Garage Name"
                  placeholder="Shree Auto Works"
                  autoComplete="organization"
                  leftIcon={<Store className="h-4 w-4" />}
                  hint="Optional"
                  error={errors.garageName?.message}
                  {...register('garageName', optionalGarageNameRules)}
                />
              </div>

              <Select
                label="What is this about? *"
                options={SUBJECTS}
                leftIcon={<MessageSquare className="h-4 w-4" />}
                error={errors.subject?.message}
                {...register('subject', { required: 'Pick what this is about' })}
              />

              <Textarea
                label="Message *"
                rows={5}
                maxLength={MESSAGE_MAX_LENGTH}
                placeholder="How many vehicles you handle in a month, what you use today, and what you need from us."
                error={errors.message?.message}
                {...register('message', messageRules)}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={sending}
                disabled={!contactEnquiryEnabled}
              >
                {contactEnquiryEnabled ? 'Send Message' : 'Message sending not available yet'}
              </Button>
            </form>
          </div>

          <aside aria-labelledby="shortcuts-title" className="space-y-4">
            <h2 id="shortcuts-title" className="text-xl font-extrabold text-primary-950">
              Answers right now
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Most questions are already answered on the site — no waiting for a reply.
            </p>

            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg"
              >
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-amber-300"
                  >
                    <shortcut.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-primary-950">{shortcut.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{shortcut.body}</p>
                    <Link
                      to={shortcut.to}
                      className="mt-1 inline-block rounded py-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {shortcut.label} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </Section>
    </>
  )
}
