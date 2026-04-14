import Permission from '../models/Permission';
import Role from '../models/Role';
import User from '../models/PropertyUser';
import Feature from '../models/Feature';

const DEFAULT_PERMISSIONS = [
  { name: 'properties:read', feature: 'properties', action: 'read' },
  { name: 'properties:write', feature: 'properties', action: 'write' },
  { name: 'floors:read', feature: 'floors', action: 'read' },
  { name: 'floors:write', feature: 'floors', action: 'write' },
  { name: 'rooms:read', feature: 'rooms', action: 'read' },
  { name: 'rooms:write', feature: 'rooms', action: 'write' },
  { name: 'beds:read', feature: 'beds', action: 'read' },
  { name: 'beds:write', feature: 'beds', action: 'write' },
  { name: 'allocations:read', feature: 'allocations', action: 'read' },
  { name: 'allocations:write', feature: 'allocations', action: 'write' },
  { name: 'users:read', feature: 'users', action: 'read' },
  { name: 'users:write', feature: 'users', action: 'write' },
  { name: 'users:delete', feature: 'users', action: 'delete' },
  { name: 'users:roles:update', feature: 'users', action: 'roles:update' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: DEFAULT_PERMISSIONS.map((p) => p.name),
  manager: [
    'properties:read',
    'properties:write',
    'floors:read',
    'floors:write',
    'rooms:read',
    'rooms:write',
    'beds:read',
    'beds:write',
    'allocations:read',
    'allocations:write',
    'users:read',
    'users:write',
  ],
  user: ['properties:read', 'floors:read', 'rooms:read', 'beds:read', 'allocations:read'],
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
          { name: p.name, featureId: featureMap.get(p.feature), action: p.action },
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
      populate: { path: 'permissionIds', model: 'Permission' },
    });

    if (!user) return [];

    const permissionNames = new Set<string>();
    (user.roleIds as any[]).forEach((role: any) => {
      (role.permissionIds || []).forEach((permission: any) => permissionNames.add(permission.name));
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

  async bindPermissionToRole(featureId: string, action: string, roleId: string) {
    // 1. Find or create the permission
    const feature = await Feature.findById(featureId);
    if (!feature) throw new Error('Feature not found');

    const permissionName = `${feature.key}:${action}`;
    let permission = await Permission.findOne({ name: permissionName });

    if (!permission) {
      permission = await Permission.create({
        name: permissionName,
        featureId,
        action,
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
