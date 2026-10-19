import mongoose from 'mongoose'

const analysisSnapshotSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, lowercase: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    submissionCount: { type: Number, default: 0 },
    latestSubmissionId: { type: Number, default: 0 },
    analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    generatedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
)

analysisSnapshotSchema.index({ handle: 1, generatedAt: -1 })

export const AnalysisSnapshot =
  mongoose.models.AnalysisSnapshot || mongoose.model('AnalysisSnapshot', analysisSnapshotSchema)
