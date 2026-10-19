import mongoose from 'mongoose'

const cfRatingHistorySchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, lowercase: true, trim: true },
    contestId: { type: Number, required: true },
    contestName: { type: String, default: '' },
    rank: { type: Number, default: null },
    oldRating: { type: Number, default: null },
    newRating: { type: Number, default: null },
    changedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

cfRatingHistorySchema.index({ handle: 1, contestId: 1 }, { unique: true })

export const CFRatingHistory =
  mongoose.models.CFRatingHistory || mongoose.model('CFRatingHistory', cfRatingHistorySchema)
