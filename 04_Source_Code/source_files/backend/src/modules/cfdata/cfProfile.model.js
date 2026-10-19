import mongoose from 'mongoose'

const cfProfileSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    organization: { type: String, default: '' },
    contribution: { type: Number, default: 0 },
    rating: { type: Number, default: null },
    maxRating: { type: Number, default: null },
    rank: { type: String, default: 'unrated' },
    maxRank: { type: String, default: 'unrated' },
    friendOfCount: { type: Number, default: 0 },
    avatar: { type: String, default: null },
    registeredAt: { type: Date, default: null },
    lastFetchedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export const CFProfile = mongoose.models.CFProfile || mongoose.model('CFProfile', cfProfileSchema)
