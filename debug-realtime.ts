import { db } from './src/lib/db'

async function debug() {
  console.log('Available models:', Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')))
  try {
    const count = await db.realtimetraffic.count()
    console.log('Realtime traffic count:', count)
  } catch (err: any) {
    console.error('Error accessing realtimetraffic:', err.message)
  }
  process.exit(0)
}

debug()
