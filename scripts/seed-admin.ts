import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('✗ MONGODB_URI is not set in .env.local');
  process.exit(1);
}

const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
console.log(`  Connecting to: ${maskedUri}`);

const force = process.argv.includes('--force');
if (force) console.log('  Mode: --force (will delete existing admin and recreate)');

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!, { serverSelectionTimeoutMS: 10000 });
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ Could not connect to MongoDB:', err);
    process.exit(1);
  }

  const db = mongoose.connection.db!;
  console.log(`  Database: ${db.databaseName}`);

  const UserSchema = new mongoose.Schema(
    {
      phone: { type: String, required: true, unique: true, trim: true },
      password: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
      membershipType: {
        type: String,
        required: true,
        enum: ['member', 'visitor', 'invitee', 'convert'],
        default: 'member',
      },
      location: { type: String, required: true, trim: true },
      role: { type: String, enum: ['member', 'admin'], default: 'member' },
      totalPoints: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      lastLoginAt: { type: Date },
    },
    { timestamps: true }
  );

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existingAdmin = await User.findOne({ role: 'admin' });

  if (existingAdmin && !force) {
    console.log('\nAn admin account already exists:');
    console.log(`  Name:  ${existingAdmin.name}`);
    console.log(`  Phone: ${existingAdmin.phone}`);
    console.log('\nRun with --force to delete and recreate it:');
    console.log('  npm run seed:admin -- --force');
    await mongoose.disconnect();
    return;
  }

  if (force && existingAdmin) {
    await User.deleteOne({ _id: existingAdmin._id });
    console.log('  Deleted existing admin.');
  }

  // Read credentials from env or fall back to defaults
  const name = process.env.ADMIN_NAME || 'Admin';
  const rawPhone = process.env.ADMIN_PHONE || '0200000000';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';

  // Normalise to 0XXXXXXXXX so it matches what the login route expects
  function normalizePhone(p: string): string {
    const digits = p.replace(/\D/g, '');
    if (digits.startsWith('233') && digits.length === 12) return '0' + digits.slice(3);
    if (digits.startsWith('0') && digits.length === 10) return digits;
    return p;
  }
  const phone = normalizePhone(rawPhone);
  const gender = (process.env.ADMIN_GENDER as 'male' | 'female' | 'other') || 'male';
  const location = process.env.ADMIN_LOCATION || 'Accra';

  const hashedPassword = await bcrypt.hash(password, 12);

  const created = await User.create({
    name,
    phone,
    password: hashedPassword,
    gender,
    membershipType: 'member',
    location,
    role: 'admin',
    isActive: true,
  });

  console.log(`\n✓ Admin account created (id: ${created._id})`);
  console.log(`  Name:     ${name}`);
  console.log(`  Phone:    ${phone}`);
  console.log(`  Password: ${password}`);
  console.log('\n  You can override these with ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD,');
  console.log('  ADMIN_GENDER, and ADMIN_LOCATION in .env.local before running the script.');

  await mongoose.disconnect();
  console.log('\n✓ Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
