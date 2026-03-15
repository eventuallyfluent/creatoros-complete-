#!/usr/bin/env node
// Runs before build to catch duplicate route files that survive git pushes.
const fs = require('fs')
const path = require('path')

const FORBIDDEN = [
  'src/app/(admin)/admin-login',
]

let failed = false
for (const p of FORBIDDEN) {
  const full = path.join(__dirname, '..', p)
  if (fs.existsSync(full)) {
    console.error(`\n❌ DUPLICATE ROUTE: ${p} must not exist.\n   Delete it from GitHub: src/app/(admin)/admin-login/\n`)
    failed = true
  }
}

if (failed) process.exit(1)
console.log('✓ No duplicate routes found.')
