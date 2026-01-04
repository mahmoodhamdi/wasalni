import { Zone } from '../models';

export async function seedZones(): Promise<any[]> {
  // Clear existing zones
  await Zone.deleteMany({});

  const zones = [
    // Downtown Cairo
    {
      name: 'Downtown Cairo',
      nameAr: 'وسط القاهرة',
      description: 'Central business district',
      descriptionAr: 'منطقة الأعمال المركزية',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.22, 30.03],
            [31.26, 30.03],
            [31.26, 30.06],
            [31.22, 30.06],
            [31.22, 30.03],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: true,
    },

    // Heliopolis
    {
      name: 'Heliopolis',
      nameAr: 'مصر الجديدة',
      description: 'Upscale residential and commercial area',
      descriptionAr: 'منطقة سكنية وتجارية راقية',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.3, 30.07],
            [31.36, 30.07],
            [31.36, 30.12],
            [31.3, 30.12],
            [31.3, 30.07],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: false,
    },

    // Maadi
    {
      name: 'Maadi',
      nameAr: 'المعادي',
      description: 'Affluent residential neighborhood',
      descriptionAr: 'حي سكني راقي',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.23, 29.95],
            [31.28, 29.95],
            [31.28, 30.0],
            [31.23, 30.0],
            [31.23, 29.95],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: false,
    },

    // 6th of October City
    {
      name: '6th of October City',
      nameAr: 'مدينة 6 أكتوبر',
      description: 'Satellite city west of Cairo',
      descriptionAr: 'مدينة جديدة غرب القاهرة',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [30.95, 30.0],
            [31.1, 30.0],
            [31.1, 30.1],
            [30.95, 30.1],
            [30.95, 30.0],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.1, // Slight surge due to distance
      isHighDemand: false,
    },

    // New Cairo
    {
      name: 'New Cairo',
      nameAr: 'القاهرة الجديدة',
      description: 'Modern satellite city east of Cairo',
      descriptionAr: 'مدينة حديثة شرق القاهرة',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.4, 29.98],
            [31.5, 29.98],
            [31.5, 30.08],
            [31.4, 30.08],
            [31.4, 29.98],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: true,
    },

    // Cairo International Airport
    {
      name: 'Cairo International Airport',
      nameAr: 'مطار القاهرة الدولي',
      description: 'Airport zone with special rates',
      descriptionAr: 'منطقة المطار بأسعار خاصة',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.38, 30.1],
            [31.43, 30.1],
            [31.43, 30.14],
            [31.38, 30.14],
            [31.38, 30.1],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.2, // Airport premium
      isHighDemand: true,
      isAirport: true,
    },

    // Giza
    {
      name: 'Giza',
      nameAr: 'الجيزة',
      description: 'Historic area including pyramids',
      descriptionAr: 'منطقة تاريخية تشمل الأهرامات',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.1, 29.95],
            [31.22, 29.95],
            [31.22, 30.05],
            [31.1, 30.05],
            [31.1, 29.95],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: false,
    },

    // Nasr City
    {
      name: 'Nasr City',
      nameAr: 'مدينة نصر',
      description: 'Large residential and commercial district',
      descriptionAr: 'حي سكني وتجاري كبير',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.3, 30.04],
            [31.38, 30.04],
            [31.38, 30.08],
            [31.3, 30.08],
            [31.3, 30.04],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: true,
    },

    // Zamalek
    {
      name: 'Zamalek',
      nameAr: 'الزمالك',
      description: 'Upscale island district',
      descriptionAr: 'حي جزيرة راقي',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.21, 30.05],
            [31.23, 30.05],
            [31.23, 30.07],
            [31.21, 30.07],
            [31.21, 30.05],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.1, // Premium area
      isHighDemand: false,
    },

    // Dokki
    {
      name: 'Dokki',
      nameAr: 'الدقي',
      description: 'Residential and educational area',
      descriptionAr: 'منطقة سكنية وتعليمية',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [31.19, 30.03],
            [31.22, 30.03],
            [31.22, 30.06],
            [31.19, 30.06],
            [31.19, 30.03],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: false,
    },

    // Bagour - Primary Service Area (El-Menofia)
    {
      name: 'Bagour',
      nameAr: 'الباجور',
      description: 'Primary service area in El-Menofia',
      descriptionAr: 'منطقة الخدمة الأساسية في المنوفية',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [30.9, 30.4],
            [31.05, 30.4],
            [31.05, 30.5],
            [30.9, 30.5],
            [30.9, 30.4],
          ],
        ],
      },
      isActive: true,
      isServiceArea: true,
      surgeMultiplier: 1.0,
      isHighDemand: false,
      isPrimaryServiceArea: true,
    },
  ];

  const createdZones = await Zone.insertMany(zones);
  return createdZones;
}
