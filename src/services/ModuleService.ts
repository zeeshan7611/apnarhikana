import Module, { IModule } from '../models/Module';

export default class ModuleService {
  static async createModule(data: { name: string; key: string; description?: string }): Promise<IModule> {
    return Module.create(data);
  }

  static async getAllModules(): Promise<IModule[]> {
    return Module.find().sort({ name: 1 });
  }

  static async getModuleById(id: string): Promise<IModule | null> {
    return Module.findById(id);
  }

  static async updateModule(id: string, data: Partial<IModule>): Promise<IModule | null> {
    return Module.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteModule(id: string): Promise<IModule | null> {
    return Module.findByIdAndDelete(id);
  }
}
