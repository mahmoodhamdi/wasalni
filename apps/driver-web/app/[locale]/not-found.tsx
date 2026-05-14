import { getTranslations } from 'next-intl/server';

export default async function NotFound(): Promise<React.ReactElement> {
  const t = await getTranslations('errors');
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl font-bold text-[var(--color-brand-700)]">404</p>
      <p className="mt-4 text-lg text-[var(--color-fg-muted)]">{t('notFound')}</p>
    </div>
  );
}
