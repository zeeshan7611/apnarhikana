import Tenant, { ITenant } from '../models/Tenant';
import TenantAllocation, { ITenantAllocation } from '../models/TenantAllocation';
import RentLedger, { IRentLedger } from '../models/RentLedger';
import Complaint, { IComplaint } from '../models/Complaint';
import Announcement, { IAnnouncement } from '../models/Announcement';
import PaymentTransaction from '../models/PaymentTransaction';
import Property from '../models/Property';
import Notification, { INotification } from '../models/Notification';
import ExtraCharge from '../models/ExtraCharge';
import { generateToken } from '../middleware/jwtAuth';

export default class TenantAppService {
  // ✅ 1. Send OTP
  static async sendOTP(phoneNumber: string): Promise<{ message: string; otp: string }> {
    const tenant = await Tenant.findOne({ phoneNumber });
    if (!tenant) throw new Error('Tenant not found with this mobile number');

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    tenant.otp = otp;
    tenant.otpExpiry = otpExpiry;
    await tenant.save();

    // Mock sending OTP (In production, use SMS gateway)
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    return { message: 'OTP sent successfully', otp }; // Returning OTP for dev/testing
  }

  // ✅ 2. Verify OTP & Login
  static async verifyOTP(phoneNumber: string, otp: string): Promise<{ tenant: ITenant; allocation: ITenantAllocation | null; token: string }> {
    const tenant = await Tenant.findOne({ phoneNumber });
    if (!tenant) throw new Error('Tenant not found');

    if (!tenant.otp || tenant.otp !== otp) throw new Error('Invalid OTP');
    if (!tenant.otpExpiry || tenant.otpExpiry < new Date()) throw new Error('OTP expired');

    // Clear OTP after verification
    tenant.otp = undefined;
    tenant.otpExpiry = undefined;
    await tenant.save();

    // Get active allocation
    const allocation = await TenantAllocation.findOne({ tenantId: tenant._id, status: 'active' })
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      });

    const token = generateToken({ id: tenant._id, role: 'tenant', phoneNumber: tenant.phoneNumber });

    return { tenant, allocation, token };
  }

  // ✅ 3. Get Pending Rent Details (Multiple months if due)
  static async getRentDetail(tenantId: string): Promise<{ ledgers: any[]; extraCharges: any[] }> {
    const ledgers = await RentLedger.find({ 
      tenantId, 
      status: { $in: ['pending', 'partial', 'overdue'] } 
    })
    .populate('propertyId', 'name contacts')
    .sort({ month: 1 });

    const ledgerIds = ledgers.map(l => l._id);
    const extraCharges = await ExtraCharge.find({ rentLedgerId: { $in: ledgerIds } });

    return {
      ledgers,
      extraCharges
    };
  }

  // ✅ 4. Create Complaint (delegates to Complaint model)
  static async createComplaint(tenantId: string, data: any): Promise<IComplaint> {
    const activeAllocation = await TenantAllocation.findOne({ tenantId, status: 'active' });
    if (!activeAllocation) throw new Error('No active allocation found for tenant');

    return Complaint.create({
      ...data,
      tenantId,
      propertyId: activeAllocation.propertyId,
    });
  }

  // ✅ 5. Get Complete Allocation Detail
  static async getAllocationDetail(tenantId: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findOne({ tenantId, status: 'active' })
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      })
      .populate('tenantId');
  }

  // ✅ 6. Get Recent Announcements for Property/Floor/Room
  static async getAnnouncements(tenantId: string): Promise<IAnnouncement[]> {
    const allocation = await TenantAllocation.findOne({ tenantId, status: 'active' });
    if (!allocation) return [];

    const query = {
      $or: [
        { tenantId },
        { propertyId: allocation.propertyId },
        { floorId: allocation.floorId },
        { roomId: allocation.roomId },
        { propertyId: { $exists: false }, floorId: { $exists: false }, roomId: { $exists: false }, tenantId: { $exists: false } } // Global announcements?
      ]
    };

    return Announcement.find(query)
      .populate('propertyId', 'name')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
  }

  // ✅ 7. Get Complaints (Tenant Wise with Pagination)
  static async getComplaints(
    tenantId: string, 
    page: number = 1, 
    limit: number = 10,
    filters: { status?: string; category?: string; priority?: string } = {}
  ): Promise<{ complaints: IComplaint[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const query: any = { tenantId };
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;

    const [complaints, total] = await Promise.all([
      Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(query)
    ]);
    return { complaints, total };
  }

  // ✅ 8. Get Payment Transaction History (Tenant Wise with Pagination)
  static async getTransactionHistory(
    tenantId: string, 
    page: number = 1, 
    limit: number = 10,
    status?: string
  ): Promise<{ transactions: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = { tenantId };
    if (status) query.status = status;

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PaymentTransaction.countDocuments(query)
    ]);
    return { transactions, total };
  }

  // ✅ 9. Get Property Contact Details
  static async getPropertyContactDetails(propertyId: string): Promise<any> {
    const property = await Property.findById(propertyId).select('contacts name address');
    if (!property) throw new Error('Property not found');
    return property;
  }

  // ✅ 10. Get Notifications (Tenant Wise with Pagination)
  static async getNotifications(tenantId: string, page: number = 1, limit: number = 10): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Get active allocation to check property-wide notifications
    const allocation = await TenantAllocation.findOne({ tenantId, status: 'active' });
    
    const query = {
      $or: [
        { tenantId },
        { propertyId: allocation?.propertyId },
        { tenantId: { $exists: false }, propertyId: { $exists: false } } // Global notifications
      ]
    };

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query)
    ]);
    return { notifications, total };
  }

  // ✅ 11. Mark Notification as Read
  static async markNotificationAsRead(notificationId: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }
}
