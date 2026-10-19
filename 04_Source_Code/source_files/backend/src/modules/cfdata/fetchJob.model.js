import mongoose from 'mongoose'

const progressSchema = new mongoose.Schema(
  {
    phase: { type: String, default: 'queued' },
    done: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false },
)

const errorSchema = new mongoose.Schema(
  {
    message: { type: String, default: '' },
    stack: { type: String, default: '' },
  },
  { _id: false },
)

const resultSchema = new mongoose.Schema(
  {
    snapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisSnapshot', default: null },
    submissionCount: { type: Number, default: 0 },
  },
  { _id: false },
)

const fetchJobSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, lowercase: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['init', 'sync'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    priority: { type: Number, default: 0 },
    claimedBy: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    lastSubmissionId: { type: Number, default: 0 },
    progress: { type: progressSchema, default: () => ({}) },
    error: { type: errorSchema, default: () => ({}) },
    result: { type: resultSchema, default: () => ({}) },
  },
  { timestamps: true },
)

fetchJobSchema.index({ status: 1, priority: -1, createdAt: 1 })
fetchJobSchema.index({ handle: 1, status: 1 })
fetchJobSchema.index({ status: 1, expiresAt: 1 })

export const FetchJob = mongoose.models.FetchJob || mongoose.model('FetchJob', fetchJobSchema)
