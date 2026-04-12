import Permission from '../models/Permission';
import Role from '../models/Role';
import User from '../models/PropertyUser';

const DEFAULT_PERMISSIONS = [
  { name: 'properties:read', resource: 'properties', action: 'read' },
  { name: 'properties:write', resource: 'properties', action: 'write' },
  { name: 'floors:read', resource: 'floors', action: 'read' },
  { name: 'floors:write', resource: 'floors', action: 'write' },
  { name: 'rooms:read', resource: 'rooms', action: 'read' },
  { name: 'rooms:write', resource: 'rooms', action: 'write' },
  { name: 'beds:read', resource: 'beds', action: 'read' },
  { name: 'beds:write', resource: 'beds', action: 'write' },
  { name: 'allocations:read', resource: 'allocations', action: 'read' },
  { name: 'allocations:write', resource: 'allocations', action: 'write' },
  { name: 'users:roles:update', resource: 'users', action: 'roles:update' },
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
  ],
  user: ['properties:read', 'floors:read', 'rooms:read', 'beds:read', 'allocations:read'],
};

class RbacService {
  async ensureDefaults(): Promise<void> {
    await Promise.all(
      DEFAULT_PERMISSIONS.map((permission) =>
        Permission.findOneAndUpdate({ name: permission.name }, permission, { upsert: true, new: true }),
      ),
    );

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
}

export default new RbacService();
