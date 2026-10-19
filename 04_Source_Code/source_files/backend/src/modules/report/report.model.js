import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    handle: { type: String, required: true, trim: true, index: true },
    reportType: { type: String, enum: ['manual', 'weekly'], default: 'manual', index: true },
    schemaVersion: { type: Number, default: 1 },
    profile: { type: mongoose.Schema.Types.Mixed, default: {} },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
    topicAnalysis: { type: [mongoose.Schema.Types.Mixed], default: [] },
    ratingAnalysis: { type: [mongoose.Schema.Types.Mixed], default: [] },
    verdictAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    upsolvingProblems: { type: [mongoose.Schema.Types.Mixed], default: [] },
    weeklyComparison: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: {
      submissionCount: { type: Number, default: 0 },
      latestSubmissionId: Number,
      fetchedAt: Date,
    },
    generatedAt: { type: Date, default: Date.now, index: true },
    isSaved: { type: Boolean, default: false },
  },
  { timestamps: true },
)

reportSchema.index({ userId: 1, generatedAt: -1 })
reportSchema.index({ handle: 1, generatedAt: -1 })

reportSchema.set('toJSON', {
  transform(_document, value) {
    value.id = value._id.toString()
    delete value._id
    delete value.__v
    return value
  },
})

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema)
