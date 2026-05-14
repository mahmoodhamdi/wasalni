import * as React from 'react';
import { setRequestLocale } from 'next-intl/server';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@wasalni/ui';
import type { Locale } from '@wasalni/i18n';

const FAQ_AR: Array<{ q: string; a: string }> = [
  {
    q: 'إزاي أحجز رحلة؟',
    a: 'افتح الصفحة الرئيسية، اضغط "ابدأ الحجز"، حدد نقطة الانطلاق والوجهة، اختر نوع الرحلة، وأكّد. الموقع هيلاقيلك أقرب سائق.',
  },
  {
    q: 'إزاي أدفع؟',
    a: 'حالياً بنقبل كاش، محفظة، وبطاقات الائتمان عبر Paymob. تقدر تختار طريقة الدفع قبل تأكيد الحجز.',
  },
  {
    q: 'إزاي ألغي الرحلة؟',
    a: 'من شاشة الرحلة فيه زر "إلغاء" فوق على اليمين. ممكن يكون فيه رسوم إلغاء لو السائق قبل بالفعل.',
  },
  {
    q: 'إيه فايدة كود الخصم؟',
    a: 'أكتب الكود في شاشة الحجز قبل تأكيد الرحلة. هينطبق على فاتورتك تلقائياً.',
  },
  {
    q: 'إيه هو زر SOS؟',
    a: 'في حالة الطوارئ، اضغط مطوّل على زر SOS من شاشة الرحلة. هنبلّغ فريق الأمان وجهات اتصالك الطارئة بموقعك فوراً.',
  },
];

const FAQ_EN: Array<{ q: string; a: string }> = [
  {
    q: 'How do I book a ride?',
    a: 'Open the home page, tap "Book a ride", select pickup and dropoff, choose a ride type, and confirm. We\'ll match you with the nearest driver.',
  },
  {
    q: 'How do I pay?',
    a: 'We accept cash, wallet balance, and credit cards (via Paymob). Choose the payment method before confirming the booking.',
  },
  {
    q: 'How do I cancel a trip?',
    a: 'On the trip screen there\'s a "Cancel" button in the top-right. A small fee may apply if a driver has already accepted.',
  },
  {
    q: 'What does a promo code do?',
    a: 'Enter it on the booking screen before confirming. The discount applies automatically to your fare.',
  },
  {
    q: 'What is the SOS button?',
    a: "In an emergency, long-press the SOS button on the trip screen. We'll alert our safety team and your emergency contacts with your location immediately.",
  },
];

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';
  const faq = ar ? FAQ_AR : FAQ_EN;

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4">
      <header>
        <h1 className="text-2xl font-bold">{ar ? 'مساعدة' : 'Help'}</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {ar ? 'الأسئلة الشائعة وطرق التواصل' : 'FAQs and how to reach us'}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{ar ? 'تواصل معنا' : 'Contact us'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <a
            href="tel:+201000000000"
            className="flex items-center gap-2 text-[var(--color-fg)] hover:underline"
            dir="ltr"
          >
            <Phone className="h-4 w-4 text-[var(--color-brand-600)]" aria-hidden="true" />
            +20 100 000 0000
          </a>
          <a
            href="mailto:help@wasalni.app"
            className="flex items-center gap-2 text-[var(--color-fg)] hover:underline"
            dir="ltr"
          >
            <Mail className="h-4 w-4 text-[var(--color-brand-600)]" aria-hidden="true" />
            help@wasalni.app
          </a>
          <a
            href="https://wa.me/201000000000"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 text-[var(--color-fg)] hover:underline"
            dir="ltr"
          >
            <MessageCircle className="h-4 w-4 text-[var(--color-success-500)]" aria-hidden="true" />
            WhatsApp
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ar ? 'الأسئلة الشائعة' : 'FAQ'}</CardTitle>
          <CardDescription>
            {ar ? 'لو ما لقيتش إجابة، تواصل معانا' : "Reach out if you don't find an answer"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-[var(--color-border)]">
            {faq.map(({ q, a }) => (
              <details key={q} className="group py-3">
                <summary className="cursor-pointer font-medium text-[var(--color-fg)] marker:hidden">
                  {q}
                </summary>
                <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{a}</p>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
