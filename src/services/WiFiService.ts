import WiFi, { IWiFi } from '../models/WiFi';

export default class WiFiService {
  /**
   * Create or update WiFi details for a floor
   */
  static async upsertWiFi(data: {
    propertyId: string;
    floorId: string;
    ssid: string;
    password: string;
    notes?: string;
  }): Promise<IWiFi> {
    return WiFi.findOneAndUpdate(
      { propertyId: data.propertyId, floorId: data.floorId },
      { ...data, isActive: true },
      { upsert: true, new: true }
    );
  }

  /**
   * Get all WiFi details for a property
   */
  static async getWiFiByProperty(propertyId: string): Promise<IWiFi[]> {
    return WiFi.find({ propertyId, isActive: true }).populate('floorId', 'name');
  }

  /**
   * Get WiFi for a specific floor
   */
  static async getWiFiByFloor(floorId: string): Promise<IWiFi | null> {
    return WiFi.findOne({ floorId, isActive: true });
  }

  /**
   * Delete WiFi details
   */
  static async deleteWiFi(id: string): Promise<any> {
    return WiFi.findByIdAndDelete(id);
  }
}
