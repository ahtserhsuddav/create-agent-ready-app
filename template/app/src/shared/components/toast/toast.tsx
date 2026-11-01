// {{#next}}
'use client'

// {{/next}}
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'
import { Button } from '#/shared/components/ui/button'

// Toasts with a title and an optional description, in four status colours (tokens in src/styles.css).
// <Toaster /> from #/shared/components/ui/sonner is mounted once in src/routes/__root.tsx.
const toastVariants = cva('flex w-full gap-3 rounded-2xl px-4 py-3 shadow-lg sm:w-96', {
  variants: {
    variant: {
      success: 'bg-success text-white',
      error: 'bg-destructive text-white',
      warning: 'bg-warning text-black',
      info: 'bg-info text-white',
    },
  },
})

type Variant = NonNullable<VariantProps<typeof toastVariants>['variant']>
type ToastContent = { title: string; description?: string }

const icons = {
  success: CircleCheckIcon,
  error: OctagonXIcon,
  warning: TriangleAlertIcon,
  info: InfoIcon,
} satisfies Record<Variant, unknown>

function show(variant: Variant, { title, description }: ToastContent) {
  const Icon = icons[variant]
  return sonnerToast.custom((id) => (
    <div className={cn(toastVariants({ variant }))}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        className="text-current hover:bg-white/15 hover:text-current"
        onClick={() => sonnerToast.dismiss(id)}
      >
        <XIcon />
      </Button>
    </div>
  ))
}

/** @public */
export const toast = {
  success: (content: ToastContent) => show('success', content),
  error: (content: ToastContent) => show('error', content),
  warning: (content: ToastContent) => show('warning', content),
  info: (content: ToastContent) => show('info', content),
}
