import Permission from '../models/Permission';
import Role from '../models/Role';
import User from '../models/PropertyUser';
import Feature from '../models/Feature';

const DEFAULT_PERMISSIONS = [
  { name: 'Properties Admin', feature: 'properties', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Properties Viewer', feature: 'properties', actions: ['read'] },
  { name: 'Floors Admin', feature: 'floors', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Floors Viewer', feature: 'floors', actions: ['read'] },
  { name: 'Rooms Admin', feature: 'rooms', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Rooms Viewer', feature: 'rooms', actions: ['read'] },
  { name: 'Beds Admin', feature: 'beds', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Beds Viewer', feature: 'beds', actions: ['read'] },
  { name: 'Allocations Admin', feature: 'allocations', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Allocations Viewer', feature: 'allocations', actions: ['read'] },
  { name: 'Users Admin', feature: 'users', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Users Viewer', feature: 'users', actions: ['read'] },
  { name: 'Tenants Admin', feature: 'tenants', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Tenants Viewer', feature: 'tenants', actions: ['read'] },
  { name: 'Expenses Admin', feature: 'expenses', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Expenses Viewer', feature: 'expenses', actions: ['read'] },
  { name: 'Complaints Admin', feature: 'complaints', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Complaints Viewer', feature: 'complaints', actions: ['read'] },
  { name: 'Announcements Admin', feature: 'announcements', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Announcements Viewer', feature: 'announcements', actions: ['read'] },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'Properties Admin', 'Floors Admin', 'Rooms Admin', 'Beds Admin', 
    'Allocations Admin', 'Users Admin', 'Tenants Admin', 
    'Expenses Admin', 'Complaints Admin', 'Announcements Admin'
  ],
  manager: [
    'Properties Viewer', 'Floors Admin', 'Rooms Admin', 'Beds Admin',
    'Allocations Admin', 'Users Admin', 'Tenants Admin',
    'Expenses Admin', 'Complaints Admin', 'Announcements Admin'
  ],
  user: ['Properties Viewer', 'Floors Viewer', 'Rooms Viewer', 'Beds Viewer', 'Allocations Viewer'],
};

class RbacService {
  async ensureDefaults(): Promise<void> {
    // 1. Create Features
    const featureKeys = [...new Set(DEFAULT_PERMISSIONS.map((p) => p.feature))];
    const features = await Promise.all(
      featureKeys.map((key) =>
        Feature.findOneAndUpdate(
          { key },
          { name: key.charAt(0).toUpperCase() + key.slice(1), key },
          { upsert: true, new: true },
        ),
      ),
    );

    const featureMap = new Map(features.map((f) => [f.key, f._id]));

    // 2. Create Permissions
    await Promise.all(
      DEFAULT_PERMISSIONS.map((p) =>
        Permission.findOneAndUpdate(
          { name: p.name },
          { name: p.name, featureId: featureMap.get(p.feature), actions: p.actions },
          { upsert: true, new: true },
        ),
      ),
    );

    // 3. Create Roles
    for (const [roleName, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const permissions = await Permission.find({ name: { $in: permissionNames } }).select('_id');
      await Role.findOneAndUpdate(
        { name: roleName },
        {
          name: roleName,
          description: `${roleName} role`,
          permissionIds: permissions.map((p) => p._id),
        },
        { upsert: true, new: true },
      );
    }
  }

  async getRoleIdsByNames(roleNames: string[]) {
    const normalized = [...new Set(roleNames.map((r) => r.trim().toLowerCase()))];
    const roles = await Role.find({ name: { $in: normalized } }).select('_id name');
    if (roles.length !== normalized.length) {
      const found = new Set(roles.map((role) => role.name));
      const missing = normalized.filter((name) => !found.has(name));
      throw new Error(`Invalid role(s): ${missing.join(', ')}`);
    }
    return roles.map((role) => role._id);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await User.findById(userId).populate({
      path: 'roleIds',
      populate: { 
        path: 'permissionIds', 
        model: 'Permission',
        populate: { path: 'featureId', model: 'Feature' }
      },
    });

    if (!user) return [];

    const permissionNames = new Set<string>();
    (user.roleIds as any[]).forEach((role: any) => {
      (role.permissionIds || []).forEach((permission: any) => {
        if (permission.featureId && permission.actions) {
          permission.actions.forEach((action: string) => {
            permissionNames.add(`${permission.featureId.key}:${action}`);
          });
        }
      });
    });
    return Array.from(permissionNames);
  }

  // Management Methods
  async getAllRoles() {
    return Role.find().populate({
      path: 'permissionIds',
      populate: { path: 'featureId' },
    });
  }

  async getRoleById(id: string) {
    return Role.findById(id).populate({
      path: 'permissionIds',
      populate: { path: 'featureId' },
    });
  }

  async getAllPermissions() {
    return Permission.find().populate('featureId');
  }

  async createRole(data: { name: string; description?: string; permissionIds?: string[] }) {
    return Role.create(data);
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissionIds?: string[] }) {
    return Role.findByIdAndUpdate(id, data, { new: true }).populate('permissionIds');
  }

  async deleteRole(id: string) {
    return Role.findByIdAndDelete(id);
  }

  async assignRoleToUser(userId: string, roleIds: string[]) {
    return User.findByIdAndUpdate(userId, { roleIds }, { new: true }).populate('roleIds');
  }

  async bindPermissionToRole(featureId: string, actions: string[], roleId: string) {
    // 1. Find or create the permission
    const feature = await Feature.findById(featureId);
    if (!feature) throw new Error('Feature not found');

    const permissionName = `${feature.key} [${[...actions].sort().join(',')}]`;
    let permission = await Permission.findOne({ name: permissionName });

    if (!permission) {
      permission = await Permission.create({
        name: permissionName,
        featureId,
        actions,
      });
    }

    // 2. Add permission to role
    return Role.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissionIds: permission._id } },
      { new: true },
    ).populate({
      path: 'permissionIds',
      populate: { path: 'featureId' },
    });
  }
}

export default new RbacService();
