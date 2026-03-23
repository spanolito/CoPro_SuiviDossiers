import { notifyAdminNewUser } from '../src/lib/utils/notifications'

async function runTest() {
  console.log('Sending test email via trigger...')
  await notifyAdminNewUser({ nomAffiche: 'Test User Registration', email: 'test@example.com' })
  console.log('Test finished.')
}

runTest()
