import Permission from '../models/Permission';
import Role from '../models/Role';
import User from '../models/PropertyUser';
import Module from '../models/Module';

const DEFAULT_PERMISSIONS = [
  { name: 'Properties Admin', moduleKey: 'properties', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Properties Viewer', moduleKey: 'properties', actions: ['read'] },
  { name: 'Floors Admin', moduleKey: 'floors', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Floors Viewer', moduleKey: 'floors', actions: ['read'] },
  { name: 'Rooms Admin', moduleKey: 'rooms', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Rooms Viewer', moduleKey: 'rooms', actions: ['read'] },
  { name: 'Beds Admin', moduleKey: 'beds', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Beds Viewer', moduleKey: 'beds', actions: ['read'] },
  { name: 'Allocations Admin', moduleKey: 'allocations', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Allocations Viewer', moduleKey: 'allocations', actions: ['read'] },
  { name: 'Users Admin', moduleKey: 'users', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Users Viewer', moduleKey: 'users', actions: ['read'] },
  { name: 'Tenants Admin', moduleKey: 'tenants', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Tenants Viewer', moduleKey: 'tenants', actions: ['read'] },
  { name: 'Expenses Admin', moduleKey: 'expenses', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Expenses Viewer', moduleKey: 'expenses', actions: ['read'] },
  { name: 'Complaints Admin', moduleKey: 'complaints', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Complaints Viewer', moduleKey: 'complaints', actions: ['read'] },
  { name: 'Announcements Admin', moduleKey: 'announcements', actions: ['read', 'write', 'update', 'delete'] },
  { name: 'Announcements Viewer', moduleKey: 'announcements', actions: ['read'] },
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
    // 1. Create Modules
    const moduleKeys = [...new Set(DEFAULT_PERMISSIONS.map((p) => p.moduleKey))];
    const modules = await Promise.all(
      moduleKeys.map((key) =>
        Module.findOneAndUpdate(
          { key },
          { name: key.charAt(0).toUpperCase() + key.slice(1), key },
          { upsert: true, new: true },
        ),
      ),
    );

    const moduleMap = new Map(modules.map((m) => [m.key, m._id]));

    // 2. Create Permissions
    await Promise.all(
      DEFAULT_PERMISSIONS.map((p) =>
        Permission.findOneAndUpdate(
          { name: p.name },
          { name: p.name, moduleId: moduleMap.get(p.moduleKey), actions: p.actions },
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
        populate: { path: 'moduleId', model: 'Module' }
      },
    });

    if (!user) return [];

    const permissionNames = new Set<string>();
    (user.roleIds as any[]).forEach((role: any) => {
      (role.permissionIds || []).forEach((permission: any) => {
        if (permission.moduleId && permission.actions) {
          permission.actions.forEach((action: string) => {
            permissionNames.add(`${permission.moduleId.key}:${action}`);
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
      populate: { path: 'moduleId' },
    });
  }

  async getRoleById(id: string) {
    return Role.findById(id).populate({
      path: 'permissionIds',
      populate: { path: 'moduleId' },
    });
  }

  async getAllPermissions() {
    return Permission.find().populate('moduleId');
  }

  private async ensureModulePermissions(modulePermission: { moduleId: string; actions: string[] }[]): Promise<string[]> {
    const permissionIds: string[] = [];
    for (const mp of modulePermission) {
      const module = await Module.findById(mp.moduleId);
      if (!module) continue;

      const permissionName = `${module.key} [${[...mp.actions].sort().join(',')}]`;
      let permission = await Permission.findOne({ name: permissionName });

      if (!permission) {
        permission = await Permission.create({
          name: permissionName,
          moduleId: mp.moduleId,
          actions: mp.actions,
        });
      }
      permissionIds.push(permission._id.toString());
    }
    return permissionIds;
  }

  async createRole(data: { roleName: string; modulePermission?: { moduleId: string; actions: string[] }[], description?: string }) {
    let permissionIds: string[] = [];
    if (data.modulePermission && data.modulePermission.length > 0) {
      permissionIds = await this.ensureModulePermissions(data.modulePermission);
    }
    return Role.create({
      name: data.roleName,
      description: data.description || `${data.roleName} role`,
      permissionIds
    });
  }

  async updateRole(id: string, data: { roleName?: string; modulePermission?: { moduleId: string; actions: string[] }[], description?: string }) {
    const updateData: any = {};
    if (data.roleName) updateData.name = data.roleName;
    if (data.description) updateData.description = data.description;
    if (data.modulePermission) {
      updateData.permissionIds = await this.ensureModulePermissions(data.modulePermission);
    }
    return Role.findByIdAndUpdate(id, updateData, { new: true }).populate({
      path: 'permissionIds',
      populate: { path: 'moduleId' }
    });
  }

  async deleteRole(id: string) {
    return Role.findByIdAndDelete(id);
  }

  async assignRoleToUser(userId: string, roleIds: string[]) {
    return User.findByIdAndUpdate(userId, { roleIds }, { new: true }).populate('roleIds');
  }

  async bindPermissionToRole(moduleId: string, actions: string[], roleId: string) {
    // 1. Find or create the permission
    const module = await Module.findById(moduleId);
    if (!module) throw new Error('Module not found');

    const permissionName = `${module.key} [${[...actions].sort().join(',')}]`;
    let permission = await Permission.findOne({ name: permissionName });

    if (!permission) {
      permission = await Permission.create({
        name: permissionName,
        moduleId,
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
      populate: { path: 'moduleId' },
    });
  }
}

export default new RbacService();

