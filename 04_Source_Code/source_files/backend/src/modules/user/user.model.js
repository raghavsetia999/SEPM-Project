import mongoose from 'mongoose'

const preferencesSchema = new mongoose.Schema(
  {
    includeGymSubmissions: { type: Boolean, default: false },
    weeklyReport: { type: Boolean, default: false },
    streakReminders: { type: Boolean, default: true },
    contestReminders: { type: Boolean, default: false },
    automaticRefresh: { type: Boolean, default: true },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, index: true, select: false },
    emailVerified: { type: Boolean, default: false },
    profileImageUrl: { type: String, default: '' },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    codeforcesHandle: { type: String, trim: true, maxlength: 32, default: '' },
    targetRating: { type: Number, min: 800, max: 4000, default: 1600 },
    preferredPracticeMinutes: { type: Number, enum: [30, 60, 90, 120], default: 60 },
    difficultTopics: { type: [String], default: [] },
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
)

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    emailVerified: this.emailVerified,
    profileImageUrl: this.profileImageUrl,
    codeforcesHandle: this.codeforcesHandle,
    targetRating: this.targetRating,
    preferredPracticeMinutes: this.preferredPracticeMinutes,
    difficultTopics: this.difficultTopics,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export const User = mongoose.models.User || mongoose.model('User', userSchema)
