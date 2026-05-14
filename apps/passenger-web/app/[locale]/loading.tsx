import { Spinner } from '@wasalni/ui';

export default function Loading(): React.ReactElement {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
