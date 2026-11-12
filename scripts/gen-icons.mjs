import sharp from 'sharp'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

const any = await readFile(join(pub, 'icon.svg'))
const maskable = await readFile(join(pub, 'maskable.svg'))

const jobs = [
  { src: any, out: 'icons/pwa-192x192.png', size: 192 },
  { src: any, out: 'icons/pwa-512x512.png', size: 512 },
  { src: maskable, out: 'icons/maskable-192x192.png', size: 192 },
  { src: maskable, out: 'icons/maskable-512x512.png', size: 512 },
  { src: maskable, out: 'icons/apple-touch-icon.png', size: 180 },
]

for (const job of jobs) {
  const png = await sharp(job.src, { density: 384 })
    .resize(job.size, job.size)
    .png()
    .toBuffer()
  await writeFile(join(pub, job.out), png)
  console.log(`generated ${job.out} (${job.size}px)`)
}
