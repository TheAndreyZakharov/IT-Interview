import fs from 'fs'
import path from 'path'

const sourceDir = path.resolve('external/question-bank')
const publicDir = path.resolve('public')
const contentDir = path.join(publicDir, 'content')
const indexFile = path.join(publicDir, 'content-index.json')

const allowedTopLevelDirs = new Set(['RU', 'EN'])

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function isMarkdownFile(fileName) {
  return fileName.toLowerCase().endsWith('.md')
}

function collectMarkdownFiles(dir, rootDir, result = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue
    }

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      collectMarkdownFiles(fullPath, rootDir, result)
      continue
    }

    if (entry.isFile() && isMarkdownFile(entry.name)) {
      const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/')
      result.push(relativePath)
    }
  }

  return result
}

function copyFiles(rootDir, files, destinationRoot) {
  for (const relativePath of files) {
    const srcPath = path.join(rootDir, relativePath)
    const destPath = path.join(destinationRoot, relativePath)
    ensureDir(path.dirname(destPath))
    fs.copyFileSync(srcPath, destPath)
  }
}

function classifyFile(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/')

  const lang = normalized.startsWith('RU/')
    ? 'RU'
    : normalized.startsWith('EN/')
      ? 'EN'
      : 'OTHER'

  let type = 'other'

  if (normalized.includes('/Questions_with_AI_Answers_By_Topic_')) {
    type = 'questions_with_answers'
  } else if (normalized.includes('/Questions_By_Topic_')) {
    type = 'questions_only'
  } else if (normalized.includes('Table_of_Contents')) {
    type = 'table_of_contents'
  } else if (normalized.includes('Complete_Question_Bank')) {
    type = 'complete_question_bank'
  }

  return { lang, type }
}

removeDir(contentDir)
ensureDir(contentDir)
ensureDir(publicDir)

const topLevelEntries = fs
  .readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && allowedTopLevelDirs.has(entry.name))
  .map((entry) => entry.name)

let markdownFiles = []

for (const dirName of topLevelEntries) {
  const dirPath = path.join(sourceDir, dirName)
  markdownFiles.push(...collectMarkdownFiles(dirPath, sourceDir))
}

markdownFiles = markdownFiles.sort()
copyFiles(sourceDir, markdownFiles, contentDir)

const stats = {
  totalMarkdownFiles: markdownFiles.length,
  byLanguage: {
    RU: 0,
    EN: 0,
    OTHER: 0,
  },
  byType: {
    questions_with_answers: 0,
    questions_only: 0,
    table_of_contents: 0,
    complete_question_bank: 0,
    other: 0,
  },
}

for (const file of markdownFiles) {
  const meta = classifyFile(file)
  stats.byLanguage[meta.lang] += 1
  stats.byType[meta.type] += 1
}

fs.writeFileSync(
  indexFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      stats,
      files: markdownFiles,
    },
    null,
    2
  )
)

console.log(`Collected markdown files: ${markdownFiles.length}`)
console.log(JSON.stringify(stats, null, 2))