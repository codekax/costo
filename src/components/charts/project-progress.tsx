import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/format';
import type { ProjectWithTotals } from '@/lib/db/queries/projects';

export function ProjectProgressList({ projects }: { projects: ProjectWithTotals[] }) {
  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Creá un proyecto para empezar a trackear su progreso.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {projects.map((p) => {
        const budgetArs = p.budget_ars ? Number(p.budget_ars) : null;
        const budgetUsd = p.budget_usd ? Number(p.budget_usd) : null;
        const progressArs =
          budgetArs && budgetArs > 0 ? Math.min(100, (p.total_ars / budgetArs) * 100) : null;
        const progressUsd =
          budgetUsd && budgetUsd > 0 ? Math.min(100, (p.total_usd / budgetUsd) * 100) : null;

        return (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="block group">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium group-hover:underline">
                  {p.name}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {p.expense_count} {p.expense_count === 1 ? 'gasto' : 'gastos'}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                <Row
                  label="ARS"
                  amount={p.total_ars}
                  currency="ARS"
                  budget={budgetArs}
                  progress={progressArs}
                />
                <Row
                  label="USD"
                  amount={p.total_usd}
                  currency="USD"
                  budget={budgetUsd}
                  progress={progressUsd}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Row({
  label,
  amount,
  currency,
  budget,
  progress,
}: {
  label: string;
  amount: number;
  currency: 'ARS' | 'USD';
  budget: number | null;
  progress: number | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {formatCurrency(amount, currency)}
          {budget !== null && (
            <span className="ml-1 text-muted-foreground">
              / {formatCurrency(budget, currency)}
            </span>
          )}
        </span>
      </div>
      {progress !== null && <Progress value={progress} className="h-1.5" />}
    </div>
  );
}
