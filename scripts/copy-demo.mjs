import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const docsDist = resolve('docs/.vitepress/dist')
const demoSrc = resolve('webgpu-ts/dist')
const demoDst = resolve('docs/.vitepress/dist/demo')

if (!existsSync(demoSrc)) {
  throw new Error('webgpu-ts/dist 가 없습니다. 먼저 app:build 를 실행하세요.')
}

mkdirSync(docsDist, { recursive: true })
rmSync(demoDst, { recursive: true, force: true })
cpSync(demoSrc, demoDst, { recursive: true })

console.log('Copied demo build to docs/.vitepress/dist/demo')