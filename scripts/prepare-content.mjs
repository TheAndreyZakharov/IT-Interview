import fs from 'fs'
import path from 'path'

const sourceDir = path.resolve('external/question-bank')
const copiedDir = path.resolve('src/content/question-bank')
const publicDir = path.resolve('public')
const indexFile = path.join(publicDir, 'content-index.json')

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function collectFiles(dir, rootDir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      collectFiles(fullPath, rootDir, result)
    } else {
      const relativePath = path.relative(rootDir, fullPath)
      result.push(relativePath)
    }
  }

  return result
}

removeDir(copiedDir)
copyDir(sourceDir, copiedDir)

fs.mkdirSync(publicDir, { recursive: true })

const files = collectFiles(copiedDir, copiedDir).sort()

fs.writeFileSync(
  indexFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      files,
    },
    null,
    2
  )
)

console.log(`Question bank copied from ${sourceDir} to ${copiedDir}`)
console.log(`Index file created at ${indexFile}`)