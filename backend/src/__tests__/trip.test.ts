import mongoose from 'mongoose';
import Trip from '../models/Trip';
import User from '../models/User';
import Passenger from '../models/Passenger';
import Driver from '../models/Driver';

describe('Trip Model', () => {
  let passengerId: mongoose.Types.ObjectId;
  let driverId: mongoose.Types.ObjectId;
  let passengerUserId: mongoose.Types.ObjectId;
  let driverUserId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Create test users
    const passengerUser = await User.create({
      phone: '+201012345678',
      name: 'Test Passenger',
      role: 'passenger',
    });
    passengerUserId = passengerUser._id as mongoose.Types.ObjectId;

    const driverUser = await User.create({
      phone: '+201012345679',
      name: 'Test Driver',
      role: 'driver',
    });
    driverUserId = driverUser._id as mongoose.Types.ObjectId;

    // Create passenger profile
    const passenger = await Passenger.create({
      user: passengerUserId,
    });
    passengerId = passenger._id as mongoose.Types.ObjectId;

    // Create driver profile
    const driver = await Driver.create({
      user: driverUserId,
      nationalId: '12345678901234',
      vehicle: {
        type: 'car',
        category: 'economy',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'White',
        plateNumber: 'ABC 123',
      },
      status: 'approved',
    });
    driverId = driver._id as mongoose.Types.ObjectId;
  });

  describe('Trip Creation', () => {
    it('should create a trip with valid data', async () => {
      const tripData = {
        tripNumber: 'TRP-001',
        passenger: passengerId,
        pickup: {
          address: 'Test Pickup Address',
          coordinates: {
            type: 'Point',
            coordinates: [31.2357, 30.0444],
          },
        },
        dropoff: {
          address: 'Test Dropoff Address',
          coordinates: {
            type: 'Point',
            coordinates: [31.2400, 30.0500],
          },
        },
        rideType: 'economy',
        status: 'pending',
        fare: {
          estimated: 50,
          baseFare: 10,
          distanceFare: 25,
          timeFare: 10,
          platformFee: 5,
          driverEarnings: 45,
        },
        route: {
          distanceKm: 5,
          durationMinutes: 15,
          polyline: 'encoded_polyline_string',
        },
        paymentMethod: 'cash',
      };

      const trip = await Trip.create(tripData);

      expect(trip._id).toBeDefined();
      expect(trip.tripNumber).toBe(tripData.tripNumber);
      expect(trip.status).toBe('pending');
      expect(trip.rideType).toBe('economy');
      expect(trip.fare.estimated).toBe(50);
    });

    it('should validate required fields', async () => {
      const trip = new Trip({});
      await expect(trip.save()).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const tripData = {
        tripNumber: 'TRP-002',
        passenger: passengerId,
        pickup: {
          address: 'Test Address',
          coordinates: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Test Address',
          coordinates: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        status: 'invalid-status',
        fare: { estimated: 50 },
        route: { distanceKm: 5, durationMinutes: 15 },
        paymentMethod: 'cash',
      };

      await expect(Trip.create(tripData)).rejects.toThrow();
    });

    it('should validate ride type enum', async () => {
      const tripData = {
        tripNumber: 'TRP-003',
        passenger: passengerId,
        pickup: {
          address: 'Test Address',
          coordinates: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Test Address',
          coordinates: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'invalid-type',
        status: 'pending',
        fare: { estimated: 50 },
        route: { distanceKm: 5, durationMinutes: 15 },
        paymentMethod: 'cash',
      };

      await expect(Trip.create(tripData)).rejects.toThrow();
    });
  });

  describe('Trip Status Transitions', () => {
    let trip: any;

    beforeEach(async () => {
      trip = await Trip.create({
        tripNumber: 'TRP-100',
        passenger: passengerId,
        pickup: {
          address: 'Pickup Address',
          coordinates: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Dropoff Address',
          coordinates: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        status: 'pending',
        fare: { estimated: 50 },
        route: { distanceKm: 5, durationMinutes: 15 },
        paymentMethod: 'cash',
      });
    });

    it('should update status from pending to searching', async () => {
      trip.status = 'searching';
      const updatedTrip = await trip.save();
      expect(updatedTrip.status).toBe('searching');
    });

    it('should update status to accepted with driver', async () => {
      trip.status = 'accepted';
      trip.driver = driverId;
      trip.timestamps = { acceptedAt: new Date() };
      const updatedTrip = await trip.save();

      expect(updatedTrip.status).toBe('accepted');
      expect(updatedTrip.driver).toEqual(driverId);
    });

    it('should update status to completed with final fare', async () => {
      trip.driver = driverId;
      trip.status = 'completed';
      trip.fare.final = 55;
      trip.timestamps = {
        acceptedAt: new Date(Date.now() - 30 * 60000),
        arrivedAt: new Date(Date.now() - 25 * 60000),
        startedAt: new Date(Date.now() - 20 * 60000),
        completedAt: new Date(),
      };

      const updatedTrip = await trip.save();

      expect(updatedTrip.status).toBe('completed');
      expect(updatedTrip.fare.final).toBe(55);
    });

    it('should allow cancellation with reason', async () => {
      trip.status = 'cancelled';
      trip.cancellation = {
        cancelledBy: 'passenger',
        reason: 'Changed my mind',
        cancelledAt: new Date(),
      };

      const updatedTrip = await trip.save();

      expect(updatedTrip.status).toBe('cancelled');
      expect(updatedTrip.cancellation.cancelledBy).toBe('passenger');
    });
  });

  describe('Trip Ratings', () => {
    it('should store passenger rating for driver', async () => {
      const trip = await Trip.create({
        tripNumber: 'TRP-200',
        passenger: passengerId,
        driver: driverId,
        pickup: {
          address: 'Pickup',
          coordinates: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Dropoff',
          coordinates: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        status: 'completed',
        fare: { estimated: 50, final: 55 },
        route: { distanceKm: 5, durationMinutes: 15 },
        paymentMethod: 'cash',
        rating: {
          passenger: {
            rating: 5,
            comment: 'Great ride!',
          },
        },
      });

      expect(trip.rating.passenger.rating).toBe(5);
      expect(trip.rating.passenger.comment).toBe('Great ride!');
    });

    it('should validate rating range', async () => {
      const tripData = {
        tripNumber: 'TRP-201',
        passenger: passengerId,
        driver: driverId,
        pickup: {
          address: 'Pickup',
          coordinates: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Dropoff',
          coordinates: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        status: 'completed',
        fare: { estimated: 50 },
        route: { distanceKm: 5, durationMinutes: 15 },
        paymentMethod: 'cash',
        rating: {
          passenger: {
            rating: 6, // Invalid - should be 1-5
          },
        },
      };

      await expect(Trip.create(tripData)).rejects.toThrow();
    });
  });

  describe('Trip Payment Methods', () => {
    it('should accept valid payment methods', async () => {
      const paymentMethods = ['cash', 'wallet', 'card'];

      for (const method of paymentMethods) {
        const trip = await Trip.create({
          tripNumber: `TRP-PM-${method}`,
          passenger: passengerId,
          pickup: {
            address: 'Pickup',
            coordinates: { type: 'Point', coordinates: [31.2357, 30.0444] },
          },
          dropoff: {
            address: 'Dropoff',
            coordinates: { type: 'Point', coordinates: [31.2400, 30.0500] },
          },
          rideType: 'economy',
          status: 'pending',
          fare: { estimated: 50 },
          route: { distanceKm: 5, durationMinutes: 15 },
          paymentMethod: method,
        });

        expect(trip.paymentMethod).toBe(method);
      }
    });
  });
});
