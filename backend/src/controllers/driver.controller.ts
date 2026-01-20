import { Request, Response, NextFunction } from 'express';
import Driver from '../models/Driver';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Type for multer files
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

/**
 * Upload driver documents (batch)
 * POST /api/v1/driver/documents/batch
 */
export const uploadDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Find driver by user ID
    const driver = await Driver.findOne({ userId });
    if (!driver) {
      throw new NotFoundError('Driver profile not found', 'ملف السائق غير موجود');
    }

    // Get uploaded files (cast to proper type)
    const files = (req as any).files as { [fieldname: string]: MulterFile[] };

    if (!files || Object.keys(files).length === 0) {
      throw new BadRequestError('No files uploaded', 'لم يتم رفع أي ملفات');
    }

    // Map file paths to driver documents
    const documentUpdates: Record<string, string> = {};
    const vehicleUpdates: Record<string, string> = {};

    for (const [fieldname, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const filePath = `/uploads/documents/${fileArray[0].filename}`;

        // Map to appropriate document field
        switch (fieldname) {
          case 'nationalIdFront':
            documentUpdates['documents.nationalIdFront'] = filePath;
            break;
          case 'nationalIdBack':
            documentUpdates['documents.nationalIdBack'] = filePath;
            break;
          case 'driverLicense':
          case 'drivingLicenseFront':
            documentUpdates['documents.drivingLicenseFront'] = filePath;
            break;
          case 'drivingLicenseBack':
            documentUpdates['documents.drivingLicenseBack'] = filePath;
            break;
          case 'criminalRecord':
            documentUpdates['documents.criminalRecord'] = filePath;
            break;
          case 'vehicleLicense':
            vehicleUpdates['vehicle.registrationImage'] = filePath;
            break;
          case 'vehiclePhoto':
            vehicleUpdates['vehicle.vehicleImage'] = filePath;
            break;
        }
      }
    }

    // Update driver with document paths
    const updatedDriver = await Driver.findByIdAndUpdate(
      driver._id,
      {
        $set: {
          ...documentUpdates,
          ...vehicleUpdates
        }
      },
      { new: true }
    );

    sendSuccess(
      res,
      {
        documents: updatedDriver?.documents,
        uploadedCount: Object.keys(files).length,
      },
      'Documents uploaded successfully',
      'تم رفع المستندات بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get driver status (approval, online status, earnings)
 * GET /api/v1/driver/status
 */
export const getDriverStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const driver = await Driver.findOne({ userId }).select(
      'status isOnline isAvailable isBusy totalEarnings totalTrips rating documents vehicle'
    );
    if (!driver) {
      throw new NotFoundError('Driver profile not found', 'ملف السائق غير موجود');
    }

    // Calculate online status
    let onlineStatus: 'offline' | 'online' | 'busy' = 'offline';
    if (driver.isOnline) {
      onlineStatus = driver.isBusy ? 'busy' : 'online';
    }

    // Check if documents are verified (basic check - all required docs uploaded)
    const docs = driver.documents;
    const documentsVerified = !!(
      docs?.nationalIdFront &&
      docs?.nationalIdBack &&
      docs?.drivingLicenseFront
    );

    sendSuccess(
      res,
      {
        approvalStatus: driver.status,
        onlineStatus,
        isOnline: driver.isOnline,
        isAvailable: driver.isAvailable,
        isBusy: driver.isBusy,
        totalEarnings: driver.totalEarnings || 0,
        totalTrips: driver.totalTrips || 0,
        rating: driver.rating || 0,
        documentsVerified,
        vehicleType: driver.vehicle?.type,
        vehicleCategory: driver.vehicle?.category,
        isApproved: driver.status === 'approved',
        canGoOnline: driver.status === 'approved',
      },
      'Driver status retrieved successfully',
      'تم استرجاع حالة السائق بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get driver documents status
 * GET /api/v1/driver/documents
 */
export const getDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const driver = await Driver.findOne({ userId }).select('documents vehicle.vehicleImage vehicle.registrationImage');
    if (!driver) {
      throw new NotFoundError('Driver profile not found', 'ملف السائق غير موجود');
    }

    sendSuccess(
      res,
      {
        documents: driver.documents,
        vehicleImage: driver.vehicle?.vehicleImage,
        registrationImage: driver.vehicle?.registrationImage,
      },
      'Documents retrieved',
      'تم جلب المستندات'
    );
  } catch (error) {
    next(error);
  }
};

export default {
  uploadDocuments,
  getDocuments,
  getDriverStatus,
};
