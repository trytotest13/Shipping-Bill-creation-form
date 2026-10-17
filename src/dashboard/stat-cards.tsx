import { Card, CardContent } from 'ui/basic/card'

interface StatCardsProps {
  billsCount: number
  exportersCount: number
  consigneesCount: number
}

export function StatCards({ billsCount, exportersCount, consigneesCount }: StatCardsProps) {
  const stats = [
    { label: 'Shipping bills', value: billsCount },
    { label: 'Exporters', value: exportersCount || 1 },
    { label: 'Businesses / Consignees', value: consigneesCount || 1 }
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border border-gray-300 dark:border-gray-800">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-gray-800">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
