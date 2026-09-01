import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Input } from './Input'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  /** The padlock, unless the caller wants a mark of its own. */
  leftIcon?: ReactNode
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ leftIcon = <Lock className="h-4 w-4" />, ...props }, ref) => {
    const [show, setShow] = useState(false)
    return (
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        leftIcon={leftIcon}
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:text-slate-600"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
