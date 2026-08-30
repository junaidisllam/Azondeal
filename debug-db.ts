import { db } from './src/lib/db'

async function main() {
  console.log('Available models on db:', Object.getOwnPropertyNames(db).filter(p => !p.startsWith('_')))
}

main().catch(console.error)
