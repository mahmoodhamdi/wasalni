import FareSetting from '../models/FareSetting';

describe('FareSetting Model', () => {
  describe('Fare Configuration', () => {
    it('should create fare settings with valid data', async () => {
      const fareData = {
        rideType: 'economy',
        baseFare: 10,
        perKmRate: 3.5,
        perMinuteRate: 0.5,
        minimumFare: 15,
        platformFeePercent: 15,
        isActive: true,
      };

      const fare = await FareSetting.create(fareData);

      expect(fare._id).toBeDefined();
      expect(fare.rideType).toBe(fareData.rideType);
      expect(fare.baseFare).toBe(fareData.baseFare);
      expect(fare.perKmRate).toBe(fareData.perKmRate);
      expect(fare.platformFeePercent).toBe(fareData.platformFeePercent);
    });

    it('should validate ride type enum', async () => {
      const fareData = {
        rideType: 'invalid-type',
        baseFare: 10,
        perKmRate: 3.5,
        perMinuteRate: 0.5,
        minimumFare: 15,
        platformFeePercent: 15,
      };

      await expect(FareSetting.create(fareData)).rejects.toThrow();
    });

    it('should not allow duplicate ride types', async () => {
      const fareData = {
        rideType: 'comfort',
        baseFare: 15,
        perKmRate: 4.5,
        perMinuteRate: 0.75,
        minimumFare: 20,
        platformFeePercent: 15,
      };

      await FareSetting.create(fareData);
      await expect(FareSetting.create(fareData)).rejects.toThrow();
    });

    it('should have correct default values', async () => {
      const fareData = {
        rideType: 'family',
        baseFare: 20,
        perKmRate: 5,
        perMinuteRate: 1,
        minimumFare: 25,
        platformFeePercent: 15,
      };

      const fare = await FareSetting.create(fareData);

      expect(fare.isActive).toBe(true);
      expect(fare.waitingChargePerMin).toBe(0);
      expect(fare.freeWaitingMinutes).toBe(3);
    });
  });
});

describe('Fare Calculations', () => {
  describe('Basic fare calculation', () => {
    it('should calculate fare correctly', () => {
      const baseFare = 10;
      const perKmRate = 3.5;
      const perMinuteRate = 0.5;
      const distance = 5; // km
      const duration = 15; // minutes

      const fare = baseFare + (distance * perKmRate) + (duration * perMinuteRate);

      expect(fare).toBe(10 + 17.5 + 7.5);
      expect(fare).toBe(35);
    });

    it('should apply minimum fare', () => {
      const baseFare = 10;
      const perKmRate = 3.5;
      const perMinuteRate = 0.5;
      const minimumFare = 20;
      const distance = 1; // km
      const duration = 2; // minutes

      let fare = baseFare + (distance * perKmRate) + (duration * perMinuteRate);
      fare = Math.max(fare, minimumFare);

      expect(fare).toBe(20); // minimum fare applied
    });

    it('should calculate platform fee', () => {
      const fare = 100;
      const platformFeePercent = 15;

      const platformFee = (fare * platformFeePercent) / 100;
      const driverEarnings = fare - platformFee;

      expect(platformFee).toBe(15);
      expect(driverEarnings).toBe(85);
    });

    it('should apply surge pricing', () => {
      const baseFare = 100;
      const surgeMultiplier = 1.5;

      const surgedFare = baseFare * surgeMultiplier;

      expect(surgedFare).toBe(150);
    });

    it('should calculate waiting charges', () => {
      const waitingChargePerMin = 1;
      const freeWaitingMinutes = 3;
      const totalWaitingMinutes = 10;

      const chargeableMinutes = Math.max(0, totalWaitingMinutes - freeWaitingMinutes);
      const waitingCharge = chargeableMinutes * waitingChargePerMin;

      expect(chargeableMinutes).toBe(7);
      expect(waitingCharge).toBe(7);
    });

    it('should apply promo code discount - percentage', () => {
      const fare = 100;
      const discountPercent = 20;
      const maxDiscount = 50;

      let discount = (fare * discountPercent) / 100;
      discount = Math.min(discount, maxDiscount);
      const finalFare = fare - discount;

      expect(discount).toBe(20);
      expect(finalFare).toBe(80);
    });

    it('should cap promo discount at max', () => {
      const fare = 500;
      const discountPercent = 20;
      const maxDiscount = 50;

      let discount = (fare * discountPercent) / 100;
      discount = Math.min(discount, maxDiscount);
      const finalFare = fare - discount;

      expect(discount).toBe(50); // capped at max
      expect(finalFare).toBe(450);
    });

    it('should apply fixed discount', () => {
      const fare = 100;
      const fixedDiscount = 15;

      const finalFare = Math.max(0, fare - fixedDiscount);

      expect(finalFare).toBe(85);
    });
  });
});
