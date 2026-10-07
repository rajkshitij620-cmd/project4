import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diskslam';

  try {
    // Attempt standard MongoDB connection with a short timeout
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Connected to database at ${uri}`);
  } catch (err: any) {
    console.warn(`[MongoDB] Could not connect to external MongoDB at ${uri}. Launching in-memory MongoDB fallback...`);
    try {
      if (!process.env.MONGOMS_DOWNLOAD_DIR) {
        process.env.MONGOMS_DOWNLOAD_DIR = '/tmp/mongodb-binaries';
      }
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Successfully connected to in-memory MongoDB at ${memoryUri}`);
    } catch (innerErr) {
      console.warn('[MongoDB] In-memory MongoDB could not be downloaded in this environment. Running in mock/offline mode:', innerErr);
    }
  }
}

