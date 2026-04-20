import mongoose, { Document, Schema } from "mongoose";

export interface IPropertyInventoryAllocation extends Document {
  propertyId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  roomCategoryId: mongoose.Types.ObjectId;
  notes?: string;
  status: "active" | "inactive" | "terminated";
}

const PropertyInventoryAllocationSchema: Schema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    floorId: { type: Schema.Types.ObjectId, ref: "Floor", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    bedId: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
    roomCategoryId: { type: Schema.Types.ObjectId, ref: "RoomCategory", required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IPropertyInventoryAllocation>(
  "PropertyInventoryAllocation",
  PropertyInventoryAllocationSchema,
);
