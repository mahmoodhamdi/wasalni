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
      type: 'percentage',
      value: 50,
      maxDiscount: 30,
      minFare: 20,
      usageLimit: 10000,
      perUserLimit: 1,
      usedCount: 156,
      validFrom: oneMonthAgo,
      validUntil: oneYearFromNow,
      isActive: true,
      newUsersOnly: true,
      rideTypes: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
    },

    // Active percentage discount - general
    {
      code: 'SAVE20',
      type: 'percentage',
      value: 20,
      maxDiscount: 50,
      minFare: 30,
      usageLimit: 5000,
      perUserLimit: 3,
      usedCount: 89,
      validFrom: oneMonthAgo,
      validUntil: sixMonthsFromNow,
      isActive: true,
      rideTypes: ['economy', 'comfort', 'family'],
    },

    // Active fixed discount
    {
      code: 'FLAT25',
      type: 'fixed',
      value: 25,
      minFare: 50,
      usageLimit: 2000,
      perUserLimit: 2,
      usedCount: 45,
      validFrom: oneMonthAgo,
      validUntil: threeMonthsFromNow,
      isActive: true,
      rideTypes: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
    },

    // VIP promo - premium vehicles only
    {
      code: 'VIP100',
      type: 'percentage',
      value: 100,
      maxDiscount: 100,
      minFare: 0,
      usageLimit: 100,
      perUserLimit: 1,
      usedCount: 5,
      validFrom: oneMonthAgo,
      validUntil: oneYearFromNow,
      isActive: true,
      rideTypes: ['family'],
    },

    // Weekend special
    {
      code: 'WEEKEND30',
      type: 'percentage',
      value: 30,
      maxDiscount: 40,
      minFare: 25,
      usageLimit: 3000,
      perUserLimit: 5,
      usedCount: 234,
      validFrom: oneMonthAgo,
      validUntil: oneMonthFromNow,
      isActive: true,
      rideTypes: ['economy', 'comfort'],
    },

    // Ramadan special
    {
      code: 'RAMADAN',
      type: 'percentage',
      value: 25,
      maxDiscount: 35,
      minFare: 20,
      usageLimit: 10000,
      perUserLimit: 10,
      usedCount: 567,
      validFrom: oneMonthAgo,
      validUntil: threeMonthsFromNow,
      isActive: true,
      rideTypes: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
    },

    // Expired promo (for testing)
    {
      code: 'EXPIRED',
      type: 'percentage',
      value: 30,
      maxDiscount: 40,
      minFare: 20,
      usageLimit: 1000,
      perUserLimit: 2,
      usedCount: 234,
      validFrom: lastYear,
      validUntil: oneMonthAgo,
      isActive: false,
      rideTypes: ['economy', 'comfort'],
    },

    // Max uses reached (for testing)
    {
      code: 'SOLDOUT',
      type: 'fixed',
      value: 50,
      minFare: 30,
      usageLimit: 100,
      perUserLimit: 1,
      usedCount: 100,
      validFrom: oneMonthAgo,
      validUntil: oneYearFromNow,
      isActive: true,
      rideTypes: ['economy', 'comfort', 'family'],
    },

    // Tuktuk special
    {
      code: 'TUKTUK10',
      type: 'fixed',
      value: 10,
      minFare: 15,
      usageLimit: 5000,
      perUserLimit: 10,
      usedCount: 123,
      validFrom: oneMonthAgo,
      validUntil: sixMonthsFromNow,
      isActive: true,
      rideTypes: ['tuktuk'],
    },

    // Airport special
    {
      code: 'AIRPORT15',
      type: 'percentage',
      value: 15,
      maxDiscount: 50,
      minFare: 100,
      usageLimit: 2000,
      perUserLimit: 5,
      usedCount: 78,
      validFrom: oneMonthAgo,
      validUntil: sixMonthsFromNow,
      isActive: true,
      rideTypes: ['comfort', 'family'],
    },
  ];

  const createdPromos = await PromoCode.insertMany(promos);
  return createdPromos;
}
