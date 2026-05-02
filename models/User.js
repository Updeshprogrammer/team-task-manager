import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    isActive: { type: Boolean, default: true },
    /** Public URL path, e.g. `/uploads/avatars/${id}.jpg` */
    avatarUrl: { type: String, default: null },
  },
  { timestamps: true }
);

/** @typedef {mongoose.InferSchemaType<typeof userSchema>} UserDoc */
export default mongoose.models.User || mongoose.model("User", userSchema);
