/**
 * =====================================================
 *  Admin Password Reset Script
 *  চালানোর নিয়ম: node reset-admin-password.js
 * =====================================================
 */

require('dotenv').config(); // .env থেকে MONGODB_URI লোড হবে
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const NEW_PASSWORD = 'admin@123';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI .env-এ নেই!');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name:              String,
  email:             String,
  password:          String,
  role:              String,
  passwordChangedAt: Date,
});
const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
  try {
    console.log('🔄 MongoDB-তে কানেক্ট হচ্ছে...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // বর্তমান admin দেখাও
    const admins = await User.find({ role: 'admin' }).select('name email role');
    console.log('📋 বর্তমান Admin ইউজার:', admins.map(a => `${a.name} <${a.email}>`));

    if (admins.length === 0) {
      console.log('⚠️  কোনো admin ইউজার নেই! নতুন admin তৈরি হচ্ছে...');
      const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
      await User.create({
        name:     'Super Admin',
        email:    'admin',
        password: hashed,
        role:     'admin',
        passwordChangedAt: null,
      });
      console.log('✅ নতুন admin তৈরি হয়েছে — Email: admin');
    } else {
      // সব admin-এর পাসওয়ার্ড আপডেট করো
      const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
      const result = await User.updateMany(
        { role: 'admin' },
        {
          $set: {
            password:          hashed,
            passwordChangedAt: null, // reset — .env fallback বন্ধ হবে
          }
        }
      );
      console.log(`✅ ${result.modifiedCount} জন admin-এর পাসওয়ার্ড আপডেট হয়েছে`);
    }

    // যাচাই করো
    const admin = await User.findOne({ role: 'admin' });
    const match = await bcrypt.compare(NEW_PASSWORD, admin.password);
    if (match) {
      console.log('');
      console.log('🎉 সফল! নতুন পাসওয়ার্ড কাজ করছে।');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Username :', admin.email);
      console.log('  Password :', NEW_PASSWORD);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ পাসওয়ার্ড যাচাই ব্যর্থ হয়েছে!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetAdminPassword();