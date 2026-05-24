import Tenant, { ITenant } from '../models/Tenant';
import TenantAllocation, { ITenantAllocation } from '../models/TenantAllocation';
import PropertyInventoryAllocation, { IPropertyInventoryAllocation } from '../models/PropertyInventoryAllocation';
import RentLedgerService from './RentLedgerService';

type TenantAllocationCreateInput = {
  tenantId: string;
  inventoryAllocationId: string;
  propertyId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  roomCategoryId: string;
  rentAmount: number;
  depositAmount: number;
  startDate: Date | string;
  endDate?: Date | string;
  status?: 'active' | 'inactive' | 'terminated' | 'notice';
  notes?: string;
  createdById: string;
};

type CreateTenantAllocationInput = {
  fullName: string;
  phoneNumber: string;
  email: string;
  joiningDate: Date | string;
  propertyId: string;
  roomId: string;
  bedId: string;
  inventoryAllocationId?: string;
  alternateNumber?: string;
  emergencyContactNumber?: string;
  homeContactNumber?: string;
  rentAmount: number;
  depositAmount: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: 'active' | 'inactive' | 'terminated' | 'notice';
  notes?: string;
};

type VacantBedData = {
  inventoryAllocationId: string;
  propertyId: any;
  floorId: any;
  roomId: any;
  bedId: any;
  roomCategoryId: any;
  notes?: string;
  status: string;
};

type VacantRoomData = {
  roomId: string;
  room: any;
  floor: any;
  property: any;
  vacantBeds: VacantBedData[];
};

export default class TenantAllocationService {
  // ✅ Create a single allocation
  static async createAllocation(data: TenantAllocationCreateInput): Promise<ITenantAllocation> {
    const occupiedAllocation = await TenantAllocation.findOne({
      inventoryAllocationId: data.inventoryAllocationId,
      status: { $in: ['active', 'notice'] },
    });

    if (occupiedAllocation) {
      throw new Error('This inventory allocation is already assigned to an active tenant');
    }

    return TenantAllocation.create({
      ...data,
      status: data.status || 'active',
    });
  }

  // ✅ Resolve Inventory Allocation by ID or (Property, Room, Bed)
  private static async resolveInventoryAllocation(data: {
    inventoryAllocationId?: string;
    propertyId: string;
    roomId: string;
    bedId: string;
  }): Promise<IPropertyInventoryAllocation> {
    const filter: any = data.inventoryAllocationId
      ? { _id: data.inventoryAllocationId, status: 'active' }
      : {
        propertyId: data.propertyId,
        roomId: data.roomId,
        bedId: data.bedId,
        status: 'active',
      };

    const inventoryAllocation = await PropertyInventoryAllocation.findOne(filter)
      .populate('propertyId')
      .populate('floorId')
      .populate('roomId')
      .populate('bedId')
      .populate('roomCategoryId');

    if (!inventoryAllocation) {
      throw new Error('Selected bed is not available in property inventory');
    }

    const occupiedAllocation = await TenantAllocation.findOne({
      inventoryAllocationId: inventoryAllocation._id,
      status: { $in: ['active', 'notice'] },
    });

    if (occupiedAllocation) {
      throw new Error('Selected bed is already occupied');
    }

    return inventoryAllocation;
  }

  // ✅ Get Vacant Inventory (Beds grouped by Rooms)
  static async getVacantInventory(propertyId: string): Promise<VacantRoomData[]> {
    const inventoryAllocations = await PropertyInventoryAllocation.find({
      propertyId,
      status: 'active',
    })
      .populate('propertyId')
      .populate('floorId')
      .populate('roomId')
      .populate('bedId')
      .populate('roomCategoryId')
      .sort({ createdAt: 1 });

    const inventoryIds = inventoryAllocations.map((item) => item._id);
    const activeTenantAllocations = await TenantAllocation.find({
      inventoryAllocationId: { $in: inventoryIds },
      status: { $in: ['active', 'notice'] },
    }).select('inventoryAllocationId');

    const occupiedInventoryIds = new Set(
      activeTenantAllocations.map((item) => item.inventoryAllocationId.toString()),
    );

    const rooms = new Map<string, VacantRoomData>();

    for (const item of inventoryAllocations) {
      const inventoryAllocationId = item._id.toString();
      if (occupiedInventoryIds.has(inventoryAllocationId)) {
        continue;
      }

      const roomId = (item.roomId as any)._id.toString();
      const vacantBed: VacantBedData = {
        inventoryAllocationId,
        propertyId: item.propertyId,
        floorId: item.floorId,
        roomId: item.roomId,
        bedId: item.bedId,
        roomCategoryId: item.roomCategoryId,
        notes: item.notes,
        status: item.status,
      };

      const existingRoom = rooms.get(roomId);
      if (existingRoom) {
        existingRoom.vacantBeds.push(vacantBed);
        continue;
      }

      rooms.set(roomId, {
        roomId,
        room: item.roomId,
        floor: item.floorId,
        property: item.propertyId,
        vacantBeds: [vacantBed],
      });
    }

    // Convert map to array and sort by room.keyNumber
    const result = Array.from(rooms.values()).sort((a, b) => {
      const keyA = a.room?.keyNumber || 0;
      const keyB = b.room?.keyNumber || 0;
      return keyA - keyB;
    });

    // Sort vacant beds within each room by bed.keyNumber
    result.forEach((roomData) => {
      roomData.vacantBeds.sort((a, b) => {
        const keyA = (a.bedId as any)?.keyNumber || 0;
        const keyB = (b.bedId as any)?.keyNumber || 0;
        return keyA - keyB;
      });
    });

    return result;
  }

  // ✅ Create Tenant and Allocation in one flow (with Rollback)
  static async createCompleteAllocation(
    input: CreateTenantAllocationInput,
    createdById: string,
  ): Promise<{ tenant: ITenant; allocation: ITenantAllocation; inventoryAllocation: IPropertyInventoryAllocation }> {
    const inventoryAllocation = await this.resolveInventoryAllocation({
      inventoryAllocationId: input.inventoryAllocationId,
      propertyId: input.propertyId,
      roomId: input.roomId,
      bedId: input.bedId,
    });

    const tenant = await Tenant.create({
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      email: input.email,
      joiningDate: input.joiningDate,
      alternateNumber: input.alternateNumber,
      emergencyContactNumber: input.emergencyContactNumber || input.phoneNumber,
      homeContactNumber: input.homeContactNumber,
      createdById,
    });

    try {
      const allocation = await this.createAllocation({
        tenantId: tenant._id.toString(),
        inventoryAllocationId: inventoryAllocation._id.toString(),
        propertyId: inventoryAllocation.propertyId._id.toString(),
        floorId: inventoryAllocation.floorId._id.toString(),
        roomId: inventoryAllocation.roomId._id.toString(),
        bedId: inventoryAllocation.bedId._id.toString(),
        roomCategoryId: inventoryAllocation.roomCategoryId._id.toString(),
        rentAmount: input.rentAmount,
        depositAmount: input.depositAmount,
        startDate: input.startDate || input.joiningDate,
        endDate: input.endDate,
        status: input.status || 'active',
        notes: input.notes,
        createdById,
      });

      // ✅ Auto-generate initial RentLedgers (from joining month to current month)
      try {
        await RentLedgerService.generateInitialLedgers(
          allocation._id.toString(),
          createdById
        );
      } catch (ledgerErr: any) {
        // Rollback allocation if ledger generation fails (rare but possible)
        await Tenant.findByIdAndDelete(tenant._id);
        await TenantAllocation.findByIdAndDelete(allocation._id);
        throw ledgerErr;
      }

      return { tenant, allocation, inventoryAllocation };
    } catch (error) {
      // Rollback: Delete the created tenant if allocation fails
      await Tenant.findByIdAndDelete(tenant._id);
      throw error;
    }
  }

  // ✅ Helper to sort tenant allocations by floor, room, and bed keyNumber
  private static sortTenantAllocations(allocations: ITenantAllocation[]): ITenantAllocation[] {
    return allocations.sort((a, b) => {
      const invA = a.inventoryAllocationId as any;
      const invB = b.inventoryAllocationId as any;

      const floorA = invA?.floorId?.keyNumber || 0;
      const floorB = invB?.floorId?.keyNumber || 0;
      if (floorA !== floorB) return floorA - floorB;

      const roomA = invA?.roomId?.keyNumber || 0;
      const roomB = invB?.roomId?.keyNumber || 0;
      if (roomA !== roomB) return roomA - roomB;

      const bedA = invA?.bedId?.keyNumber || 0;
      const bedB = invB?.bedId?.keyNumber || 0;
      return bedA - bedB;
    });
  }

  static async getAllAllocations(page: number = 1, limit: number = 10): Promise<{ data: ITenantAllocation[], total: number }> {
    const skip = (page - 1) * limit;
    const [allocations, total] = await Promise.all([
      TenantAllocation.find()
        .populate('tenantId')
        .populate({
          path: 'inventoryAllocationId',
          populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
        })
        .populate('createdById', 'name email')
        .skip(skip)
        .limit(limit),
      TenantAllocation.countDocuments()
    ]);

    return { data: this.sortTenantAllocations(allocations), total };
  }

  static async getByPropertyId(propertyId: string, page: number = 1, limit: number = 10): Promise<{ data: ITenantAllocation[], total: number }> {
    const inventoryAllocations = await PropertyInventoryAllocation.find({ propertyId }).select('_id');
    const inventoryIds = inventoryAllocations.map((item) => item._id);

    const query = { inventoryAllocationId: { $in: inventoryIds } };
    const skip = (page - 1) * limit;

    const [allocations, total] = await Promise.all([
      TenantAllocation.find(query)
        .populate('tenantId')
        .populate({
          path: 'inventoryAllocationId',
          populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
        })
        .populate('createdById', 'name email')
        .skip(skip)
        .limit(limit),
      TenantAllocation.countDocuments(query)
    ]);

    return { data: this.sortTenantAllocations(allocations), total };
  }

  static async getAllocationById(id: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findById(id)
      .populate('tenantId')
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      })
      .populate('createdById', 'name email');
  }

  static async updateAllocation(id: string, data: Partial<TenantAllocationCreateInput>): Promise<ITenantAllocation | null> {
    return TenantAllocation.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteAllocation(id: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findByIdAndDelete(id);
  }

  // ✅ Initiate Exit (Update endDate)
  static async initiateExit(
    id: string,
    exitDate: Date | string,
    propertyUserId?: string,
    initiatedBy: 'tenant' | 'landlord' = 'landlord'
  ): Promise<ITenantAllocation | null> {
    const allocation = await TenantAllocation.findById(id);
    if (!allocation) throw new Error('Allocation not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetExitDate = new Date(exitDate);
    targetExitDate.setHours(0, 0, 0, 0);

    const timeDiff = targetExitDate.getTime() - today.getTime();
    const servedDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const noticePeriodDays = Math.max(0, servedDays);

    let refundPercentage = 0;
    if (noticePeriodDays >= 30) {
      refundPercentage = 100;
    } else if (noticePeriodDays > 21) {
      refundPercentage = 75;
    } else if (noticePeriodDays > 14) {
      refundPercentage = 50;
    } else if (noticePeriodDays > 7) {
      refundPercentage = 25;
    } else {
      refundPercentage = 0;
    }

    const now = new Date();
    const refundAmount = (refundPercentage / 100) * (allocation.depositAmount || 0);
    const isLandlord = initiatedBy === 'landlord';

    allocation.endDate = targetExitDate;
    allocation.exitInitiatedAt = now;
    allocation.eligibleRefundPercentage = refundPercentage;
    allocation.eligibleRefundAmount = refundAmount;
    allocation.moveOutInitiatedBy = initiatedBy;
    allocation.moveOutStatus = isLandlord ? 'approved' : 'pending';
    if (isLandlord) {
      allocation.moveOutAcknowledgedAt = now;
    }

    if (propertyUserId) {
      const mongoose = await import('mongoose');
      allocation.propertyUserId = new mongoose.default.Types.ObjectId(propertyUserId);
    }

    // Append to exit journey log
    const logEntry: any = {
      exitDate: targetExitDate,
      exitInitiatedAt: now,
      moveOutStatus: isLandlord ? 'approved' : 'pending',
      moveOutInitiatedBy: initiatedBy,
      eligibleRefundPercentage: refundPercentage,
      eligibleRefundAmount: refundAmount,
      ...(isLandlord ? { moveOutAcknowledgedAt: now } : {}),
    };
    allocation.exitLog = [...(allocation.exitLog || []), logEntry];

    return allocation.save();
  }

  // ✅ Move-out List (Landlord) — paginated with filters
  static async getMoveOutList(filters: {
    propertyId?: string;
    moveOutStatus?: string;
    page: number;
    limit: number;
  }): Promise<{ data: ITenantAllocation[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = { exitInitiatedAt: { $exists: true } };

    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.moveOutStatus) query.moveOutStatus = filters.moveOutStatus;

    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await Promise.all([
      TenantAllocation.find(query)
        .populate('tenantId', 'fullName phoneNumber email profileImage')
        .populate('propertyId', 'name')
        .populate('roomId', 'name keyNumber')
        .populate('bedId', 'name keyNumber')
        .sort({ exitInitiatedAt: -1 })
        .skip(skip)
        .limit(filters.limit),
      TenantAllocation.countDocuments(query),
    ]);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // ✅ Move-out Detail (Landlord)
  static async getMoveOutDetail(allocationId: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findById(allocationId)
      .populate('tenantId', 'fullName phoneNumber email profileImage kyc')
      .populate('propertyId', 'name address')
      .populate('roomId', 'name keyNumber')
      .populate('bedId', 'name keyNumber')
      .populate('floorId', 'name keyNumber')
      .populate('createdById', 'name');
  }

  // ✅ Approve Move-out (Landlord)
  static async approveMoveOut(allocationId: string): Promise<ITenantAllocation | null> {
    const allocation = await TenantAllocation.findById(allocationId);
    if (!allocation) throw new Error('Allocation not found');
    if (!allocation.exitInitiatedAt) throw new Error('No move-out request found for this allocation');

    allocation.moveOutStatus = 'approved';
    allocation.moveOutAcknowledgedAt = new Date();

    // Update last exitLog entry to approved
    if (allocation.exitLog && allocation.exitLog.length > 0) {
      const last = allocation.exitLog.length - 1;
      allocation.exitLog[last].moveOutStatus = 'approved';
      allocation.exitLog[last].moveOutAcknowledgedAt = allocation.moveOutAcknowledgedAt;
      allocation.markModified('exitLog');
    }

    const updated = await allocation.save();

    try {
      const NotificationService = (await import('./NotificationService')).default;
      const { NotificationType, NotificationScreen } = await import('./NotificationService');
      await NotificationService.notifyTenant(
        allocation.tenantId.toString(),
        'Move-out Approved',
        `Your move-out request has been approved. Exit date: ${allocation.endDate ? new Date(allocation.endDate).toLocaleDateString() : 'N/A'}.`,
        NotificationType.ALLOCATION,
        { screen: NotificationScreen.TENANT_MOVE_OUT, allocationId }
      );
    } catch (err) {
      console.error('Failed to notify tenant of move-out approval:', err);
    }

    return updated;
  }

  // ✅ Reject Move-out (Landlord)
  static async rejectMoveOut(allocationId: string, reason?: string): Promise<ITenantAllocation | null> {
    const allocation = await TenantAllocation.findById(allocationId);
    if (!allocation) throw new Error('Allocation not found');
    if (!allocation.exitInitiatedAt) throw new Error('No move-out request found for this allocation');

    // Update last exitLog entry to revoked
    if (allocation.exitLog && allocation.exitLog.length > 0) {
      const last = allocation.exitLog.length - 1;
      allocation.exitLog[last].moveOutStatus = 'revoked';
      if (reason) allocation.exitLog[last].moveOutRejectionReason = reason;
      allocation.markModified('exitLog');
    }

    // Reset root-level exit fields so tenant can raise a new request
    allocation.exitInitiatedAt = undefined;
    allocation.moveOutStatus = undefined;
    allocation.moveOutInitiatedBy = undefined;
    allocation.moveOutRejectionReason = undefined;
    allocation.moveOutAcknowledgedAt = undefined;
    allocation.endDate = undefined;
    allocation.eligibleRefundPercentage = 0;
    allocation.eligibleRefundAmount = 0;

    const updated = await allocation.save();

    try {
      const NotificationService = (await import('./NotificationService')).default;
      const { NotificationType, NotificationScreen } = await import('./NotificationService');
      await NotificationService.notifyTenant(
        allocation.tenantId.toString(),
        'Move-out Rejected',
        reason
          ? `Your move-out request was rejected. Reason: ${reason}`
          : 'Your move-out request was rejected by the landlord.',
        NotificationType.ALLOCATION,
        { screen: NotificationScreen.TENANT_MOVE_OUT, allocationId }
      );
    } catch (err) {
      console.error('Failed to notify tenant of move-out rejection:', err);
    }

    return updated;
  }
}