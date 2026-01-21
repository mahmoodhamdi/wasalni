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
      email: 'passenger@test.com',
      name: 'Test Passenger',
      role: 'passenger',
    });
    passengerUserId = passengerUser._id as mongoose.Types.ObjectId;

    const driverUser = await User.create({
      email: 'driver@test.com',
      name: 'Test Driver',
      role: 'driver',
    });
    driverUserId = driverUser._id as mongoose.Types.ObjectId;

    // Create passenger profile
    const passenger = await Passenger.create({
      userId: passengerUserId,
    });
    passengerId = passenger._id as mongoose.Types.ObjectId;

    // Create driver profile
    const driver = await Driver.create({
      userId: driverUserId,
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
        passengerId: passengerId,
        pickup: {
          address: 'Test Pickup Address',
          location: {
            type: 'Point',
            coordinates: [31.2357, 30.0444],
          },
        },
        dropoff: {
          address: 'Test Dropoff Address',
          location: {
            type: 'Point',
            coordinates: [31.2400, 30.0500],
          },
        },
        rideType: 'economy',
        tripType: 'instant',
        status: 'searching',
        estimatedFare: {
          min: 45,
          max: 55,
        },
        route: {
          distanceMeters: 5000,
          durationSeconds: 900,
          distanceText: '5 km',
          durationText: '15 min',
        },
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      };

      const trip = await Trip.create(tripData);

      expect(trip._id).toBeDefined();
      expect(trip.tripNumber).toBe(tripData.tripNumber);
      expect(trip.status).toBe('searching');
      expect(trip.rideType).toBe('economy');
      expect(trip.estimatedFare?.min).toBe(45);
      expect(trip.estimatedFare?.max).toBe(55);
    });

    it('should validate required fields', async () => {
      const trip = new Trip({});
      await expect(trip.save()).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const tripData = {
        tripNumber: 'TRP-002',
        passengerId: passengerId,
        pickup: {
          address: 'Test Address',
          location: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Test Address',
          location: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        tripType: 'instant',
        status: 'invalid-status',
        estimatedFare: { min: 45, max: 55 },
        route: {
          distanceMeters: 5000,
          durationSeconds: 900,
          distanceText: '5 km',
          durationText: '15 min',
        },
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      };

      await expect(Trip.create(tripData)).rejects.toThrow();
    });

    it('should validate ride type enum', async () => {
      const tripData = {
        tripNumber: 'TRP-003',
        passengerId: passengerId,
        pickup: {
          address: 'Test Address',
          location: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Test Address',
          location: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'invalid-type',
        tripType: 'instant',
        status: 'searching',
        estimatedFare: { min: 45, max: 55 },
        route: {
          distanceMeters: 5000,
          durationSeconds: 900,
          distanceText: '5 km',
          durationText: '15 min',
        },
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      };

      await expect(Trip.create(tripData)).rejects.toThrow();
    });
  });

  describe('Trip Status Transitions', () => {
    let trip: InstanceType<typeof Trip>;

    beforeEach(async () => {
      trip = await Trip.create({
        tripNumber: 'TRP-100',
        passengerId: passengerId,
        pickup: {
          address: 'Pickup Address',
          location: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Dropoff Address',
          location: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        tripType: 'instant',
        status: 'searching',
        estimatedFare: { min: 45, max: 55 },
        route: {
          distanceMeters: 5000,
          durationSeconds: 900,
          distanceText: '5 km',
          durationText: '15 min',
        },
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      });
    });

    it('should update status to driver_arriving', async () => {
      trip.status = 'driver_arriving';
      const updatedTrip = await trip.save();
      expect(updatedTrip.status).toBe('driver_arriving');
    });

    it('should update status to driver_assigned with driver', async () => {
      trip.status = 'driver_assigned';
      trip.driverId = driverId;
      trip.driverAssignedAt = new Date();
      const updatedTrip = await trip.save();

      expect(updatedTrip.status).toBe('driver_assigned');
      expect(updatedTrip.driverId).toEqual(driverId);
    });

    it('should update status to trip_completed with final fare', async () => {
      trip.driverId = driverId;
      trip.status = 'trip_completed';
      trip.fare = {
        baseFare: 10,
        distanceFare: 25,
        timeFare: 10,
        waitingFare: 0,
        surgeMultiplier: 1,
        surgeAmount: 0,
        bookingFee: 5,
        tolls: 0,
        discount: 0,
        subtotal: 50,
        total: 55,
      };
      trip.driverAssignedAt = new Date(Date.now() - 30 * 60000);
      trip.driverArrivedAt = new Date(Date.now() - 25 * 60000);
      trip.tripStartedAt = new Date(Date.now() - 20 * 60000);
      trip.tripCompletedAt = new Date();

      const updatedTrip = await trip.save();

      expect(updatedTrip.status).toBe('trip_completed');
      expect(updatedTrip.fare?.total).toBe(55);
    });

    it('should allow cancellation with reason', async () => {
      trip.status = 'cancelled';
      trip.isCancelled = true;
      trip.cancelledBy = 'passenger';
      trip.cancelReason = 'Changed my mind';
      trip.cancelledAt = new Date();

      const updatedTrip = await trip.save();

      expect(updatedTrip.status).toBe('cancelled');
      expect(updatedTrip.cancelledBy).toBe('passenger');
    });
  });

  describe('Trip Ratings', () => {
    it('should store passenger rating for driver', async () => {
      const trip = await Trip.create({
        tripNumber: 'TRP-200',
        passengerId: passengerId,
        driverId: driverId,
        pickup: {
          address: 'Pickup',
          location: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Dropoff',
          location: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        tripType: 'instant',
        status: 'trip_completed',
        estimatedFare: { min: 45, max: 55 },
        fare: {
          baseFare: 10,
          distanceFare: 25,
          timeFare: 10,
          waitingFare: 0,
          surgeMultiplier: 1,
          surgeAmount: 0,
          bookingFee: 5,
          tolls: 0,
          discount: 0,
          subtotal: 50,
          total: 55,
        },
        route: {
          distanceMeters: 5000,
          durationSeconds: 900,
          distanceText: '5 km',
          durationText: '15 min',
        },
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        passengerRating: {
          score: 5,
          comment: 'Great ride!',
          badges: [],
          createdAt: new Date(),
        },
      });

      expect(trip.passengerRating?.score).toBe(5);
      expect(trip.passengerRating?.comment).toBe('Great ride!');
    });

    it('should validate rating range', async () => {
      const tripData = {
        tripNumber: 'TRP-201',
        passengerId: passengerId,
        driverId: driverId,
        pickup: {
          address: 'Pickup',
          location: { type: 'Point', coordinates: [31.2357, 30.0444] },
        },
        dropoff: {
          address: 'Dropoff',
          location: { type: 'Point', coordinates: [31.2400, 30.0500] },
        },
        rideType: 'economy',
        tripType: 'instant',
        status: 'trip_completed',
        estimatedFare: { min: 45, max: 55 },
        route: {
          distanceMeters: 5000,
          durationSeconds: 900,
          distanceText: '5 km',
          durationText: '15 min',
        },
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        passengerRating: {
          score: 6, // Invalid - should be 1-5
          badges: [],
          createdAt: new Date(),
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
          passengerId: passengerId,
          pickup: {
            address: 'Pickup',
            location: { type: 'Point', coordinates: [31.2357, 30.0444] },
          },
          dropoff: {
            address: 'Dropoff',
            location: { type: 'Point', coordinates: [31.2400, 30.0500] },
          },
          rideType: 'economy',
          tripType: 'instant',
          status: 'searching',
          estimatedFare: { min: 45, max: 55 },
          route: {
            distanceMeters: 5000,
            durationSeconds: 900,
            distanceText: '5 km',
            durationText: '15 min',
          },
          paymentMethod: method,
          paymentStatus: 'pending',
        });

        expect(trip.paymentMethod).toBe(method);
      }
    });
  });
});
