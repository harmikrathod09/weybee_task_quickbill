import dbConnect from './lib/db';
import User from './models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  await dbConnect();
  
  const existingUser = await User.findOne({ username: 'meera@123' });
  if (existingUser) {
    console.log('User meera@123 already exists');
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('meera@123', salt);

  await User.create({
    username: 'meera@123',
    passwordHash,
    role: 'owner'
  });

  console.log('User meera@123 created successfully with password: meera@123');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
