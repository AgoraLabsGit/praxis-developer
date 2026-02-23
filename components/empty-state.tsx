import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link href={actionHref}>
        <Button>{actionLabel}</Button>
      </Link>
    </div>
  );
}
