import { Badge } from '@/components/ui/Badge'

type Result = {
  compatible: boolean
  verdict: string
  reason: string
  missing: string
  occasion_fit: string[]
}

export function CompatibilityResult({ result }: { result: Result }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className={`px-5 py-4 flex items-center gap-3 ${result.compatible ? 'bg-green-50' : 'bg-red-50'}`}>
        <span className="text-2xl">{result.compatible ? '✓' : '✗'}</span>
        <p className={`font-medium text-sm ${result.compatible ? 'text-green-800' : 'text-red-800'}`}>
          {result.verdict}
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Why</p>
          <p className="text-sm text-gray-700 leading-relaxed">{result.reason}</p>
        </div>

        {result.missing && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {result.compatible ? 'To complete the look' : 'What would work better'}
            </p>
            <p className="text-sm text-gray-700">{result.missing}</p>
          </div>
        )}

        {result.occasion_fit?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Works for</p>
            <div className="flex flex-wrap gap-1.5">
              {result.occasion_fit.map((o) => (
                <Badge key={o}>{o}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
