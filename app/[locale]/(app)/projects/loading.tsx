import { GridSkeleton, PageSkeleton } from '@/components/ui/page-skeleton';

export default function ProjectsLoading() {
  return (
    <PageSkeleton actions={2}>
      <GridSkeleton count={6} />
    </PageSkeleton>
  );
}
