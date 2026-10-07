import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diskslam';

  // Ensure database name is in URI (add /diskslam before ? if missing)
  if (uri.includes('mongodb+srv') && !uri.includes('/diskslam')) {
    uri = uri.replace('/?', '/diskslam?').replace(/\/$/, '/diskslam');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s — enough for Atlas cold start
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log(`[MongoDB] ✅ Connected to Atlas database`);
  } catch (err: any) {
    console.warn(`[MongoDB] ⚠️  Atlas connection failed: ${err?.message || err}`);
    console.warn(`[MongoDB] Launching in-memory MongoDB fallback...`);
    try {
      if (!process.env.MONGOMS_DOWNLOAD_DIR) {
        process.env.MONGOMS_DOWNLOAD_DIR = '/tmp/mongodb-binaries';
      }
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] ✅ In-memory MongoDB running at ${memoryUri}`);
    } catch (innerErr: any) {
      console.warn('[MongoDB] ❌ In-memory fallback failed:', innerErr?.message || innerErr);
    }
  }
}
