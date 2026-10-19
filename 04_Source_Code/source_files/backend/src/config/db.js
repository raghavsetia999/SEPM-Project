import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  return mongoose.connection
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}
