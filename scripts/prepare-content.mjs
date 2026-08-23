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
    .replace(/\s+\[id:\s*[A-Z]{2}-\d{6}\]\s*$/i, '')
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
  let result = value
  while (/^\s*>/.test(result)) {
    result = result.replace(/^\s*>[ \t]?/, '')
  }
  return result
}

function extractAnswerQuestionText(value, languageDir) {
  return extractAnswerQuestion(value, languageDir)?.text ?? null
}

function validateStableId(id, languageDir, context) {
  const normalized = id.toUpperCase()
  if (!normalized.startsWith(`${languageDir}-`)) {
    throw new Error(`${context} must use a ${languageDir} ID, received ${id}`)
  }
  return normalized
}

function extractAnswerQuestion(value, languageDir) {
  const normalized = value.trim()
  const match = normalized.match(
    /^-\s+\*\*(.+)\*\*\s+\[id:\s*([A-Z]{2}-\d{6})\]\s*$/i,
  )

  return match
    ? {
        text: normalizeText(match[1]),
        id: validateStableId(match[2], languageDir, 'Answer question'),
      }
    : null
}

function extractQuestionId(value, languageDir, context) {
  const match = value.match(/^[-]\s+.+\s+\[id:\s*([A-Z]{2}-\d{6})\]\s*$/i)
  return match
    ? validateStableId(match[1], languageDir, context)
    : null
}

function isAnswerLabel(value) {
  return /^\*{0,2}(Ответ|Answer):?\*{0,2}$/i.test(
    value.trim(),
  )
}

function isFenceDelimiter(value) {
  const normalized = value.trim()
  return normalized.startsWith('```') || normalized.startsWith('~~~')
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
        .filter((line) => Boolean(extractAnswerQuestionText(line, languageDir)))
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
    let currentQuestionId = null
    let answerLines = []
    let answerStarted = false
    let inFence = false
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
      if (!currentQuestion || !currentQuestionId) {
        return
      }

      const cleanedAnswer = answerLines.join('\n').trim()
      if (answerMap.has(currentQuestionId)) {
        throw new Error(`Duplicate answer ID ${currentQuestionId} in ${relativePath}`)
      }

      answerMap.set(currentQuestionId, cleanedAnswer)

      currentQuestion = null
      currentQuestionId = null
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

      const insideFence = inFence
      const nextNonEmptyLine = nextMeaningfulLines[lineIndex]

      if (!insideFence && /^\s*>(?:\s|$)/.test(rawLine)) {
        throw new Error(
          `Answer files must not contain blockquote prefixes in ${relativePath}:${lineIndex + 1}`,
        )
      }

      const parsedQuestion = extractAnswerQuestion(line, languageDir)

      if (
        parsedQuestion &&
        (!insideFence || isAnswerLabel(nextNonEmptyLine ?? '')) &&
        (!answerStarted || isAnswerLabel(nextNonEmptyLine ?? ''))
      ) {
        flushQuestion()
        currentQuestion = parsedQuestion.text
        currentQuestionId = parsedQuestion.id
        continue
      }

      if (
        !insideFence &&
        /^-{1,2}\s+\*\*/.test(line)
      ) {
        throw new Error(`Answer question must contain a valid ID in ${relativePath}:${lineIndex + 1}`)
      }

      if (isFenceDelimiter(line)) {
        if (currentQuestion) {
          answerLines.push(cleanAnswerLine(rawLine))
        }
        inFence = !inFence
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
  const seenQuestionIds = new Set()

  for (const relativePath of files) {
    const content = readFileIfExists(path.join(rootDir, relativePath))
    const lines = content.replace(/\r/g, '').split('\n')

    let topicTitle = ''
    let currentHeading = ''
    let currentHeadingLevel = 3

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const rawLine = lines[lineIndex]
      const line = rawLine.trim()

      if (!line) {
        continue
      }

      if (/^\s+[-*]\s+/.test(rawLine)) {
        throw new Error(
          `Questions must be single-line top-level entries; nested list item found in ${relativePath}:${lineIndex + 1}`,
        )
      }

      if (/^>/.test(line) || /^-{2,}\s+/.test(line)) {
        throw new Error(
          `Questions must use the canonical '- question [id: ...]' format in ${relativePath}:${lineIndex + 1}`,
        )
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

      if (/^-\s/.test(rawLine)) {
        const stableQuestionId = extractQuestionId(
          line,
          languageDir,
          `Question in ${relativePath}:${lineIndex + 1}`,
        )
        if (!stableQuestionId) {
          throw new Error(`Question must contain a valid ID in ${relativePath}:${lineIndex + 1}`)
        }
        if (seenQuestionIds.has(stableQuestionId)) {
          throw new Error(`Duplicate question ID ${stableQuestionId} in ${relativePath}:${lineIndex + 1}`)
        }
        seenQuestionIds.add(stableQuestionId)
        const questionText = normalizeText(line.replace(/^- /, ''))
        const answer = answerMap.get(stableQuestionId) ?? ''

        result.push({
          id: stableQuestionId,
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
      }
    }
  }

  const questionIds = new Set(result.map((question) => question.id))
  for (const answerId of answerMap.keys()) {
    if (!questionIds.has(answerId)) {
      throw new Error(`Answer ${answerId} has no matching question in ${languageDir}`)
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
