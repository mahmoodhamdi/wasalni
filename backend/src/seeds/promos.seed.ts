import { PromoCode } from '../models';

export async function seedPromos(): Promise<any[]> {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const promos = [
    // Active percentage discount - first trip
    {
      code: 'WELCOME50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 30,
      minFare: 20,
      maxUses: 10000,
      maxUsesPerUser: 1,
      usedCount: 156,
      validFrom: oneMonthAgo,
      validUntil: oneYearFromNow,
      isActive: true,
      isFirstTripOnly: true,
      description: '50% off your first trip',
      descriptionAr: 'خصم 50% على رحلتك الأولى - حد أقصى 30 جنيه',
      applicableRideTypes: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
    },

    // Active percentage discount - general
    {
      code: 'SAVE20',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 50,
      minFare: 30,
      maxUses: 5000,
      maxUsesPerUser: 3,
      usedCount: 89,
      validFrom: oneMonthAgo,
      validUntil: sixMonthsFromNow,
      isActive: true,
      description: '20% off',
      descriptionAr: 'خصم 20% - حد أقصى 50 جنيه',
      applicableRideTypes: ['economy', 'comfort', 'family'],
    },

    // Active fixed discount
    {
      code: 'FLAT25',
      discountType: 'fixed',
      discountValue: 25,
      minFare: 50,
      maxUses: 2000,
      maxUsesPerUser: 2,
      usedCount: 45,
      validFrom: oneMonthAgo,
      validUntil: threeMonthsFromNow,
      isActive: true,
      description: '25 EGP off',
      descriptionAr: 'خصم 25 جنيه',
      applicableRideTypes: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
    },

    // VIP promo - premium vehicles only
    {
      code: 'VIP100',
      discountType: 'percentage',
      discountValue: 100,
      maxDiscount: 100,
      minFare: 0,
      maxUses: 100,
      maxUsesPerUser: 1,
      usedCount: 5,
      validFrom: oneMonthAgo,
      validUntil: oneYearFromNow,
      isActive: true,
      description: 'Free family ride for VIP',
      descriptionAr: 'رحلة عائلية مجانية للـ VIP',
      applicableRideTypes: ['family'],
    },

    // Weekend special
    {
      code: 'WEEKEND30',
      discountType: 'percentage',
      discountValue: 30,
      maxDiscount: 40,
      minFare: 25,
      maxUses: 3000,
      maxUsesPerUser: 5,
      usedCount: 234,
      validFrom: oneMonthAgo,
      validUntil: oneMonthFromNow,
      isActive: true,
      description: 'Weekend special 30% off',
      descriptionAr: 'عرض نهاية الأسبوع - خصم 30%',
      applicableRideTypes: ['economy', 'comfort'],
    },

    // Ramadan special
    {
      code: 'RAMADAN',
      discountType: 'percentage',
      discountValue: 25,
      maxDiscount: 35,
      minFare: 20,
      maxUses: 10000,
      maxUsesPerUser: 10,
      usedCount: 567,
      validFrom: oneMonthAgo,
      validUntil: threeMonthsFromNow,
      isActive: true,
      description: 'Ramadan Kareem discount',
      descriptionAr: 'عرض رمضان كريم - خصم 25%',
      applicableRideTypes: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
    },

    // Expired promo (for testing)
    {
      code: 'EXPIRED',
      discountType: 'percentage',
      discountValue: 30,
      maxDiscount: 40,
      minFare: 20,
      maxUses: 1000,
      maxUsesPerUser: 2,
      usedCount: 234,
      validFrom: lastYear,
      validUntil: oneMonthAgo,
      isActive: false,
      description: 'Expired offer',
      descriptionAr: 'عرض منتهي الصلاحية',
      applicableRideTypes: ['economy', 'comfort'],
    },

    // Max uses reached (for testing)
    {
      code: 'SOLDOUT',
      discountType: 'fixed',
      discountValue: 50,
      minFare: 30,
      maxUses: 100,
      maxUsesPerUser: 1,
      usedCount: 100, // Max reached
      validFrom: oneMonthAgo,
      validUntil: oneYearFromNow,
      isActive: true,
      description: 'Sold out offer',
      descriptionAr: 'عرض نفد - تم استخدام جميع الكوبونات',
      applicableRideTypes: ['economy', 'comfort', 'family'],
    },

    // Tuktuk special
    {
      code: 'TUKTUK10',
      discountType: 'fixed',
      discountValue: 10,
      minFare: 15,
      maxUses: 5000,
      maxUsesPerUser: 10,
      usedCount: 123,
      validFrom: oneMonthAgo,
      validUntil: sixMonthsFromNow,
      isActive: true,
      description: '10 EGP off tuktuk rides',
      descriptionAr: 'خصم 10 جنيه على رحلات التوكتوك',
      applicableRideTypes: ['tuktuk'],
    },

    // Airport special
    {
      code: 'AIRPORT15',
      discountType: 'percentage',
      discountValue: 15,
      maxDiscount: 50,
      minFare: 100,
      maxUses: 2000,
      maxUsesPerUser: 5,
      usedCount: 78,
      validFrom: oneMonthAgo,
      validUntil: sixMonthsFromNow,
      isActive: true,
      description: '15% off airport trips',
      descriptionAr: 'خصم 15% على رحلات المطار',
      applicableRideTypes: ['comfort', 'family'],
    },
  ];

  const createdPromos = await PromoCode.insertMany(promos);
  return createdPromos;
}
