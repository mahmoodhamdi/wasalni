// User Models
export { default as User } from './User';
export { default as Passenger } from './Passenger';
export { default as Driver } from './Driver';
export { default as OTP } from './OTP';

// Trip Models
export { default as Trip } from './Trip';
export { default as FareSetting } from './FareSetting';
export { default as IntercityRoute } from './IntercityRoute';
export { default as PromoCode } from './PromoCode';
export { default as Transaction } from './Transaction';

// Location & Zones
export { default as Zone } from './Zone';
export { default as DriverLocation } from './DriverLocation';

// System
export { default as Notification } from './Notification';
export { default as Setting } from './Setting';

// Re-export types
export type { IUser } from '../types';
export type { IPassenger } from '../types';
export type { IDriver } from '../types';
export type { IOTP } from '../types';
export type { ITrip } from './Trip';
export type { IFareSetting } from './FareSetting';
export type { IIntercityRoute } from './IntercityRoute';
export type { IPromoCode } from './PromoCode';
export type { ITransaction } from './Transaction';
export type { IZone } from './Zone';
export type { IDriverLocation } from './DriverLocation';
export type { INotification } from './Notification';
export type { ISetting } from './Setting';
