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
  status?: 'active' | 'inactive' | 'terminated';
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
  status?: 'active' | 'inactive' | 'terminated';
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
      status: 'active',
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
      status: 'active',
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
      status: 'active',
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
}