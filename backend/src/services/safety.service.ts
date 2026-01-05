import { Types } from 'mongoose';
import Passenger from '../models/Passenger';
import Driver from '../models/Driver';
import Trip from '../models/Trip';
import User from '../models/User';
import { logger } from '../utils/logger';
import { config } from '../config';
import crypto from 'crypto';
import { smsService } from './sms.service';
import { emitToAdmin, emitToEmergency } from '../config/socket';

// Emergency Contact
export interface EmergencyContact {
  _id?: Types.ObjectId;
  name: string;
  phone: string;
  relationship: string;
  notifyOnTrip: boolean;
  notifyOnSOS: boolean;
}

// Safety Preferences
export interface SafetyPreferences {
  autoShareTrips: boolean;
  shareWithContacts: Types.ObjectId[];
  sendETAUpdates: boolean;
  sosGestureEnabled: boolean;
  nightModeAlerts: boolean;
  recordTrips: boolean;
}

// SOS Event
export interface SOSEvent {
  tripId: Types.ObjectId;
  triggeredBy: 'passenger' | 'driver';
  userId: Types.ObjectId;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  notes?: string;
}

// Trip Share Link
export interface TripShareLink {
  tripId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  shareUrl: string;
}

// Safety Check
export interface SafetyCheck {
  tripId: Types.ObjectId;
  type: 'departure' | 'arrival' | 'periodic' | 'route_deviation';
  message: string;
  responseRequired: boolean;
  respondedAt?: Date;
  response?: 'safe' | 'need_help';
}

/**
 * Add emergency contact for passenger
 */
export const addEmergencyContact = async (
  passengerId: Types.ObjectId,
  contact: Omit<EmergencyContact, '_id'>
): Promise<EmergencyContact[]> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    // Check max contacts limit
    const existingContacts = (passenger as any).emergencyContacts || [];
    if (existingContacts.length >= 5) {
      throw new Error('Maximum 5 emergency contacts allowed');
    }

    // Check for duplicate phone
    const duplicate = existingContacts.find(
      (c: EmergencyContact) => c.phone === contact.phone
    );
    if (duplicate) {
      throw new Error('Contact with this phone number already exists');
    }

    // Add contact
    existingContacts.push({
      ...contact,
      _id: new Types.ObjectId(),
    });

    await Passenger.findByIdAndUpdate(passengerId, {
      emergencyContacts: existingContacts,
    });

    logger.info(`Emergency contact added for passenger ${passengerId}`);
    return existingContacts;
  } catch (error) {
    logger.error(`Failed to add emergency contact: ${error}`);
    throw error;
  }
};

/**
 * Update emergency contact
 */
export const updateEmergencyContact = async (
  passengerId: Types.ObjectId,
  contactId: Types.ObjectId,
  updates: Partial<Omit<EmergencyContact, '_id'>>
): Promise<EmergencyContact[]> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    const contacts = (passenger as any).emergencyContacts || [];
    const contactIndex = contacts.findIndex(
      (c: EmergencyContact) => c._id?.toString() === contactId.toString()
    );

    if (contactIndex === -1) {
      throw new Error('Contact not found');
    }

    // Update contact
    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...updates,
    };

    await Passenger.findByIdAndUpdate(passengerId, {
      emergencyContacts: contacts,
    });

    logger.info(`Emergency contact ${contactId} updated for passenger ${passengerId}`);
    return contacts;
  } catch (error) {
    logger.error(`Failed to update emergency contact: ${error}`);
    throw error;
  }
};

/**
 * Remove emergency contact
 */
export const removeEmergencyContact = async (
  passengerId: Types.ObjectId,
  contactId: Types.ObjectId
): Promise<EmergencyContact[]> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    const contacts = (passenger as any).emergencyContacts || [];
    const filteredContacts = contacts.filter(
      (c: EmergencyContact) => c._id?.toString() !== contactId.toString()
    );

    if (filteredContacts.length === contacts.length) {
      throw new Error('Contact not found');
    }

    await Passenger.findByIdAndUpdate(passengerId, {
      emergencyContacts: filteredContacts,
    });

    logger.info(`Emergency contact ${contactId} removed for passenger ${passengerId}`);
    return filteredContacts;
  } catch (error) {
    logger.error(`Failed to remove emergency contact: ${error}`);
    throw error;
  }
};

/**
 * Get emergency contacts for passenger
 */
export const getEmergencyContacts = async (
  passengerId: Types.ObjectId
): Promise<EmergencyContact[]> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    return (passenger as any).emergencyContacts || [];
  } catch (error) {
    logger.error(`Failed to get emergency contacts: ${error}`);
    throw error;
  }
};

/**
 * Update safety preferences
 */
export const updateSafetyPreferences = async (
  passengerId: Types.ObjectId,
  preferences: Partial<SafetyPreferences>
): Promise<SafetyPreferences> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    const currentPrefs = (passenger as any).safetyPreferences || {
      autoShareTrips: false,
      shareWithContacts: [],
      sendETAUpdates: true,
      sosGestureEnabled: true,
      nightModeAlerts: true,
      recordTrips: false,
    };

    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    await Passenger.findByIdAndUpdate(passengerId, {
      safetyPreferences: updatedPrefs,
    });

    logger.info(`Safety preferences updated for passenger ${passengerId}`);
    return updatedPrefs;
  } catch (error) {
    logger.error(`Failed to update safety preferences: ${error}`);
    throw error;
  }
};

/**
 * Get safety preferences
 */
export const getSafetyPreferences = async (
  passengerId: Types.ObjectId
): Promise<SafetyPreferences> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    return (passenger as any).safetyPreferences || {
      autoShareTrips: false,
      shareWithContacts: [],
      sendETAUpdates: true,
      sosGestureEnabled: true,
      nightModeAlerts: true,
      recordTrips: false,
    };
  } catch (error) {
    logger.error(`Failed to get safety preferences: ${error}`);
    throw error;
  }
};

/**
 * Generate trip share link
 */
export const generateTripShareLink = async (
  tripId: Types.ObjectId,
  expirationHours: number = 24
): Promise<TripShareLink> => {
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    // Store token in trip
    await Trip.findByIdAndUpdate(tripId, {
      shareToken: token,
      shareTokenExpiry: expiresAt,
    });

    // Generate share URL
    const baseUrl = config.app.frontendUrl || 'https://wasalni.app';
    const shareUrl = `${baseUrl}/track/${tripId}?token=${token}`;

    logger.info(`Trip share link generated for trip ${tripId}`);

    return {
      tripId,
      token,
      expiresAt,
      shareUrl,
    };
  } catch (error) {
    logger.error(`Failed to generate trip share link: ${error}`);
    throw error;
  }
};

/**
 * Validate trip share token
 */
export const validateTripShareToken = async (
  tripId: Types.ObjectId,
  token: string
): Promise<boolean> => {
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return false;
    }

    const tripData = trip as any;
    if (tripData.shareToken !== token) {
      return false;
    }

    if (tripData.shareTokenExpiry && new Date() > tripData.shareTokenExpiry) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Failed to validate trip share token: ${error}`);
    return false;
  }
};

/**
 * Get trip for tracking (public)
 */
export const getTripForTracking = async (
  tripId: Types.ObjectId,
  token: string
): Promise<any> => {
  try {
    const isValid = await validateTripShareToken(tripId, token);
    if (!isValid) {
      throw new Error('Invalid or expired share link');
    }

    const trip = await Trip.findById(tripId)
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'name avatar',
        },
        select: 'vehicle rating currentLocation',
      })
      .select('status pickup dropoff estimatedArrival driverId route');

    if (!trip) {
      throw new Error('Trip not found');
    }

    return trip;
  } catch (error) {
    logger.error(`Failed to get trip for tracking: ${error}`);
    throw error;
  }
};

/**
 * Trigger enhanced SOS
 */
export const triggerEnhancedSOS = async (
  tripId: Types.ObjectId,
  triggeredBy: 'passenger' | 'driver',
  userId: Types.ObjectId,
  location: { latitude: number; longitude: number }
): Promise<SOSEvent> => {
  try {
    const trip = await Trip.findById(tripId)
      .populate('passengerId')
      .populate('driverId');

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Update trip with SOS
    await Trip.findByIdAndUpdate(tripId, {
      sosTriggered: true,
      sosAt: new Date(),
      sosTriggeredBy: triggeredBy,
      sosLocation: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
    });

    const sosEvent: SOSEvent = {
      tripId,
      triggeredBy,
      userId,
      location,
      timestamp: new Date(),
      resolved: false,
    };

    // Get trip details for notifications
    const driver = await Driver.findById(trip.driverId).populate('userId');
    const passenger = await Passenger.findById(trip.passengerId).populate('userId');

    // Get emergency contacts if triggered by passenger
    if (triggeredBy === 'passenger' && passenger) {
      const contacts = (passenger as any)?.emergencyContacts || [];

      // Filter contacts that should be notified on SOS
      const sosContacts = contacts.filter((c: EmergencyContact) => c.notifyOnSOS);

      if (sosContacts.length > 0 && driver) {
        const passengerUser = await User.findById(passenger.userId);
        const driverUser = driver.userId as any;
        const vehicle = (driver as any).vehicle;

        // Send SMS to emergency contacts
        const smsResult = await smsService.sendSOSAlert({
          riderName: passengerUser?.name || 'راكب',
          riderPhone: (passengerUser as any)?.phone || '',
          driverName: driverUser?.name || 'سائق',
          driverPhone: driverUser?.phone || '',
          vehiclePlate: vehicle?.plateNumber || 'غير محدد',
          vehicleColor: vehicle?.color,
          vehicleModel: `${vehicle?.make} ${vehicle?.model}`,
          location: { lat: location.latitude, lng: location.longitude },
          emergencyContacts: sosContacts.map((c: EmergencyContact) => ({
            name: c.name,
            phone: c.phone,
          })),
          tripId: tripId.toString(),
        });

        logger.info(`SOS SMS sent: ${smsResult.sent} success, ${smsResult.failed} failed`);
      }
    }

    // Notify admin dashboard via socket
    emitToAdmin('trip:sos', {
      tripId,
      triggeredBy,
      userId,
      location,
      timestamp: new Date(),
      tripNumber: (trip as any).tripNumber,
    });

    // Also emit to emergency room
    emitToEmergency('sos:alert', {
      tripId,
      triggeredBy,
      userId,
      location,
      timestamp: new Date(),
    });

    logger.warn(`SOS triggered for trip ${tripId} by ${triggeredBy} ${userId}`);

    return sosEvent;
  } catch (error) {
    logger.error(`Failed to trigger enhanced SOS: ${error}`);
    throw error;
  }
};

/**
 * Resolve SOS event
 */
export const resolveSOS = async (
  tripId: Types.ObjectId,
  resolvedBy: Types.ObjectId,
  notes?: string
): Promise<boolean> => {
  try {
    await Trip.findByIdAndUpdate(tripId, {
      sosResolved: true,
      sosResolvedAt: new Date(),
      sosResolvedBy: resolvedBy,
      sosNotes: notes,
    });

    logger.info(`SOS resolved for trip ${tripId} by ${resolvedBy}`);
    return true;
  } catch (error) {
    logger.error(`Failed to resolve SOS: ${error}`);
    throw error;
  }
};

/**
 * Check if trip is in night mode (between 10 PM and 6 AM)
 */
export const isNightMode = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
};

/**
 * Get safety tips for trip
 */
export const getSafetyTips = (context: {
  isNight: boolean;
  isNewDriver: boolean;
  isLongTrip: boolean;
}): string[] => {
  const tips: string[] = [
    'تأكد من مطابقة رقم لوحة السيارة قبل الركوب',
    'شارك تفاصيل رحلتك مع شخص تثق به',
  ];

  if (context.isNight) {
    tips.push('تأكد من الجلوس في المقعد الخلفي ليلاً');
    tips.push('ابق على تواصل مع أحد أفراد عائلتك أثناء الرحلة');
  }

  if (context.isNewDriver) {
    tips.push('هذا السائق جديد في المنصة، تحقق من بياناته');
  }

  if (context.isLongTrip) {
    tips.push('في الرحلات الطويلة، أبلغ أحداً بموعد وصولك المتوقع');
  }

  return tips;
};

/**
 * Verify driver before trip
 */
export const verifyDriverForTrip = async (
  driverId: Types.ObjectId
): Promise<{
  verified: boolean;
  checks: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}> => {
  try {
    const driver = await Driver.findById(driverId).populate('userId');
    if (!driver) {
      throw new Error('Driver not found');
    }

    const checks = [
      {
        name: 'license_valid',
        passed: (driver as any).documents?.license?.verified || false,
        message: (driver as any).documents?.license?.verified
          ? 'رخصة القيادة موثقة'
          : 'رخصة القيادة غير موثقة',
      },
      {
        name: 'vehicle_inspection',
        passed: (driver as any).documents?.vehicleInspection?.verified || false,
        message: (driver as any).documents?.vehicleInspection?.verified
          ? 'فحص السيارة ساري'
          : 'فحص السيارة غير متوفر',
      },
      {
        name: 'insurance_valid',
        passed: (driver as any).documents?.insurance?.verified || false,
        message: (driver as any).documents?.insurance?.verified
          ? 'التأمين ساري'
          : 'التأمين غير متوفر',
      },
      {
        name: 'background_check',
        passed: (driver as any).backgroundCheckPassed || false,
        message: (driver as any).backgroundCheckPassed
          ? 'فحص الخلفية الأمنية مكتمل'
          : 'فحص الخلفية الأمنية غير مكتمل',
      },
    ];

    const allPassed = checks.every((c) => c.passed);

    return {
      verified: allPassed,
      checks,
    };
  } catch (error) {
    logger.error(`Failed to verify driver: ${error}`);
    throw error;
  }
};

/**
 * Send safety check to passenger
 */
export const sendSafetyCheck = async (
  tripId: Types.ObjectId,
  type: SafetyCheck['type'],
  message: string
): Promise<SafetyCheck> => {
  try {
    const safetyCheck: SafetyCheck = {
      tripId,
      type,
      message,
      responseRequired: true,
    };

    // Store safety check in trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const safetyChecks = (trip as any).safetyChecks || [];
    safetyChecks.push(safetyCheck);

    await Trip.findByIdAndUpdate(tripId, {
      safetyChecks,
      lastSafetyCheck: new Date(),
    });

    // TODO: Send push notification to passenger
    logger.info(`Safety check sent for trip ${tripId}: ${type}`);

    return safetyCheck;
  } catch (error) {
    logger.error(`Failed to send safety check: ${error}`);
    throw error;
  }
};

/**
 * Respond to safety check
 */
export const respondToSafetyCheck = async (
  tripId: Types.ObjectId,
  response: 'safe' | 'need_help'
): Promise<boolean> => {
  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const safetyChecks = (trip as any).safetyChecks || [];
    const lastCheck = safetyChecks[safetyChecks.length - 1];

    if (lastCheck) {
      lastCheck.respondedAt = new Date();
      lastCheck.response = response;

      await Trip.findByIdAndUpdate(tripId, { safetyChecks });
    }

    if (response === 'need_help') {
      // Auto-trigger SOS
      logger.warn(`Safety check response: need_help for trip ${tripId}`);
      // The socket handler should trigger SOS
    }

    logger.info(`Safety check response for trip ${tripId}: ${response}`);
    return true;
  } catch (error) {
    logger.error(`Failed to respond to safety check: ${error}`);
    throw error;
  }
};

/**
 * Auto-share trip with emergency contacts
 */
export const autoShareTripWithContacts = async (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId
): Promise<string[]> => {
  try {
    const passenger = await Passenger.findById(passengerId);
    if (!passenger) {
      throw new Error('Passenger not found');
    }

    const prefs = (passenger as any).safetyPreferences;
    if (!prefs?.autoShareTrips) {
      return [];
    }

    const contacts = (passenger as any).emergencyContacts || [];
    const contactsToNotify = prefs.shareWithContacts?.length
      ? contacts.filter((c: EmergencyContact) =>
          prefs.shareWithContacts.includes(c._id)
        )
      : contacts.filter((c: EmergencyContact) => c.notifyOnTrip);

    if (contactsToNotify.length === 0) {
      return [];
    }

    // Generate share link
    const shareLink = await generateTripShareLink(tripId);

    // Get trip details for SMS
    const trip = await Trip.findById(tripId)
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'name phone' },
      });

    const driver = trip?.driverId as any;
    const driverUser = driver?.userId;
    const vehicle = driver?.vehicle;
    const passengerUser = await User.findById(passenger.userId);

    // Send SMS to contacts
    const notifiedPhones: string[] = [];
    for (const contact of contactsToNotify) {
      const success = await smsService.sendRideShare({
        riderName: passengerUser?.name || 'راكب',
        driverName: driverUser?.name || 'سائق',
        driverPhone: driverUser?.phone || '',
        vehiclePlate: vehicle?.plateNumber || 'غير محدد',
        vehicleColor: vehicle?.color,
        vehicleModel: `${vehicle?.make} ${vehicle?.model}`,
        pickup: (trip as any)?.pickup?.address || '',
        dropoff: (trip as any)?.dropoff?.address || '',
        trackingUrl: shareLink.shareUrl,
        emergencyContact: { name: contact.name, phone: contact.phone },
      });

      if (success) {
        notifiedPhones.push(contact.phone);
        logger.info(`Auto-shared trip with ${contact.name} at ${contact.phone}`);
      }
    }

    return notifiedPhones;
  } catch (error) {
    logger.error(`Failed to auto-share trip: ${error}`);
    throw error;
  }
};

export default {
  addEmergencyContact,
  updateEmergencyContact,
  removeEmergencyContact,
  getEmergencyContacts,
  updateSafetyPreferences,
  getSafetyPreferences,
  generateTripShareLink,
  validateTripShareToken,
  getTripForTracking,
  triggerEnhancedSOS,
  resolveSOS,
  isNightMode,
  getSafetyTips,
  verifyDriverForTrip,
  sendSafetyCheck,
  respondToSafetyCheck,
  autoShareTripWithContacts,
};
