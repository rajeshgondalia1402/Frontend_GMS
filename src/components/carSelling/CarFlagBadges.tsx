import { AlertTriangle, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui'
import { insuranceDateLabel, isInsuranceExpired } from '@/lib/carSelling'
import type { CarSellingRecord } from '@/types/carSelling'

interface CarFlagBadgesProps {
  car: Pick<CarSellingRecord, 'insurance' | 'insuranceDate' | 'puc' | 'isAccidental'>
  /** Adds "till 20-May-2027" to the insurance badge — for cards, not the table. */
  showInsuranceDate?: boolean
  className?: string
}

/**
 * The papers and the accident history, read at a glance: a tick or a cross
 * for each paper, and a warning only when the car has been in an accident.
 * Insurance whose valid-till date has passed reads as expired, whatever the
 * checkbox says.
 */
export function CarFlagBadges({ car, showInsuranceDate, className = '' }: CarFlagBadgesProps) {
  const paper = (label: string, valid: boolean) => (
    <Badge tone={valid ? 'success' : 'neutral'}>
      {valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </Badge>
  )

  const insuranceTill = insuranceDateLabel(car.insuranceDate)
  const insuranceExpired = car.insurance && isInsuranceExpired(car.insuranceDate)

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {insuranceExpired ? (
        <Badge tone="warning">
          <AlertTriangle className="h-3 w-3" />
          Insurance expired{showInsuranceDate && insuranceTill ? ` ${insuranceTill}` : ''}
        </Badge>
      ) : (
        paper(
          car.insurance && showInsuranceDate && insuranceTill
            ? `Insurance till ${insuranceTill}`
            : 'Insurance',
          car.insurance,
        )
      )}
      {paper('PUC', car.puc)}
      {car.isAccidental ? (
        <Badge tone="danger">
          <AlertTriangle className="h-3 w-3" />
          Accidental
        </Badge>
      ) : (
        <Badge tone="info">Non-accidental</Badge>
      )}
    </div>
  )
}
