interface BillingToggleProps {
  isAnnual: boolean
  onChange: (isAnnual: boolean) => void
}

export default function BillingToggle({ isAnnual, onChange }: BillingToggleProps) {
  return (
    <div className="rounded-xl bg-surface-subtle p-0.5">
      <div className="relative grid grid-cols-[1fr_1fr] gap-x-0.5">
        <div
          className="absolute top-0 left-0 h-full w-[calc((100%-2px)/2)] rounded-[10px] bg-primary-background transition-transform duration-500 ease-in-out shadow-[0px_4px_4px_-2px_rgba(24,_39,_75,_0.06),_0px_2px_4px_-2px_rgba(24,_39,_75,_0.02),0px_0px_2px_0px_#E0E0E0]"
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
