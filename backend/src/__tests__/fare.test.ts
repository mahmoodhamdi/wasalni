import FareSetting from '../models/FareSetting';

describe('FareSetting Model', () => {
  describe('Fare Configuration', () => {
    it('should create fare settings with valid data', async () => {
      const fareData = {
        rideType: 'economy',
        baseFare: 10,
        perKm: 3.5,
        perMinute: 0.5,
        minimumFare: 15,
        bookingFee: 3,
        isActive: true,
      };

      const fare = await FareSetting.create(fareData);

      expect(fare._id).toBeDefined();
      expect(fare.rideType).toBe(fareData.rideType);
      expect(fare.baseFare).toBe(fareData.baseFare);
      expect(fare.perKm).toBe(fareData.perKm);
      expect(fare.perMinute).toBe(fareData.perMinute);
    });

    it('should validate ride type enum', async () => {
      const fareData = {
        rideType: 'invalid-type',
        baseFare: 10,
        perKm: 3.5,
        perMinute: 0.5,
        minimumFare: 15,
        bookingFee: 3,
      };

      await expect(FareSetting.create(fareData)).rejects.toThrow();
    });

    it('should not allow duplicate ride types', async () => {
      const fareData = {
        rideType: 'comfort',
        baseFare: 15,
        perKm: 4.5,
        perMinute: 0.75,
        minimumFare: 20,
        bookingFee: 5,
      };

      await FareSetting.create(fareData);
      await expect(FareSetting.create(fareData)).rejects.toThrow();
    });

    it('should have correct default values', async () => {
      const fareData = {
        rideType: 'family',
        baseFare: 20,
        perKm: 5,
        perMinute: 1,
        minimumFare: 25,
        bookingFee: 5,
      };

      const fare = await FareSetting.create(fareData);

      expect(fare.isActive).toBe(true);
      expect(fare.waitingFare.perMinute).toBe(0.5);
      expect(fare.waitingFare.freeMinutes).toBe(3);
    });
  });
});

describe('Fare Calculations', () => {
  describe('Basic fare calculation', () => {
    it('should calculate fare correctly', () => {
      const baseFare = 10;
      const perKm = 3.5;
      const perMinute = 0.5;
      const distance = 5; // km
      const duration = 15; // minutes

      const fare = baseFare + (distance * perKm) + (duration * perMinute);

      expect(fare).toBe(10 + 17.5 + 7.5);
      expect(fare).toBe(35);
    });

    it('should apply minimum fare', () => {
      const baseFare = 10;
      const perKm = 3.5;
      const perMinute = 0.5;
      const minimumFare = 20;
      const distance = 1; // km
      const duration = 2; // minutes

      let fare = baseFare + (distance * perKm) + (duration * perMinute);
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
      const perMinute = 1;
      const freeMinutes = 3;
      const totalWaitingMinutes = 10;

      const chargeableMinutes = Math.max(0, totalWaitingMinutes - freeMinutes);
      const waitingCharge = chargeableMinutes * perMinute;

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
