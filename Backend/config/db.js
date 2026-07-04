// MongoDB connection (Mongoose).
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env — see README.md.');
  }
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  await cleanupLegacyIndexes();
}

// Drops any leftover indexes on the `users` collection that reference fields our
// current User schema doesn't have (e.g. an old unique `email` index from an earlier
// version of the app). Those cause every insert to collide on the same missing value
// (`{ email: null }`) after the first user is created — this makes registration
// self-healing instead of requiring a manual fix in the database.
async function cleanupLegacyIndexes() {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) return; // collection doesn't exist yet — nothing to clean

    const usersCollection = mongoose.connection.collection('users');
    const indexes = await usersCollection.indexes();
    const currentSchemaFields = ['username', 'usernameLower', '_id'];

    const legacyIndexes = indexes.filter(idx => {
      const keyFields = Object.keys(idx.key || {});
      return idx.name !== '_id_' && keyFields.some(f => !currentSchemaFields.includes(f));
    });

    for (const idx of legacyIndexes) {
      // console.warn(`Dropping legacy MongoDB index "${idx.name}" on "users" (not part of the current schema).`);
      await usersCollection.dropIndex(idx.name);
    }
  } catch (err) {
    console.warn('Legacy index cleanup skipped:', err.message);
  }
}

module.exports = { connectDB };
