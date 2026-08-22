import fs from 'fs'
import path from 'path'

const sourceDir = path.resolve('external/question-bank')
const publicDir = path.resolve('public')
const contentDir = path.join(publicDir, 'content')
const indexFile = path.join(publicDir, 'content-index.json')
const contentDataFile = path.join(publicDir, 'content-data.json')

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

function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return ''
  }

  return fs.readFileSync(filePath, 'utf8')
}

function countQuestions(markdown) {
  return markdown
    .split('\n')
    .filter((line) => /^\s*-\s+/.test(line))
    .length
}

function countHeadings(markdown) {
  return markdown
    .split('\n')
    .filter((line) => /^\s*#{2,4}\s+/.test(line))
    .length
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeText(value) {
  return value
    .replace(/\r/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/_/g, '')
    .trim()
}

function cleanAnswerLine(value) {
  return value.replace(/\r/g, '').trimEnd()
}

function stripOptionalBlockquote(value) {
  return value.replace(/^\s*>\s?/, '')
}

function extractAnswerQuestionText(value) {
  const normalized = stripOptionalBlockquote(value).trim()
  const match = normalized.match(/^-\s+\*\*(.+)\*\*\s*$/)

  return match ? normalizeText(match[1]) : null
}

function isAnswerLabel(value) {
  return stripOptionalBlockquote(value).trim() === '*Ответ:*'
}

function buildLanguageContentStats(rootDir, languageDir) {
  const tocFileName =
    languageDir === 'RU' ? 'Table_of_Contents_RU.md' : 'Table_of_Contents_EN.md'

  const completeBankFileName =
    languageDir === 'RU'
      ? 'Complete_Question_Bank_RU.md'
      : 'Complete_Question_Bank_EN.md'

  const tocPath = path.join(rootDir, languageDir, tocFileName)
  const completeBankPath = path.join(rootDir, languageDir, completeBankFileName)

  const tocContent = readFileIfExists(tocPath)
  const completeBankContent = readFileIfExists(completeBankPath)

  const answersDirName =
    languageDir === 'RU'
      ? 'Questions_with_AI_Answers_By_Topic_RU'
      : 'Questions_with_AI_Answers_By_Topic_EN'

  const answersDir = path.join(rootDir, languageDir, answersDirName)

  let answers = 0

  if (fs.existsSync(answersDir)) {
    const files = collectMarkdownFiles(answersDir, rootDir)

    for (const relativePath of files) {
      const content = readFileIfExists(path.join(rootDir, relativePath))
      answers += content
        .split('\n')
        .filter((line) => Boolean(extractAnswerQuestionText(line)))
        .length
    }
  }

  return {
    questions: countQuestions(completeBankContent),
    answers,
    headings: countHeadings(tocContent),
  }
}

function parseTocTree(markdown, languageDir) {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const roots = []
  const stack = []

  for (const rawLine of lines) {
    const match = rawLine.match(/^(#{2,4})\s+(.+)$/)
    if (!match) {
      continue
    }

    const level = match[1].length
    const title = normalizeText(match[2])

    const node = {
      id: `${languageDir.toLowerCase()}__toc__${level}__${slugify(title)}`,
      title,
      level,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  }

  return roots
}

function flattenTocTree(nodes) {
  const result = []

  function visit(node, parentIds = []) {
    result.push({
      id: node.id,
      title: node.title,
      level: node.level,
      parentIds,
      childrenIds: collectChildrenIds(node),
    })

    for (const child of node.children) {
      visit(child, [...parentIds, node.id])
    }
  }

  for (const node of nodes) {
    visit(node)
  }

  return result
}

function collectChildrenIds(node) {
  const ids = []

  function walk(current) {
    for (const child of current.children) {
      ids.push(child.id)
      walk(child)
    }
  }

  walk(node)
  return ids
}

function buildHeadingId(languageDir, level, title) {
  return `${languageDir.toLowerCase()}__toc__${level}__${slugify(title)}`
}

function buildQuestionId(languageDir, topicTitle, subtopicTitle, questionText, index) {
  return [
    languageDir.toLowerCase(),
    slugify(topicTitle),
    slugify(subtopicTitle),
    slugify(questionText).slice(0, 80),
    String(index + 1),
  ].join('__')
}

function parseAnswerFiles(rootDir, languageDir) {
  const dirName =
    languageDir === 'RU'
      ? 'Questions_with_AI_Answers_By_Topic_RU'
      : 'Questions_with_AI_Answers_By_Topic_EN'

  const dirPath = path.join(rootDir, languageDir, dirName)

  if (!fs.existsSync(dirPath)) {
    return new Map()
  }

  const files = collectMarkdownFiles(dirPath, rootDir).sort()
  const answerMap = new Map()

  for (const relativePath of files) {
    const content = readFileIfExists(path.join(rootDir, relativePath))
    const lines = content.replace(/\r/g, '').split('\n')

    let topicTitle = ''
    let currentHeading = ''
    let currentQuestion = null
    let answerLines = []
    let answerStarted = false
    const nextMeaningfulLines = new Array(lines.length)
    let nextMeaningfulLine = ''

    for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex -= 1) {
      nextMeaningfulLines[lineIndex] = nextMeaningfulLine

      const meaningfulLine = stripOptionalBlockquote(lines[lineIndex]).trim()

      if (meaningfulLine) {
        nextMeaningfulLine = lines[lineIndex]
      }
    }

    function flushQuestion() {
      if (!currentQuestion) {
        return
      }

      const cleanedAnswer = answerLines.join('\n').trim()
      const key = `${topicTitle}|||${currentHeading}|||${currentQuestion}`

      answerMap.set(key, cleanedAnswer)

      currentQuestion = null
      answerLines = []
      answerStarted = false
    }

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const rawLine = lines[lineIndex]
      const line = rawLine.trim()

      if (!line) {
        if (currentQuestion) {
          answerLines.push('')
        }
        continue
      }

      const questionText = extractAnswerQuestionText(line)
      const nextNonEmptyLine = nextMeaningfulLines[lineIndex]

      if (
        questionText &&
        (!answerStarted || isAnswerLabel(nextNonEmptyLine ?? ''))
      ) {
        flushQuestion()
        currentQuestion = questionText
        continue
      }

      if (isAnswerLabel(line)) {
        answerStarted = true
      }

      if (line.startsWith('## ')) {
        flushQuestion()
        topicTitle = normalizeText(line.replace(/^##\s+/, ''))
        continue
      }

      if (line.startsWith('### ')) {
        flushQuestion()
        currentHeading = normalizeText(line.replace(/^###\s+/, ''))
        continue
      }

      if (line.startsWith('#### ')) {
        flushQuestion()
        currentHeading = normalizeText(line.replace(/^####\s+/, ''))
        continue
      }

      if (currentQuestion) {
        const answerLine = stripOptionalBlockquote(rawLine)
        answerLines.push(cleanAnswerLine(answerLine))
      }
    }

    flushQuestion()
  }

  return answerMap
}

function parseQuestionsByTopic(rootDir, languageDir) {
  const dirName =
    languageDir === 'RU'
      ? 'Questions_By_Topic_RU'
      : 'Questions_By_Topic_EN'

  const dirPath = path.join(rootDir, languageDir, dirName)
  const answerMap = parseAnswerFiles(rootDir, languageDir)

  if (!fs.existsSync(dirPath)) {
    return []
  }

  const files = collectMarkdownFiles(dirPath, rootDir).sort()
  const result = []

  for (const relativePath of files) {
    const content = readFileIfExists(path.join(rootDir, relativePath))
    const lines = content.replace(/\r/g, '').split('\n')

    let topicTitle = ''
    let currentHeading = ''
    let currentHeadingLevel = 3
    let questionIndex = 0

    for (const rawLine of lines) {
      const line = rawLine.trim()

      if (!line) {
        continue
      }

      if (line.startsWith('## ')) {
        topicTitle = normalizeText(line.replace(/^##\s+/, ''))
        continue
      }

      if (line.startsWith('### ')) {
        currentHeading = normalizeText(line.replace(/^###\s+/, ''))
        currentHeadingLevel = 3
        continue
      }

      if (line.startsWith('#### ')) {
        currentHeading = normalizeText(line.replace(/^####\s+/, ''))
        currentHeadingLevel = 4
        continue
      }

      if (/^- /.test(line)) {
        const questionText = normalizeText(line.replace(/^- /, ''))
        const answerKey = `${topicTitle}|||${currentHeading}|||${questionText}`
        const answer = answerMap.get(answerKey) ?? ''

        result.push({
          id: buildQuestionId(languageDir, topicTitle, currentHeading, questionText, questionIndex),
          text: questionText,
          answer,
          hasAnswer: Boolean(answer.trim()),
          topicTitle,
          subtopicTitle: currentHeading,
          topicId: buildHeadingId(languageDir, 2, topicTitle),
          subtopicId: buildHeadingId(languageDir, currentHeadingLevel, currentHeading),
          headingIds: [
            buildHeadingId(languageDir, 2, topicTitle),
            buildHeadingId(languageDir, currentHeadingLevel, currentHeading),
          ],
        })

        questionIndex += 1
      }
    }
  }

  return result
}

function buildLanguageData(rootDir, languageDir) {
  const tocFileName =
    languageDir === 'RU' ? 'Table_of_Contents_RU.md' : 'Table_of_Contents_EN.md'

  const tocPath = path.join(rootDir, languageDir, tocFileName)
  const tocContent = readFileIfExists(tocPath)

  const tocTree = parseTocTree(tocContent, languageDir)
  const tocFlat = flattenTocTree(tocTree)
  const questions = parseQuestionsByTopic(rootDir, languageDir)

  return {
    tocTree,
    tocFlat,
    questions,
  }
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

const contentStats = {
  byLanguage: {
    RU: buildLanguageContentStats(sourceDir, 'RU'),
    EN: buildLanguageContentStats(sourceDir, 'EN'),
  },
}

const contentData = {
  generatedAt: new Date().toISOString(),
  byLanguage: {
    RU: buildLanguageData(sourceDir, 'RU'),
    EN: buildLanguageData(sourceDir, 'EN'),
  },
}

fs.writeFileSync(
  indexFile,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      stats,
      contentStats,
      files: markdownFiles,
    },
    null,
    2
  )
)

fs.writeFileSync(contentDataFile, JSON.stringify(contentData, null, 2))

console.log(`Collected markdown files: ${markdownFiles.length}`)
console.log(JSON.stringify(stats, null, 2))
console.log(JSON.stringify(contentStats, null, 2))
console.log(
  JSON.stringify(
    {
      RU: contentData.byLanguage.RU.questions.length,
      EN: contentData.byLanguage.EN.questions.length,
    },
    null,
    2
  )
)
