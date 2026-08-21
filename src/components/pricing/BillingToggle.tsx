interface BillingToggleProps {
  isAnnual: boolean
  onChange: (isAnnual: boolean) => void
}

export default function BillingToggle({ isAnnual, onChange }: BillingToggleProps) {
  return (
    <div className="rounded-xl bg-muted p-0.5">
      <div className="relative grid grid-cols-[1fr_1fr] gap-x-0.5">
        <div
          className="absolute top-0 left-0 h-full w-[calc((100%-2px)/2)] rounded-[10px] bg-background shadow-s transition-transform duration-500 ease-in-out"
          style={{ transform: isAnnual ? 'translateX(calc(100% + 2px))' : 'translateX(0)' }}
        />
        <button
          onClick={() => onChange(false)}
          className={`isolate rounded-[10px] px-5 py-2 text-sm transition-colors duration-500 ease-in-out cursor-pointer ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange(true)}
          className={`isolate rounded-[10px] px-5 py-2 text-sm transition-colors duration-500 ease-in-out cursor-pointer ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Annual
        </button>
      </div>
    </div>
  )
}
