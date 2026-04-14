import Feature, { IFeature } from '../models/Feature';

export default class FeatureService {
  static async createFeature(data: { name: string; key: string; description?: string }): Promise<IFeature> {
    return Feature.create(data);
  }

  static async getAllFeatures(): Promise<IFeature[]> {
    return Feature.find().sort({ name: 1 });
  }

  static async getFeatureById(id: string): Promise<IFeature | null> {
    return Feature.findById(id);
  }

  static async updateFeature(id: string, data: Partial<IFeature>): Promise<IFeature | null> {
    return Feature.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteFeature(id: string): Promise<IFeature | null> {
    return Feature.findByIdAndDelete(id);
  }
}
