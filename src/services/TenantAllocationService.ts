import Tenant, { ITenant } from '../models/Tenant';
import TenantAllocation, { ITenantAllocation } from '../models/TenantAllocation';
import PropertyInventoryAllocation, { IPropertyInventoryAllocation } from '../models/PropertyInventoryAllocation';

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

    return Array.from(rooms.values());
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

      return { tenant, allocation, inventoryAllocation };
    } catch (error) {
      // Rollback: Delete the created tenant if allocation fails
      await Tenant.findByIdAndDelete(tenant._id);
      throw error;
    }
  }

  static async getAllAllocations(): Promise<ITenantAllocation[]> {
    return TenantAllocation.find()
      .populate('tenantId')
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      })
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 });
  }

  static async getByPropertyId(propertyId: string): Promise<ITenantAllocation[]> {
    const inventoryAllocations = await PropertyInventoryAllocation.find({ propertyId }).select('_id');
    const inventoryIds = inventoryAllocations.map((item) => item._id);

    return TenantAllocation.find({ inventoryAllocationId: { $in: inventoryIds } })
      .populate('tenantId')
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      })
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 });
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