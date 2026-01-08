import { Zone } from '../models';

export async function seedZones(): Promise<any[]> {
  // Clear existing zones
  await Zone.deleteMany({});

  const zones = [
    // Downtown Cairo
    {
      name: 'Downtown Cairo',
      nameAr: 'وسط القاهرة',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Heliopolis
    {
      name: 'Heliopolis',
      nameAr: 'مصر الجديدة',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Maadi
    {
      name: 'Maadi',
      nameAr: 'المعادي',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // 6th of October City
    {
      name: '6th of October City',
      nameAr: 'مدينة 6 أكتوبر',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.1,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // New Cairo
    {
      name: 'New Cairo',
      nameAr: 'القاهرة الجديدة',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Cairo International Airport - surge zone
    {
      name: 'Cairo International Airport',
      nameAr: 'مطار القاهرة الدولي',
      type: 'surge_zone',
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
      settings: {
        surgeMultiplier: 1.2,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Giza
    {
      name: 'Giza',
      nameAr: 'الجيزة',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Nasr City
    {
      name: 'Nasr City',
      nameAr: 'مدينة نصر',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Zamalek - surge zone (premium area)
    {
      name: 'Zamalek',
      nameAr: 'الزمالك',
      type: 'surge_zone',
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
      settings: {
        surgeMultiplier: 1.1,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Dokki
    {
      name: 'Dokki',
      nameAr: 'الدقي',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },

    // Bagour - Primary Service Area (El-Menofia)
    {
      name: 'Bagour',
      nameAr: 'الباجور',
      type: 'service_area',
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
      settings: {
        surgeMultiplier: 1.0,
        isPickupAllowed: true,
        isDropoffAllowed: true,
      },
    },
  ];

  const createdZones = await Zone.insertMany(zones);
  return createdZones;
}
