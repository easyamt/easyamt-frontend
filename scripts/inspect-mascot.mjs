import { readFileSync } from 'node:fs'

for (const [name, expectedWidth] of [['idle', 320], ['box', 128], ['answer', 192]]) {
  const png = readFileSync(new URL(`../public/mascot/catpack-${name}.png`, import.meta.url))
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Not a PNG')
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
  console.log({ name, width, height, frameWidth: 32, frameHeight: 32, columns: width / 32, rows: height / 32 })
  if (width !== expectedWidth || height !== 32) throw new Error('Reinspect changed asset and update MASCOT_SHEET')
}
