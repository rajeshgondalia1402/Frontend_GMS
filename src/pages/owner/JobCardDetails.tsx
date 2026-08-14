import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, User, Car, FileText, RefreshCw } from 'lucide-react'
import { Button, Card, StatusBadge, Modal, useToast } from '@/components/ui'
import { jobCards } from '@/mock/jobcards'
import { formatCurrency } from '@/lib/utils'
import type { JobStatus } from '@/types'

const statusFlow: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
]

export function JobCardDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const job = jobCards.find((j) => j.id === id) ?? jobCards[0]
  const [status, setStatus] = useState<JobStatus>(job.status)
  const [statusModal, setStatusModal] = useState(false)

  const partsTotal = job.parts.reduce((sum, p) => sum + p.price * p.qty, 0)

  return (
    <div>
      <button
        onClick={() => navigate('/app/job-cards')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Job Cards
      </button>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{job.code}</h1>
          <p className="mt-0.5 text-sm text-slate-500">Created {job.date}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Customer + Vehicle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User className="h-4 w-4 text-slate-400" /> Customer
              </div>
              <p className="font-medium text-slate-900">{job.customerName}</p>
              <p className="text-sm text-slate-500">{job.customerMobile}</p>
            </Card>
            <Card>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Car className="h-4 w-4 text-slate-400" /> Vehicle
              </div>
              <p className="font-medium text-slate-900">{job.vehicleName}</p>
              <p className="font-mono text-sm text-slate-500">{job.vehicleNumber}</p>
            </Card>
          </div>

          {/* Services */}
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Service Details</h2>
            <ul className="space-y-2">
              {job.services.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> {s}
                </li>
              ))}
            </ul>
          </Card>

          {/* Parts */}
          {job.parts.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Parts</h2>
              <div className="divide-y divide-slate-100">
                {job.parts.map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700">
                      {p.name} {p.qty > 1 && <span className="text-slate-400">× {p.qty}</span>}
                    </span>
                    <span className="font-medium text-slate-900">{formatCurrency(p.price * p.qty)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Parts</span>
                <span className="text-slate-900">{formatCurrency(partsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Labour</span>
                <span className="text-slate-900">{formatCurrency(job.labour)}</span>
              </div>
              <div className="my-2 border-t border-dashed border-slate-200" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">{formatCurrency(job.total)}</span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button fullWidth variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => setStatusModal(true)}>
              Update Status
            </Button>
            <Button
              fullWidth
              leftIcon={<FileText className="h-4 w-4" />}
              onClick={() => {
                toast('Invoice generated', 'success')
                navigate('/app/billing')
              }}
            >
              Generate Invoice
            </Button>
          </div>
        </div>
      </div>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Status" size="sm">
        <div className="space-y-2">
          {statusFlow.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatus(s.value)
                setStatusModal(false)
                toast(`Status updated to ${s.label}`, 'success')
              }}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                status === s.value ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.label}
              {status === s.value && <StatusBadge status={s.value} />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
