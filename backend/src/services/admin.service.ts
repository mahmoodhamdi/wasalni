import { Types, FilterQuery } from 'mongoose';
import User from '../models/User';
import Passenger from '../models/Passenger';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import FareSetting from '../models/FareSetting';
import Zone from '../models/Zone';

// ==================== Dashboard Stats ====================

export interface DashboardStats {
  totalPassengers: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  activeTrips: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  avgRating: number;
  avgTripDuration: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Run queries in parallel
  const [
    totalPassengers,
    totalDrivers,
    activeDrivers,
    pendingDrivers,
    tripStats,
    todayTrips,
    weekTrips,
    monthTrips,
    avgRatingResult,
  ] = await Promise.all([
    Passenger.countDocuments({ isActive: true }),
    Driver.countDocuments(),
    Driver.countDocuments({ status: 'approved', driverStatus: { $in: ['online', 'busy'] } }),
    Driver.countDocuments({ status: 'pending' }),
    Trip.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'trip_completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          active: {
            $sum: {
              $cond: [
                { $in: ['$status', ['searching', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'trip_started']] },
                1,
                0,
              ],
            },
          },
          totalRevenue: { $sum: { $ifNull: ['$fare.total', 0] } },
          avgDuration: { $avg: '$tripDuration' },
        },
      },
    ]),
    Trip.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'trip_completed' } },
      { $group: { _id: null, revenue: { $sum: '$fare.total' } } },
    ]),
    Trip.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: 'trip_completed' } },
      { $group: { _id: null, revenue: { $sum: '$fare.total' } } },
    ]),
    Trip.aggregate([
      { $match: { createdAt: { $gte: monthAgo }, status: 'trip_completed' } },
      { $group: { _id: null, revenue: { $sum: '$fare.total' } } },
    ]),
    Driver.aggregate([
      { $match: { rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]),
  ]);

  const stats = tripStats[0] || {
    total: 0,
    completed: 0,
    cancelled: 0,
    active: 0,
    totalRevenue: 0,
    avgDuration: 0,
  };

  return {
    totalPassengers,
    totalDrivers,
    activeDrivers,
    pendingDrivers,
    totalTrips: stats.total,
    completedTrips: stats.completed,
    cancelledTrips: stats.cancelled,
    activeTrips: stats.active,
    totalRevenue: stats.totalRevenue,
    todayRevenue: todayTrips[0]?.revenue || 0,
    weekRevenue: weekTrips[0]?.revenue || 0,
    monthRevenue: monthTrips[0]?.revenue || 0,
    avgRating: avgRatingResult[0]?.avgRating || 0,
    avgTripDuration: stats.avgDuration || 0,
  };
};

// ==================== Passengers Management ====================

export interface PassengerListOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getPassengers = async (options: PassengerListOptions) => {
  const { page = 1, limit = 20, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  // Build user query for search and isActive filter
  const userQuery: FilterQuery<any> = { role: 'passenger' };

  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (isActive !== undefined) {
    userQuery.isActive = isActive;
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  // Get users first
  const users = await User.find(userQuery).select('_id').lean();
  const userIds = users.map((u) => u._id);

  const [passengers, total] = await Promise.all([
    Passenger.find({ user: { $in: userIds } })
      .populate('user', 'name phone email profileImage isActive createdAt')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Passenger.countDocuments({ user: { $in: userIds } }),
  ]);

  return {
    passengers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getPassengerById = async (passengerId: Types.ObjectId) => {
  const passenger = await Passenger.findById(passengerId)
    .populate('user', 'name phone email profileImage createdAt')
    .lean();

  if (!passenger) return null;

  // Get trip stats
  const tripStats = await Trip.aggregate([
    { $match: { passenger: passengerId } },
    {
      $group: {
        _id: null,
        totalTrips: { $sum: 1 },
        completedTrips: { $sum: { $cond: [{ $eq: ['$status', 'trip_completed'] }, 1, 0] } },
        cancelledTrips: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalSpent: { $sum: { $ifNull: ['$fare.total', 0] } },
      },
    },
  ]);

  return {
    ...passenger,
    stats: tripStats[0] || { totalTrips: 0, completedTrips: 0, cancelledTrips: 0, totalSpent: 0 },
  };
};

export const updatePassenger = async (
  passengerId: Types.ObjectId,
  updates: Record<string, any>
) => {
  return Passenger.findByIdAndUpdate(passengerId, updates, { new: true })
    .populate('user', 'name phone email');
};

export const togglePassengerActive = async (passengerId: Types.ObjectId) => {
  const passenger = await Passenger.findById(passengerId).populate('user');
  if (!passenger) throw new Error('Passenger not found');

  const user = await User.findById((passenger as any).user._id || (passenger as any).user);
  if (!user) throw new Error('User not found');

  user.isActive = !user.isActive;
  await user.save();

  return passenger.populate('user', 'name phone email profileImage isActive');
};

// ==================== Drivers Management ====================

export interface DriverListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  vehicleType?: string;
  isOnline?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getDrivers = async (options: DriverListOptions) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    vehicleType,
    isOnline,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const query: FilterQuery<any> = {};

  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    query.user = { $in: users.map((u) => u._id) };
  }

  if (status) {
    query.status = status;
  }

  if (vehicleType) {
    query.vehicleType = vehicleType;
  }

  if (isOnline !== undefined) {
    query.isOnline = isOnline;
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [drivers, total] = await Promise.all([
    Driver.find(query)
      .populate('user', 'name phone email profileImage')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Driver.countDocuments(query),
  ]);

  return {
    drivers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getDriverById = async (driverId: Types.ObjectId) => {
  const driver = await Driver.findById(driverId)
    .populate('user', 'name phone email profileImage createdAt')
    .lean();

  if (!driver) return null;

  // Get trip and earnings stats
  const [tripStats, recentTrips] = await Promise.all([
    Trip.aggregate([
      { $match: { driverId: driverId } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          completedTrips: { $sum: { $cond: [{ $eq: ['$status', 'trip_completed'] }, 1, 0] } },
          cancelledTrips: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalEarnings: { $sum: { $ifNull: ['$driverEarnings', 0] } },
        },
      },
    ]),
    Trip.find({ driverId: driverId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: 'passengerId', populate: { path: 'user', select: 'name phone' } })
      .lean(),
  ]);

  return {
    ...driver,
    stats: tripStats[0] || { totalTrips: 0, completedTrips: 0, cancelledTrips: 0, totalEarnings: 0 },
    recentTrips,
  };
};

export const getPendingDrivers = async () => {
  return Driver.find({ status: 'pending' })
    .populate('user', 'name phone email profileImage createdAt')
    .sort({ createdAt: -1 })
    .lean();
};

export const approveDriver = async (driverId: Types.ObjectId, adminId: Types.ObjectId) => {
  const driver = await Driver.findById(driverId) as any;
  if (!driver) throw new Error('Driver not found');

  if (driver.status !== 'pending') {
    throw new Error('Driver is not pending approval');
  }

  driver.status = 'approved';
  driver.approvedAt = new Date();
  driver.approvedBy = adminId;
  await driver.save();

  // Update user verification and activation
  await User.findByIdAndUpdate(driver.userId, { isVerified: true, isActive: true });

  return driver;
};

export const rejectDriver = async (
  driverId: Types.ObjectId,
  _adminId: Types.ObjectId,
  reason: string
) => {
  const driver = await Driver.findById(driverId) as any;
  if (!driver) throw new Error('Driver not found');

  driver.status = 'rejected';
  driver.rejectionReason = reason;
  await driver.save();

  return driver;
};

export const suspendDriver = async (
  driverId: Types.ObjectId,
  _adminId: Types.ObjectId,
  _reason: string
) => {
  const driver = await Driver.findById(driverId) as any;
  if (!driver) throw new Error('Driver not found');

  driver.status = 'suspended';
  driver.isOnline = false;
  driver.isAvailable = false;
  await driver.save();

  return driver;
};

export const activateDriver = async (driverId: Types.ObjectId) => {
  const driver = await Driver.findById(driverId) as any;
  if (!driver) throw new Error('Driver not found');

  if (driver.status !== 'suspended') {
    throw new Error('Driver is not suspended');
  }

  driver.status = 'approved';
  await driver.save();

  return driver;
};

// ==================== Trips Management ====================

export interface TripListOptions {
  page?: number;
  limit?: number;
  status?: string;
  from?: Date;
  to?: Date;
  passengerId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getTrips = async (options: TripListOptions) => {
  const {
    page = 1,
    limit = 20,
    status,
    from,
    to,
    passengerId,
    driverId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const query: FilterQuery<any> = {};

  if (status) {
    query.status = status;
  }

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  if (passengerId) {
    query.passenger = passengerId;
  }

  if (driverId) {
    query.driver = driverId;
  }

  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [trips, total] = await Promise.all([
    Trip.find(query)
      .populate({
        path: 'passengerId',
        populate: { path: 'user', select: 'name phone' },
      })
      .populate({
        path: 'driverId',
        populate: { path: 'user', select: 'name phone' },
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Trip.countDocuments(query),
  ]);

  return {
    trips,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getTripById = async (tripId: Types.ObjectId) => {
  return Trip.findById(tripId)
    .populate({
      path: 'passengerId',
      populate: { path: 'user', select: 'name phone email profileImage' },
    })
    .populate({
      path: 'driverId',
      populate: { path: 'user', select: 'name phone email profileImage' },
    })
    .lean();
};

export const getTripStats = async (from?: Date, to?: Date) => {
  const match: FilterQuery<any> = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = from;
    if (to) match.createdAt.$lte = to;
  }

  const stats = await Trip.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$fare.total', 0] } },
      },
    },
  ]);

  const byRideType = await Trip.aggregate([
    { $match: { ...match, status: 'trip_completed' } },
    {
      $group: {
        _id: '$rideType',
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$fare.total', 0] } },
        avgFare: { $avg: '$fare.total' },
      },
    },
  ]);

  const dailyStats = await Trip.aggregate([
    { $match: { ...match, status: 'trip_completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        trips: { $sum: 1 },
        revenue: { $sum: '$fare.total' },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  return {
    byStatus: stats,
    byRideType,
    dailyStats,
  };
};

export const getRecentTrips = async (limit = 10) => {
  return Trip.find()
    .populate({
      path: 'passengerId',
      populate: { path: 'user', select: 'name phone' },
    })
    .populate({
      path: 'driverId',
      populate: { path: 'user', select: 'name phone' },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// ==================== Finance ====================

export interface FinanceStats {
  totalRevenue: number;
  platformEarnings: number;
  driverPayouts: number;
  pendingPayouts: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

export const getFinanceStats = async (): Promise<FinanceStats> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
    Trip.aggregate([
      { $match: { status: 'trip_completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$fare.total' },
          platformEarnings: { $sum: '$platformFee' },
          driverPayouts: { $sum: '$driverEarnings' },
        },
      },
    ]),
    Trip.aggregate([
      { $match: { status: 'trip_completed', createdAt: { $gte: today } } },
      { $group: { _id: null, revenue: { $sum: '$fare.total' } } },
    ]),
    Trip.aggregate([
      { $match: { status: 'trip_completed', createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, revenue: { $sum: '$fare.total' } } },
    ]),
    Trip.aggregate([
      { $match: { status: 'trip_completed', createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, revenue: { $sum: '$fare.total' } } },
    ]),
  ]);

  const total = totalStats[0] || { totalRevenue: 0, platformEarnings: 0, driverPayouts: 0 };

  // Calculate pending payouts (drivers with unpaid earnings)
  const pendingPayouts = await Driver.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, pending: { $sum: '$pendingBalance' } } },
  ]);

  return {
    totalRevenue: total.totalRevenue,
    platformEarnings: total.platformEarnings,
    driverPayouts: total.driverPayouts,
    pendingPayouts: pendingPayouts[0]?.pending || 0,
    todayRevenue: todayStats[0]?.revenue || 0,
    weekRevenue: weekStats[0]?.revenue || 0,
    monthRevenue: monthStats[0]?.revenue || 0,
  };
};

export const getRevenueChart = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return Trip.aggregate([
    { $match: { status: 'trip_completed', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$fare.total' },
        trips: { $sum: 1 },
        platformFee: { $sum: '$platformFee' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// ==================== Fare Settings ====================

export const getFareSettings = async () => {
  return FareSetting.find({ isActive: true }).lean();
};

export const updateFareSetting = async (
  fareId: Types.ObjectId,
  updates: Record<string, unknown>
) => {
  return FareSetting.findByIdAndUpdate(fareId, updates, { new: true });
};

export const createFareSetting = async (data: Record<string, unknown>) => {
  const fare = new FareSetting(data);
  return fare.save();
};

// ==================== Zones ====================

export const getZones = async () => {
  return Zone.find().lean();
};

export const updateZone = async (zoneId: Types.ObjectId, updates: Record<string, unknown>) => {
  return Zone.findByIdAndUpdate(zoneId, updates, { new: true });
};

export const createZone = async (data: Record<string, unknown>) => {
  const zone = new Zone(data);
  return zone.save();
};

export const deleteZone = async (zoneId: Types.ObjectId) => {
  return Zone.findByIdAndDelete(zoneId);
};

export default {
  getDashboardStats,
  getPassengers,
  getPassengerById,
  updatePassenger,
  togglePassengerActive,
  getDrivers,
  getDriverById,
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  suspendDriver,
  activateDriver,
  getTrips,
  getTripById,
  getTripStats,
  getRecentTrips,
  getFinanceStats,
  getRevenueChart,
  getFareSettings,
  updateFareSetting,
  createFareSetting,
  getZones,
  updateZone,
  createZone,
  deleteZone,
};
