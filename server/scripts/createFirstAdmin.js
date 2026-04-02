/**
 * Create the first admin (or another admin with --force) when the DB has no admin
 * or you cannot use the protected POST /api/admin/signup.
 *
 * Usage (from server folder):
 *   node scripts/createFirstAdmin.js "Your Name" "you@banasthali.in" "password8chars+"
 *
 * Or set env vars and run with no args:
 *   BOOTSTRAP_ADMIN_NAME="..." BOOTSTRAP_ADMIN_EMAIL="..." BOOTSTRAP_ADMIN_PASSWORD="..." node scripts/createFirstAdmin.js
 *
 * Email must end with @banasthali.in (see Admin model). Password must be at least 8 characters.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const connectDB = require('../config/database');
const Admin = require('../models/Admin');

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes('--force');
  const rest = argv.filter((a) => a !== '--force');

  const name = process.env.BOOTSTRAP_ADMIN_NAME || rest[0];
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || rest[1];
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || rest[2];

  if (!name || !email || !password) {
    console.error(`
Usage:
  node scripts/createFirstAdmin.js "Full Name" "you@banasthali.in" "YourPassword8+"

Optional:
  --force    Create even if other admins already exist

Env alternative:
  BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
`);
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters (Admin model rule).');
    process.exit(1);
  }

  await connectDB();

  const existing = await Admin.countDocuments();
  if (existing > 0 && !force) {
    console.error(
      `There are already ${existing} admin(s). If you really want to add another, run again with --force.`
    );
    process.exit(1);
  }

  if (await Admin.findOne({ email })) {
    console.error(`An admin with email ${email} already exists.`);
    process.exit(1);
  }

  const admin = await Admin.create({
    name,
    email,
    Password: password,
  });

  console.log('Admin created successfully.');
  console.log('  id:', admin._id.toString());
  console.log('  email:', admin.email);
  console.log('You can log in at /admin/adminlogin.html with this email and password.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
