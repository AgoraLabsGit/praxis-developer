import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function OnboardError({ message }: { message: string }) {
  const isMigrationError = message.includes('Could not find the table');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Setup Error</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {isMigrationError && (
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">Fix: Run the database migration</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open your Supabase project dashboard</li>
                <li>Go to SQL Editor</li>
                <li>Copy the contents of <code className="bg-muted-foreground/10 px-1 rounded">supabase/migrations/001_initial_schema.sql</code></li>
                <li>Paste and run the SQL</li>
              </ol>
            </div>
          )}

          <div className="flex gap-2">
            <Button asChild>
              <Link href="/onboard">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
