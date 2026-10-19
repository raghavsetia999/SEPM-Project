import mongoose from 'mongoose'

const cfSubmissionSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, lowercase: true, trim: true },
    submissionId: { type: Number, required: true },
    problemKey: { type: String, default: null },
    contestId: { type: Number, default: null },
    index: { type: String, default: null },
    name: { type: String, default: 'Unknown problem' },
    rating: { type: Number, default: null },
    tags: { type: [String], default: [] },
    verdict: { type: String, default: 'UNKNOWN' },
    language: { type: String, default: 'Unknown' },
    createdAt: { type: Date, default: null },
    passedTestCount: { type: Number, default: null },
    participantType: { type: String, default: null },
    url: { type: String, default: null },
  },
  { timestamps: true },
)

cfSubmissionSchema.index({ handle: 1, submissionId: 1 }, { unique: true })
cfSubmissionSchema.index({ handle: 1, createdAt: -1 })

export const CFSubmission =
  mongoose.models.CFSubmission || mongoose.model('CFSubmission', cfSubmissionSchema)
