import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import './App.css'

type ContentIndex = {
  generatedAt: string
  stats: {
    totalMarkdownFiles: number
    byLanguage: {
      RU: number
      EN: number
      OTHER: number
    }
    byType: {
      questions_with_answers: number
      questions_only: number
      table_of_contents: number
      complete_question_bank: number
      other: number
    }
  }
  contentStats: {
    byLanguage: {
      RU: {
        questions: number
        answers: number
        headings: number
      }
      EN: {
        questions: number
        answers: number
        headings: number
      }
    }
  }
  files: string[]
}

type ParsedQuestion = {
  id: string
  text: string
  answer: string
  hasAnswer: boolean
  topicTitle: string
  subtopicTitle: string
  topicId: string
  subtopicId: string
  headingIds: string[]
}

type TocNode = {
  id: string
  title: string
  level: number
  children: TocNode[]
}

type TocFlatNode = {
  id: string
  title: string
  level: number
  parentIds: string[]
  childrenIds: string[]
}

type LanguageContentData = {
  tocTree: TocNode[]
  tocFlat: TocFlatNode[]
  questions: ParsedQuestion[]
}

type ContentData = {
  generatedAt: string
  byLanguage: {
    RU: LanguageContentData
    EN: LanguageContentData
  }
}

type Language = 'ru' | 'en'
type ThemeMode = 'light' | 'dark'

type Dictionary = {
  siteTitle: string
  madeByLabel: string
  heroTitle: string
  heroSubtitle: string
  languageTitle: string
  languageHint: string
  languageRu: string
  languageEn: string
  chooseLanguageCardHint: string
  updatedAt: string
  totalQuestions: string
  totalAnswers: string
  totalHeadings: string
  selectedLanguage: string
  themeLight: string
  themeDark: string
  menuTitle: string
  menuSubtitle: string
  backHome: string
  backToModes: string
  noAnswerYet: string
  answersSoon: string
  revealAnswer: string
  hideAnswer: string
  previous: string
  next: string
  questionOf: string
  topic: string
  subtopic: string
  subtopics: string
  randomModeHint: string
  chooseTopicsTitle: string
  chooseTopicsHint: string
  selectAll: string
  clearAll: string
  startMarathon: string
  selectedItems: string
  nothingSelected: string
  noQuestionsForSelection: string
  closeSelection: string
  shuffleAgain: string
  confirmLeaveTitle: string
  confirmLeaveText: string
  confirmLeaveStay: string
  confirmLeaveGo: string
  confirmBackToModesTitle: string
  confirmBackToModesText: string
  confirmBackToModesGo: string
  showContents: string
  hideContents: string
  contents: string
  currentSection: string
  noContentAvailable: string
  marathonTitle: string
  marathonText: string
  overviewTitle: string
  overviewText: string
  overviewSubtitle: string
  open: string
  answer: string
}

type LanguageStats = {
  questions: number
  answers: number
  headings: number
}

type OverviewQuestionGroup = {
  subtopicId: string
  subtopicTitle: string
  subtopicTrail: string[]
  questions: ParsedQuestion[]
}

const EMPTY_LANGUAGE_STATS: LanguageStats = {
  questions: 0,
  answers: 0,
  headings: 0,
}

const EMPTY_LANGUAGE_CONTENT: LanguageContentData = {
  tocTree: [],
  tocFlat: [],
  questions: [],
}

const TEXT: Record<Language, Dictionary> = {
  ru: {
    siteTitle: 'IT INTERVIEW',
    madeByLabel: 'Made by',
    heroTitle: 'Подготовка к IT-собеседованиям в одном месте',
    heroSubtitle:
      'На этом сайте собрана большая база вопросов для подготовки к IT-собеседованиям на русском и английском языках. Здесь есть марафон по вопросам, оглавление, ответы и удобная навигация по темам.',
    languageTitle: 'Выберите язык базы',
    languageHint:
      'Вы выбираете язык базы, в которую хотите войти. Для начала работы просто нажмите на одну из карточек языка ниже.',
    languageRu: 'Русский',
    languageEn: 'Английский',
    chooseLanguageCardHint:
      'После нажатия на карточку выбранный язык сохранится и будет использоваться на следующих страницах.',
    updatedAt: 'Последнее обновление базы',
    totalQuestions: 'Количество вопросов',
    totalAnswers: 'Количество ответов',
    totalHeadings: 'Количество тем и подтем',
    selectedLanguage: 'Выбранный язык базы',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    menuTitle: 'Выберите режим',
    menuSubtitle: 'Ниже доступны основные сценарии работы с базой.',
    backHome: 'Назад на главный экран',
    backToModes: 'Назад к выбору режима',
    noAnswerYet: 'Для этого вопроса ответ пока не добавлен.',
    answersSoon: 'Ответы скоро появятся.',
    revealAnswer: 'Подсказка',
    hideAnswer: 'Скрыть подсказку',
    previous: 'Назад',
    next: 'Вперёд',
    questionOf: 'Вопрос',
    topic: 'Тема',
    subtopic: 'Подтема',
    subtopics: 'Подтемы',
    randomModeHint: 'Вопросы перемешаны в случайном порядке.',
    chooseTopicsTitle: 'Выберите темы и подтемы',
    chooseTopicsHint:
      'Отметьте нужные пункты или выберите всё, затем начните марафон по выбранным разделам.',
    selectAll: 'Выбрать всё',
    clearAll: 'Очистить всё',
    startMarathon: 'Начать марафон',
    selectedItems: 'Выбрано пунктов',
    nothingSelected: 'Сначала выберите хотя бы один пункт.',
    noQuestionsForSelection: 'По текущему выбору вопросы не найдены.',
    closeSelection: 'Изменить выбор',
    shuffleAgain: 'Перемешать заново',
    confirmLeaveTitle: 'Выйти на главный экран?',
    confirmLeaveText:
      'Вы сейчас находитесь в марафоне. Если перейти на главный экран, текущий прогресс на этой странице сбросится.',
    confirmLeaveStay: 'Остаться',
    confirmLeaveGo: 'Перейти',
    confirmBackToModesTitle: 'Вернуться к выбору режима?',
    confirmBackToModesText:
      'Вы сейчас находитесь в марафоне. Если вернуться к выбору режима, текущий прогресс на этой странице сбросится.',
    confirmBackToModesGo: 'Вернуться',
    showContents: 'Показать содержание',
    hideContents: 'Скрыть содержание',
    contents: 'Содержание',
    currentSection: 'Текущий раздел',
    noContentAvailable: 'Содержимое пока недоступно.',
    marathonTitle: 'Марафон по вопросам',
    marathonText:
      'Сначала выберите все темы или конкретные разделы, затем проходите вопросы в случайном порядке.',
    overviewTitle: 'Оглавление, вопросы и ответы',
    overviewText:
      'Откройте оглавление, выберите нужный раздел и изучайте вопросы с раскрывающимися ответами.',
    overviewSubtitle:
      'Слева доступна навигация по разделам, справа — вопросы выбранной темы и ответы к ним.',
    open: 'Открыть',
    answer: 'Ответ',
  },
  en: {
    siteTitle: 'IT INTERVIEW',
    madeByLabel: 'Made by',
    heroTitle: 'Prepare for IT interviews in one place',
    heroSubtitle:
      'This site contains a large question bank for IT interview preparation in Russian and English. It includes a question marathon, contents, answers, and convenient topic navigation.',
    languageTitle: 'Choose the question bank language',
    languageHint:
      'Choose the question bank language you want to enter. To begin, just click one of the language cards below.',
    languageRu: 'Russian',
    languageEn: 'English',
    chooseLanguageCardHint:
      'After clicking a card, the selected question bank language will be saved and used on the next pages.',
    updatedAt: 'Question bank last updated',
    totalQuestions: 'Question count',
    totalAnswers: 'Answer count',
    totalHeadings: 'Topics and subtopics',
    selectedLanguage: 'Selected question bank language',
    themeLight: 'Light',
    themeDark: 'Dark',
    menuTitle: 'Choose a mode',
    menuSubtitle: 'Below are the main ways to work with the question bank.',
    backHome: 'Back to home page',
    backToModes: 'Back to mode selection',
    noAnswerYet: 'There is no answer for this question yet.',
    answersSoon: 'Answers will appear soon.',
    revealAnswer: 'Hint',
    hideAnswer: 'Hide hint',
    previous: 'Previous',
    next: 'Next',
    questionOf: 'Question',
    topic: 'Topic',
    subtopic: 'Subtopic',
    subtopics: 'Subtopics',
    randomModeHint: 'Questions are shuffled randomly.',
    chooseTopicsTitle: 'Choose topics and subtopics',
    chooseTopicsHint:
      'Select the needed items or choose everything, then start the marathon for the selected sections.',
    selectAll: 'Select all',
    clearAll: 'Clear all',
    startMarathon: 'Start marathon',
    selectedItems: 'Selected items',
    nothingSelected: 'Select at least one item first.',
    noQuestionsForSelection: 'No questions found for the current selection.',
    closeSelection: 'Change selection',
    shuffleAgain: 'Shuffle again',
    confirmLeaveTitle: 'Go to home page?',
    confirmLeaveText:
      'You are currently in a marathon. If you go to the home page, the current progress on this page will be reset.',
    confirmLeaveStay: 'Stay',
    confirmLeaveGo: 'Go',
    confirmBackToModesTitle: 'Return to mode selection?',
    confirmBackToModesText:
      'You are currently in a marathon. If you return to mode selection, the current progress on this page will be reset.',
    confirmBackToModesGo: 'Return',
    showContents: 'Show contents',
    hideContents: 'Hide contents',
    contents: 'Contents',
    currentSection: 'Current section',
    noContentAvailable: 'Content is not available yet.',
    marathonTitle: 'Question marathon',
    marathonText:
      'First choose all topics or specific sections, then go through questions in random order.',
    overviewTitle: 'Contents, questions and answers',
    overviewText:
      'Open the contents, choose a section, and study questions with expandable answers.',
    overviewSubtitle:
      'Navigation by sections is on the left, and selected topic questions with answers are on the right.',
    open: 'Open',
    answer: 'Answer',
  },
}

function detectInitialLanguage(): Language {
  if (typeof navigator === 'undefined') {
    return 'en'
  }

  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function detectSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function formatDate(isoDate: string, language: Language) {
  return new Date(isoDate).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatsForBankLanguage(
  data: ContentIndex | null,
  bankLanguage: Language
): LanguageStats {
  if (!data) {
    return EMPTY_LANGUAGE_STATS
  }

  return bankLanguage === 'ru'
    ? data.contentStats.byLanguage.RU
    : data.contentStats.byLanguage.EN
}

function getContentForBankLanguage(
  data: ContentData | null,
  bankLanguage: Language
): LanguageContentData {
  if (!data) {
    return EMPTY_LANGUAGE_CONTENT
  }

  return bankLanguage === 'ru' ? data.byLanguage.RU : data.byLanguage.EN
}

function shuffleArray<T>(items: T[]) {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }

  return result
}

function getQuestionSubtopicTrail(question: ParsedQuestion, tocFlat: TocFlatNode[]) {
  const tocMap = new Map(tocFlat.map((item) => [item.id, item]))
  const currentNode = tocMap.get(question.subtopicId)

  if (!currentNode) {
    return question.subtopicTitle ? [question.subtopicTitle] : []
  }

  const trailIds = [...currentNode.parentIds, currentNode.id]
  const titles = trailIds
    .map((id) => tocMap.get(id))
    .filter((node): node is TocFlatNode => Boolean(node))
    .filter((node) => node.level >= 3)
    .map((node) => node.title)

  return titles.length > 0
    ? titles
    : question.subtopicTitle
      ? [question.subtopicTitle]
      : []
}

function getInitialSelectionId(tocFlat: TocFlatNode[]) {
  return tocFlat[0]?.id ?? ''
}

function getSelectedNodeWithDescendants(selectedId: string, tocFlat: TocFlatNode[]) {
  const node = tocFlat.find((item) => item.id === selectedId)

  if (!node) {
    return {
      node: null,
      allowedIds: new Set<string>(),
    }
  }

  return {
    node,
    allowedIds: new Set([node.id, ...node.childrenIds]),
  }
}

function getNodeTitleTrail(nodeId: string, tocFlat: TocFlatNode[]) {
  const tocMap = new Map(tocFlat.map((item) => [item.id, item]))
  const node = tocMap.get(nodeId)

  if (!node) {
    return []
  }

  return [...node.parentIds, node.id]
    .map((id) => tocMap.get(id))
    .filter((item): item is TocFlatNode => Boolean(item))
    .map((item) => item.title)
}

function getSubtopicTitleTrail(nodeId: string, tocFlat: TocFlatNode[]) {
  const tocMap = new Map(tocFlat.map((item) => [item.id, item]))
  const node = tocMap.get(nodeId)

  if (!node) {
    return []
  }

  return [...node.parentIds, node.id]
    .map((id) => tocMap.get(id))
    .filter((item): item is TocFlatNode => Boolean(item))
    .filter((item) => item.level >= 3)
    .map((item) => item.title)
}

function getQuestionsForSelectedNode(
  selectedId: string,
  questions: ParsedQuestion[],
  tocFlat: TocFlatNode[]
) {
  const selectedNodeData = getSelectedNodeWithDescendants(selectedId, tocFlat)

  if (!selectedNodeData.node) {
    return []
  }

  return questions.filter((question) =>
    question.headingIds.some((id) => selectedNodeData.allowedIds.has(id))
  )
}

function getQuestionsForSelectedIds(
  selectedIds: string[],
  questions: ParsedQuestion[]
) {
  if (selectedIds.length === 0) {
    return []
  }

  const selectedSet = new Set(selectedIds)

  return questions.filter(
    (question) =>
      question.headingIds.some((id) => selectedSet.has(id)) ||
      selectedSet.has(question.topicId) ||
      selectedSet.has(question.subtopicId)
  )
}

function groupQuestionsBySubtopic(
  questions: ParsedQuestion[],
  tocFlat: TocFlatNode[],
  selectedTitleTrail: string[]
) {
  const groups: OverviewQuestionGroup[] = []
  const groupMap = new Map<string, OverviewQuestionGroup>()

  for (const question of questions) {
    const groupKey = question.subtopicId || question.subtopicTitle || question.id
    const existingGroup = groupMap.get(groupKey)

    if (existingGroup) {
      existingGroup.questions.push(question)
      continue
    }

    const fullSubtopicTrail = question.subtopicId
      ? getSubtopicTitleTrail(question.subtopicId, tocFlat)
      : []

    const filteredSubtopicTrail = fullSubtopicTrail.filter(
      (title) => !selectedTitleTrail.includes(title)
    )

    const newGroup: OverviewQuestionGroup = {
      subtopicId: groupKey,
      subtopicTitle: question.subtopicTitle || question.topicTitle,
      subtopicTrail:
        filteredSubtopicTrail.length > 0
          ? filteredSubtopicTrail
          : fullSubtopicTrail.length > 0
            ? [fullSubtopicTrail[fullSubtopicTrail.length - 1]]
            : question.subtopicTitle
              ? [question.subtopicTitle]
              : question.topicTitle
                ? [question.topicTitle]
                : [],
      questions: [question],
    }

    groupMap.set(groupKey, newGroup)
    groups.push(newGroup)
  }

  return groups
}

type SharedPageProps = {
  interfaceLanguage: Language
  bankLanguage: Language
  theme: ThemeMode
  onToggleTheme: () => void
  text: Dictionary
}

function App() {
  const initialLanguage = detectInitialLanguage()
  const [data, setData] = useState<ContentIndex | null>(null)
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [interfaceLanguage, setInterfaceLanguage] = useState<Language>(initialLanguage)
  const [bankLanguage, setBankLanguage] = useState<Language>(initialLanguage)
  const [theme, setTheme] = useState<ThemeMode>(detectSystemTheme())

  useEffect(() => {
    document.documentElement.lang = interfaceLanguage
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.title = 'IT INTERVIEW'
  }, [interfaceLanguage, theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateThemeFromSystem = () => {
      setTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    updateThemeFromSystem()
    mediaQuery.addEventListener('change', updateThemeFromSystem)

    return () => {
      mediaQuery.removeEventListener('change', updateThemeFromSystem)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    fetch(`${import.meta.env.BASE_URL}content-index.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load index: ${res.status}`)
        }
        return res.json()
      })
      .then((json: ContentIndex) => {
        if (!isCancelled) {
          setData(json)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setData(null)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    fetch(`${import.meta.env.BASE_URL}content-data.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load content data: ${res.status}`)
        }
        return res.json()
      })
      .then((json: ContentData) => {
        if (!isCancelled) {
          setContentData(json)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setContentData(null)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const text = TEXT[interfaceLanguage]

  const ruStats = useMemo(() => getStatsForBankLanguage(data, 'ru'), [data])
  const enStats = useMemo(() => getStatsForBankLanguage(data, 'en'), [data])

  const sharedProps: SharedPageProps = {
    interfaceLanguage,
    bankLanguage,
    theme,
    onToggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    text,
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            {...sharedProps}
            data={data}
            ruStats={ruStats}
            enStats={enStats}
            onInterfaceLanguageChange={setInterfaceLanguage}
            onSelectLanguage={(language) => {
              setBankLanguage(language)
              setInterfaceLanguage(language)
            }}
          />
        }
      />

      <Route path="/menu" element={<MenuPage {...sharedProps} />} />

      <Route
        path="/marathon"
        element={
          <MarathonPage
            key={`marathon-${bankLanguage}`}
            {...sharedProps}
            contentData={contentData}
          />
        }
      />

      <Route
        path="/overview"
        element={
          <OverviewPage
            key={`overview-${bankLanguage}`}
            {...sharedProps}
            contentData={contentData}
          />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

type HomePageProps = SharedPageProps & {
  data: ContentIndex | null
  ruStats: LanguageStats
  enStats: LanguageStats
  onInterfaceLanguageChange: (language: Language) => void
  onSelectLanguage: (language: Language) => void
}

function HomePage({
  interfaceLanguage,
  theme,
  onToggleTheme,
  text,
  data,
  ruStats,
  enStats,
  onInterfaceLanguageChange,
  onSelectLanguage,
}: HomePageProps) {
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  function handleSelectLanguage(language: Language) {
    onSelectLanguage(language)
    navigate('/menu')
  }

  return (
    <main
      className={`page-fade min-h-screen ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                {text.heroTitle}
              </h1>

              <p
                className={`mt-6 text-lg leading-8 sm:text-xl ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {text.heroSubtitle}
              </p>
            </div>

            <div
              className={`mx-auto mt-10 max-w-4xl rounded-3xl border p-6 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="text-center">
                <h2 className="text-xl font-semibold">{text.languageTitle}</h2>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {text.languageHint}
                </p>
                <p
                  className={`mt-2 text-sm ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {text.chooseLanguageCardHint}
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <LanguageChoiceCard
                  title={text.languageRu}
                  languageCode="RU"
                  stats={ruStats}
                  text={text}
                  theme={theme}
                  onClick={() => handleSelectLanguage('ru')}
                />
                <LanguageChoiceCard
                  title={text.languageEn}
                  languageCode="EN"
                  stats={enStats}
                  text={text}
                  theme={theme}
                  onClick={() => handleSelectLanguage('en')}
                />
              </div>

              <div
                className={`mt-6 rounded-2xl border p-4 text-center ${
                  isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div
                  className={`text-sm ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {text.updatedAt}
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {data ? formatDate(data.generatedAt, interfaceLanguage) : '—'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

type MenuPageProps = SharedPageProps

function MenuPage({
  interfaceLanguage,
  bankLanguage,
  theme,
  onToggleTheme,
  text,
}: MenuPageProps) {
  const location = useLocation()
  const isDark = theme === 'dark'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  const selectedLanguageName = bankLanguage === 'ru' ? text.languageRu : text.languageEn

  return (
    <main
      className={`page-fade min-h-screen ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
        />

        <div className="mt-6">
          <Link
            to="/"
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            ← {text.backHome}
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <h1 className="text-3xl font-semibold">{text.menuTitle}</h1>

          <p
            className={`mt-4 text-lg leading-8 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {text.menuSubtitle}
          </p>

          <p
            className={`mt-2 text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {text.selectedLanguage}:{' '}
            <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
              {selectedLanguageName}
            </span>
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <MenuCard
            theme={theme}
            title={text.marathonTitle}
            description={text.marathonText}
            cta={text.open}
            to="/marathon"
          />
          <MenuCard
            theme={theme}
            title={text.overviewTitle}
            description={text.overviewText}
            cta={text.open}
            to="/overview"
          />
        </div>
      </div>
    </main>
  )
}

type MarathonPageProps = SharedPageProps & {
  contentData: ContentData | null
}

function MarathonPage({
  interfaceLanguage,
  bankLanguage,
  theme,
  onToggleTheme,
  text,
  contentData,
}: MarathonPageProps) {
  const navigate = useNavigate()
  const content = useMemo(
    () => getContentForBankLanguage(contentData, bankLanguage),
    [contentData, bankLanguage]
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(true)
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerOpen, setIsAnswerOpen] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [isMenuConfirmOpen, setIsMenuConfirmOpen] = useState(false)
  const isDark = theme === 'dark'

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const selectedQuestionsCount = useMemo(
    () => getQuestionsForSelectedIds(selectedIds, content.questions).length,
    [selectedIds, content.questions]
  )

  function toggleNode(node: TocFlatNode) {
    const idsToChange = [node.id, ...node.childrenIds]
    const shouldSelect = !selectedSet.has(node.id)

    setSelectedIds((prev) => {
      const next = new Set(prev)

      if (shouldSelect) {
        for (const id of idsToChange) {
          next.add(id)
        }
      } else {
        for (const id of idsToChange) {
          next.delete(id)
        }
      }

      return [...next]
    })
  }

  function startSelectedMarathon() {
    const filtered = getQuestionsForSelectedIds(selectedIds, content.questions)

    if (filtered.length === 0) {
      return
    }

    setQuestions(shuffleArray(filtered))
    setCurrentIndex(0)
    setIsAnswerOpen(false)
    setIsSelectorOpen(false)
  }

  function reshuffleCurrentQuestions() {
    setQuestions((prev) => shuffleArray(prev))
    setShuffleSeed((prev) => prev + 1)
    setCurrentIndex(0)
    setIsAnswerOpen(false)
  }

  function handleBackToMenuClick() {
    if (isSelectorOpen) {
      navigate('/menu')
      return
    }

    setIsMenuConfirmOpen(true)
  }

  function handleConfirmBackToMenu() {
    setIsMenuConfirmOpen(false)
    navigate('/menu')
  }

  function handleCloseMenuConfirm() {
    setIsMenuConfirmOpen(false)
  }

  const currentQuestion = questions[currentIndex] ?? null

  function goToPreviousQuestion() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
    setIsAnswerOpen(false)
  }

  function goToNextQuestion() {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
    setIsAnswerOpen(false)
  }

  return (
    <main
      className={`page-fade min-h-screen ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
        />

        <div className="mt-6">
          <button
            type="button"
            onClick={handleBackToMenuClick}
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            ← {text.backToModes}
          </button>
        </div>

        {isSelectorOpen ? (
          <TopicSelectorPanel
            theme={theme}
            text={text}
            tocTree={content.tocTree}
            tocFlat={content.tocFlat}
            selectedIds={selectedIds}
            selectedQuestionsCount={selectedQuestionsCount}
            onToggleNode={toggleNode}
            onSelectAll={() => setSelectedIds(content.tocFlat.map((item) => item.id))}
            onClearAll={() => setSelectedIds([])}
            onStart={startSelectedMarathon}
          />
        ) : (
          <QuestionMarathonLayout
            key={shuffleSeed}
            theme={theme}
            text={text}
            title={text.marathonTitle}
            subtitle={`${text.selectedItems}: ${selectedIds.length}. ${text.randomModeHint}`}
            questions={questions}
            tocFlat={content.tocFlat}
            currentIndex={currentIndex}
            currentQuestion={currentQuestion}
            isAnswerOpen={isAnswerOpen}
            onToggleAnswer={() => setIsAnswerOpen((prev) => !prev)}
            onPrev={goToPreviousQuestion}
            onNext={goToNextQuestion}
            extraAction={
              <>
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(true)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  {text.closeSelection}
                </button>

                <button
                  type="button"
                  onClick={reshuffleCurrentQuestions}
                  className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  {text.shuffleAgain}
                </button>
              </>
            }
          />
        )}
      </div>

      {isMenuConfirmOpen && (
        <ConfirmLeaveModal
          theme={theme}
          title={text.confirmBackToModesTitle}
          description={text.confirmBackToModesText}
          stayLabel={text.confirmLeaveStay}
          goLabel={text.confirmBackToModesGo}
          siteTitle={text.siteTitle}
          onStay={handleCloseMenuConfirm}
          onGo={handleConfirmBackToMenu}
        />
      )}
    </main>
  )
}

type OverviewPageProps = SharedPageProps & {
  contentData: ContentData | null
}

function OverviewPage({
  interfaceLanguage,
  bankLanguage,
  theme,
  onToggleTheme,
  text,
  contentData,
}: OverviewPageProps) {
  const content = useMemo(
    () => getContentForBankLanguage(contentData, bankLanguage),
    [contentData, bankLanguage]
  )
  const isDark = theme === 'dark'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const overviewLayoutRef = useRef<HTMLDivElement | null>(null)

  const resolvedSelectedNodeId = useMemo(() => {
    if (selectedNodeId) {
      return selectedNodeId
    }

    return getInitialSelectionId(content.tocFlat)
  }, [selectedNodeId, content.tocFlat])

  const selectedNodeData = useMemo(
    () => getSelectedNodeWithDescendants(resolvedSelectedNodeId, content.tocFlat),
    [resolvedSelectedNodeId, content.tocFlat]
  )

  const selectedTitleTrail = useMemo(
    () => getNodeTitleTrail(resolvedSelectedNodeId, content.tocFlat),
    [resolvedSelectedNodeId, content.tocFlat]
  )

  const selectedQuestions = useMemo(
    () =>
      getQuestionsForSelectedNode(
        resolvedSelectedNodeId,
        content.questions,
        content.tocFlat
      ),
    [resolvedSelectedNodeId, content.questions, content.tocFlat]
  )

  function handleSelectOverviewNode(nodeId: string) {
    setSelectedNodeId(nodeId)

    window.requestAnimationFrame(() => {
      const layoutElement = overviewLayoutRef.current

      if (!layoutElement) {
        return
      }

      const targetTop = layoutElement.getBoundingClientRect().top + window.scrollY

      window.scrollTo({
        top: Math.max(targetTop - 24, 0),
        behavior: 'smooth',
      })
    })
  }

  return (
    <main
      className={`page-fade min-h-screen ${
        isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
        />

        <div className="mt-6">
          <Link
            to="/menu"
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            ← {text.backToModes}
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <h1 className="text-3xl font-semibold">{text.overviewTitle}</h1>

          <p
            className={`mt-4 text-lg leading-8 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {text.overviewSubtitle}
          </p>
        </div>


        <div
          ref={overviewLayoutRef}
          className={`mt-10 flex items-start ${
            isSidebarOpen
              ? 'gap-6 overflow-hidden lg:overflow-visible'
              : 'gap-0 overflow-visible lg:gap-6'
          }`}
        >
          <aside
            className={`min-w-0 shrink-0 self-start transition-all duration-300 ease-in-out lg:sticky lg:top-6 ${
              isSidebarOpen
                ? 'w-full translate-x-0 opacity-100 lg:w-[46%] xl:max-w-[50%]'
                : 'w-0 -translate-x-full opacity-0'
            }`}
            aria-hidden={!isSidebarOpen}
          >
            <div
              className={`max-h-[70vh] overflow-hidden rounded-3xl border shadow-sm ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div
                className={`flex items-center justify-between gap-4 border-b px-5 py-4 ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div className="min-w-0 text-lg font-semibold">{text.contents}</div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label={text.hideContents}
                  title={text.hideContents}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg font-semibold transition hover:scale-105 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ‹
                </button>
              </div>

              <div className="max-h-[calc(70vh-73px)] overflow-y-auto px-4 py-4">
                <OverviewTocTree
                  nodes={content.tocTree}
                  activeHeadingId={resolvedSelectedNodeId}
                  onSelect={handleSelectOverviewNode}
                  theme={theme}
                />
              </div>
            </div>
          </aside>

          <section
            className={`min-w-0 transition-all duration-300 ease-in-out ${
              isSidebarOpen
                ? 'hidden lg:block lg:flex-1'
                : '-mx-6 w-[calc(100%+3rem)] max-w-none flex-none sm:mx-auto sm:w-full sm:max-w-5xl sm:flex-1'
            }`}
          >
            <div
              className={`w-full border-y border-x-0 px-3 py-4 sm:rounded-3xl sm:border sm:px-6 sm:py-6 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              {!selectedNodeData.node ? (
                <EmptyContentCard text={text} theme={theme} />
              ) : (
                <OverviewQuestionsPanel
                  key={resolvedSelectedNodeId}
                  selectedTitleTrail={selectedTitleTrail}
                  selectedQuestions={selectedQuestions}
                  tocFlat={content.tocFlat}
                  text={text}
                  theme={theme}
                  isSidebarOpen={isSidebarOpen}
                  onShowContents={() => setIsSidebarOpen(true)}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

type OverviewQuestionsPanelProps = {
  selectedTitleTrail: string[]
  selectedQuestions: ParsedQuestion[]
  tocFlat: TocFlatNode[]
  text: Dictionary
  theme: ThemeMode
  isSidebarOpen: boolean
  onShowContents: () => void
}

function OverviewQuestionsPanel({
  selectedTitleTrail,
  selectedQuestions,
  tocFlat,
  text,
  theme,
  isSidebarOpen,
  onShowContents,
}: OverviewQuestionsPanelProps) {
  const isDark = theme === 'dark'
  const groupedQuestions = useMemo(
    () => groupQuestionsBySubtopic(selectedQuestions, tocFlat, selectedTitleTrail),
    [selectedQuestions, tocFlat, selectedTitleTrail]
  )
  const firstSubtopicId = groupedQuestions[0]?.subtopicId ?? ''
  const firstSubtopicTrail = useMemo(
    () => getNodeTitleTrail(firstSubtopicId, tocFlat),
    [firstSubtopicId, tocFlat]
  )

  const [activeSubtopicTrail, setActiveSubtopicTrail] = useState(firstSubtopicTrail)
  const [shouldShowBackTop, setShouldShowBackTop] = useState(false)
  const subtopicRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const visibleTitleTrail = useMemo(() => {
    const result: string[] = []

    for (const title of [...selectedTitleTrail, ...activeSubtopicTrail]) {
      if (!title) {
        continue
      }

      if (result[result.length - 1] === title) {
        continue
      }

      if (result.includes(title)) {
        continue
      }

      result.push(title)
    }

    return result
  }, [selectedTitleTrail, activeSubtopicTrail])

  useEffect(() => {
    let animationFrameId = 0

    function updateScrollState() {
      animationFrameId = 0

      const nextShouldShowBackTop = window.scrollY > 560
      setShouldShowBackTop((prev) =>
        prev === nextShouldShowBackTop ? prev : nextShouldShowBackTop
      )

      let nextActiveTrail = firstSubtopicTrail

      for (const group of groupedQuestions) {
        const element = subtopicRefs.current[group.subtopicId]

        if (!element) {
          continue
        }

        const rect = element.getBoundingClientRect()

        if (rect.top <= 170) {
          nextActiveTrail = getNodeTitleTrail(group.subtopicId, tocFlat)
        }
      }

      setActiveSubtopicTrail((prev) => {
        if (
          prev.length === nextActiveTrail.length &&
          prev.every((item, itemIndex) => item === nextActiveTrail[itemIndex])
        ) {
          return prev
        }

        return nextActiveTrail
      })
    }

    function handleScroll() {
      if (animationFrameId) {
        return
      }

      animationFrameId = window.requestAnimationFrame(updateScrollState)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    animationFrameId = window.requestAnimationFrame(updateScrollState)

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId)
      }

      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [firstSubtopicTrail, groupedQuestions, tocFlat])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (selectedQuestions.length === 0) {
    return <EmptyContentCard text={text} theme={theme} />
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div
        className={`sticky top-0 z-30 -mx-3 border-y border-x-0 px-3 py-2 shadow-sm backdrop-blur sm:top-4 sm:mx-0 sm:rounded-3xl sm:border sm:px-5 sm:py-4 ${
          !isSidebarOpen ? 'pl-14 pr-12 sm:pl-5 sm:pr-16' : 'pr-12 sm:pr-16'
        } ${
          isDark
            ? 'border-white/10 bg-slate-950/92'
            : 'border-slate-200 bg-white/92'
        }`}
      >
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={onShowContents}
            aria-label={text.showContents}
            title={text.showContents}
            className={`absolute left-2 top-1/2 z-50 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-lg font-semibold shadow-lg transition hover:scale-105 sm:left-[calc((100%-100vw)/2+1rem)] sm:h-10 sm:w-10 sm:text-xl ${
              isDark
                ? 'border-white/10 bg-slate-950/95 text-slate-200 hover:bg-white/10'
                : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ›
          </button>
        )}

        <div
          className={`text-xs uppercase tracking-[0.2em] ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {text.currentSection}
        </div>

        <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
          {visibleTitleTrail.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={
                index === 0
                  ? 'break-words text-lg font-semibold leading-6 sm:text-2xl sm:leading-normal'
                  : index === 1
                    ? 'break-words text-sm font-semibold leading-5 sm:text-lg sm:leading-normal'
                    : 'break-words text-xs font-semibold leading-5 sm:text-sm sm:leading-normal'
              }
            >
              {item}
            </div>
          ))}
        </div>

        {shouldShowBackTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Scroll to top"
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border text-base font-semibold shadow-sm transition hover:scale-105 sm:right-4 sm:top-4 sm:h-9 sm:w-9 sm:text-lg ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            ↑
          </button>
        )}
      </div>

      <div className="space-y-6 sm:space-y-8">
        {groupedQuestions.map((group) => (
          <div
            key={group.subtopicId}
            ref={(element) => {
              subtopicRefs.current[group.subtopicId] = element
            }}
            className="scroll-mt-36"
          >
            <div
              className={`mb-5 rounded-3xl border px-5 py-4 ${
                isDark
                  ? 'border-white/10 bg-slate-900/70 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              <div
                className={`text-xs uppercase tracking-[0.2em] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {text.subtopic}
              </div>

              <div className="mt-2 space-y-1.5">
                {group.subtopicTrail.map((item, itemIndex) => (
                  <div
                    key={`${group.subtopicId}-${item}-${itemIndex}`}
                    className={
                      itemIndex === 0
                        ? 'break-words text-lg font-semibold leading-7 sm:text-xl'
                        : 'break-words text-sm font-semibold leading-6 sm:text-base'
                    }
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {group.questions.map((question, questionIndex) => (
                <OverviewQuestionAnswerBlock
                  key={question.id}
                  question={question}
                  index={selectedQuestions.findIndex((item) => item.id === question.id)}
                  fallbackIndex={questionIndex}
                  text={text}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type EmptyContentCardProps = {
  text: Dictionary
  theme: ThemeMode
}

function EmptyContentCard({ text, theme }: EmptyContentCardProps) {
  const isDark = theme === 'dark'

  return (
    <div
      className={`rounded-3xl border p-8 ${
        isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
        {text.noContentAvailable}
      </p>
    </div>
  )
}

type OverviewTocTreeProps = {
  nodes: TocNode[]
  activeHeadingId: string
  onSelect: (id: string) => void
  theme: ThemeMode
}

function OverviewTocTree({
  nodes,
  activeHeadingId,
  onSelect,
  theme,
}: OverviewTocTreeProps) {
  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <OverviewTocNode
          key={node.id}
          node={node}
          activeHeadingId={activeHeadingId}
          onSelect={onSelect}
          theme={theme}
        />
      ))}
    </div>
  )
}

type OverviewTocNodeProps = {
  node: TocNode
  activeHeadingId: string
  onSelect: (id: string) => void
  theme: ThemeMode
}

function OverviewTocNode({
  node,
  activeHeadingId,
  onSelect,
  theme,
}: OverviewTocNodeProps) {
  const isDark = theme === 'dark'
  const isActive = activeHeadingId === node.id

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`w-full whitespace-normal break-words rounded-2xl px-3 py-2 text-left transition ${
          isActive
            ? isDark
              ? 'bg-white text-slate-950'
              : 'bg-slate-950 text-white'
            : isDark
              ? 'text-slate-200 hover:bg-white/10'
              : 'text-slate-700 hover:bg-slate-100'
        } ${node.level === 2 ? 'font-semibold' : node.level === 3 ? 'font-medium' : 'text-sm'} ${
          node.level === 4
            ? 'ml-4 max-w-[calc(100%-1rem)]'
            : node.level === 3
              ? 'ml-2 max-w-[calc(100%-0.5rem)]'
              : ''
        }`}
      >
        {node.title}
      </button>

      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <OverviewTocNode
              key={child.id}
              node={child}
              activeHeadingId={activeHeadingId}
              onSelect={onSelect}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type OverviewQuestionAnswerBlockProps = {
  question: ParsedQuestion
  index: number
  fallbackIndex?: number
  text: Dictionary
  theme: ThemeMode
}

function OverviewQuestionAnswerBlock({
  question,
  index,
  fallbackIndex = 0,
  text,
  theme,
}: OverviewQuestionAnswerBlockProps) {
  const isDark = theme === 'dark'
  const [isAnswerOpen, setIsAnswerOpen] = useState(false)
  const questionNumber = index >= 0 ? index + 1 : fallbackIndex + 1

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-6 ${
        isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div
        className={`text-xs uppercase tracking-[0.2em] ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {text.questionOf} {questionNumber}
      </div>

      <h3 className="mt-3 text-xl font-semibold leading-8">{question.text}</h3>

      <button
        type="button"
        onClick={() => setIsAnswerOpen((prev) => !prev)}
        className={`mt-5 inline-flex items-center gap-2 text-sm underline-offset-4 transition hover:underline ${
          isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <span className={`transition ${isAnswerOpen ? 'rotate-180' : ''}`}>⌄</span>
        {isAnswerOpen ? text.hideAnswer : text.revealAnswer}
      </button>

      {isAnswerOpen && (
        <div
          className={`mt-5 border-t pt-5 text-left leading-7 ${
            isDark ? 'border-white/10 text-slate-100' : 'border-slate-200 text-slate-700'
          }`}
        >
          <div
            className={`mb-3 text-xs uppercase tracking-[0.2em] ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {text.answer}
          </div>

          {question.hasAnswer ? (
            <FormattedAnswer text={question.answer} />
          ) : (
            <p>{text.answersSoon}</p>
          )}
        </div>
      )}
    </div>
  )
}

type TopicSelectorPanelProps = {
  theme: ThemeMode
  text: Dictionary
  tocTree: TocNode[]
  tocFlat: TocFlatNode[]
  selectedIds: string[]
  selectedQuestionsCount: number
  onToggleNode: (node: TocFlatNode) => void
  onSelectAll: () => void
  onClearAll: () => void
  onStart: () => void
}

function TopicSelectorPanel({
  theme,
  text,
  tocTree,
  tocFlat,
  selectedIds,
  selectedQuestionsCount,
  onToggleNode,
  onSelectAll,
  onClearAll,
  onStart,
}: TopicSelectorPanelProps) {
  const isDark = theme === 'dark'
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const flatMap = useMemo(
    () => new Map(tocFlat.map((item) => [item.id, item])),
    [tocFlat]
  )

  return (
    <section className="mt-6 sm:mt-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold">{text.chooseTopicsTitle}</h1>
        <p
          className={`mt-4 text-lg leading-8 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {text.chooseTopicsHint}
        </p>
      </div>


      <div
        className={`sticky top-0 z-40 -mx-6 mt-6 border-x-0 border-y p-2 backdrop-blur sm:top-4 sm:mx-0 sm:mt-8 sm:rounded-3xl sm:border sm:p-4 ${
          isDark
            ? 'border-white/10 bg-slate-950/92'
            : 'border-slate-200 bg-white/92'
        }`}
      >
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <div
            className={`col-span-3 w-full rounded-2xl border px-3 py-2 text-[11px] leading-4 sm:min-w-0 sm:flex-1 sm:px-4 sm:py-3 sm:text-sm sm:leading-normal ${
              isDark
                ? 'border-white/10 bg-black/10 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <span className="font-medium">{text.selectedItems}:</span>{' '}
            <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {selectedIds.length}
            </span>
            <span className="mx-2">·</span>
            <span className="font-medium">{text.totalQuestions}:</span>{' '}
            <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {selectedQuestionsCount}
            </span>
          </div>

          <button
            type="button"
            onClick={onSelectAll}
            className={`w-full rounded-2xl border px-2 py-2 text-[11px] font-medium leading-4 transition sm:w-auto sm:shrink-0 sm:px-4 sm:py-3 sm:text-sm sm:leading-normal ${
              isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10'
                : 'border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            {text.selectAll}
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className={`w-full rounded-2xl border px-2 py-2 text-[11px] font-medium leading-4 transition sm:w-auto sm:shrink-0 sm:px-4 sm:py-3 sm:text-sm sm:leading-normal ${
              isDark
                ? 'border-white/10 bg-white/5 hover:bg-white/10'
                : 'border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            {text.clearAll}
          </button>

          <button
            type="button"
            onClick={onStart}
            disabled={selectedQuestionsCount === 0}
            className={`w-full rounded-2xl px-2 py-2 text-[11px] font-semibold leading-4 transition disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1 sm:w-auto sm:shrink-0 sm:px-5 sm:py-3 sm:text-sm sm:leading-normal ${
              isDark
                ? 'bg-white text-slate-950 hover:bg-slate-100'
                : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            {text.startMarathon}
          </button>
        </div>
      </div>

      {tocTree.length === 0 ? (
        <p className={`mt-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {text.noQuestionsForSelection}
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {tocTree.map((node) => (
            <TopicTreeNode
              key={node.id}
              node={node}
              flatMap={flatMap}
              selectedSet={selectedSet}
              onToggleNode={onToggleNode}
              theme={theme}
            />
          ))}
        </div>
      )}

      {selectedIds.length === 0 && (
        <p
          className={`mt-6 text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {text.nothingSelected}
        </p>
      )}
    </section>
  )
}

type TopicTreeNodeProps = {
  node: TocNode
  flatMap: Map<string, TocFlatNode>
  selectedSet: Set<string>
  onToggleNode: (node: TocFlatNode) => void
  theme: ThemeMode
}

function TopicTreeNode({
  node,
  flatMap,
  selectedSet,
  onToggleNode,
  theme,
}: TopicTreeNodeProps) {
  const isDark = theme === 'dark'
  const flatNode = flatMap.get(node.id)

  if (!flatNode) {
    return null
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selectedSet.has(node.id)}
          onChange={() => onToggleNode(flatNode)}
          className="mt-1 h-4 w-4"
        />
        <span
          className={`leading-7 ${
            node.level === 2
              ? 'text-lg font-semibold'
              : node.level === 3
                ? 'font-medium'
                : ''
          }`}
        >
          {node.title}
        </span>
      </label>

      {node.children.length > 0 && (
        <div className="mt-3 space-y-3 pl-6">
          {node.children.map((child) => (
            <TopicTreeNode
              key={child.id}
              node={child}
              flatMap={flatMap}
              selectedSet={selectedSet}
              onToggleNode={onToggleNode}
              theme={theme}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type QuestionMarathonLayoutProps = {
  theme: ThemeMode
  text: Dictionary
  title: string
  subtitle: string
  questions: ParsedQuestion[]
  tocFlat: TocFlatNode[]
  currentIndex: number
  currentQuestion: ParsedQuestion | null
  isAnswerOpen: boolean
  onToggleAnswer: () => void
  onPrev: () => void
  onNext: () => void
  extraAction?: ReactNode
}

function QuestionMarathonLayout({
  theme,
  text,
  title,
  subtitle,
  questions,
  tocFlat,
  currentIndex,
  currentQuestion,
  isAnswerOpen,
  onToggleAnswer,
  onPrev,
  onNext,
  extraAction,
}: QuestionMarathonLayoutProps) {
  const isDark = theme === 'dark'
  const subtopicTrail = currentQuestion
    ? getQuestionSubtopicTrail(currentQuestion, tocFlat)
    : []

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName.toLowerCase()

      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrev()
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onPrev, onNext])

  return (
    <section className="mt-6 sm:mt-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold">{title}</h1>

        <p
          className={`mt-4 text-lg leading-8 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {subtitle}
        </p>

        {extraAction && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {extraAction}
          </div>
        )}
      </div>

      {questions.length === 0 || !currentQuestion ? (
        <div
          className={`mx-auto mt-10 max-w-3xl rounded-3xl border p-8 text-center ${
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
          }`}
        >
          <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
            {text.noQuestionsForSelection}
          </p>
        </div>
      ) : (
        <div
          className={`-mx-6 mt-8 w-[calc(100%+3rem)] border-y border-x-0 p-3 shadow-sm sm:mx-auto sm:mt-10 sm:w-full sm:max-w-4xl sm:rounded-3xl sm:border sm:p-6 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
          }`}
        >
          <div
            className={`inline-flex rounded-2xl border px-4 py-2 text-sm ${
              isDark
                ? 'border-white/10 bg-black/10 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {text.questionOf} {currentIndex + 1} / {questions.length}
          </div>

          <div className="mt-6 max-w-2xl space-y-4 text-left">
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {text.topic}:{' '}
              <span className={isDark ? 'text-white' : 'text-slate-900'}>
                {currentQuestion.topicTitle}
              </span>
            </div>

            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {(subtopicTrail.length > 1 ? text.subtopics : text.subtopic)}:
              <div className="mt-2 space-y-1">
                {subtopicTrail.map((item) => (
                  <div key={item} className={isDark ? 'text-white' : 'text-slate-900'}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`mt-6 rounded-3xl border p-4 text-center sm:p-6 ${
              isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <h2 className="mx-auto max-w-3xl text-center text-xl font-semibold leading-8 sm:text-2xl sm:leading-9">
              {currentQuestion.text}
            </h2>

            <button
              type="button"
              onClick={onToggleAnswer}
              className={`mt-5 inline-flex items-center gap-1 text-sm underline-offset-4 transition hover:underline ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`text-xs transition ${isAnswerOpen ? 'rotate-180' : ''}`}>
                ⌄
              </span>
              {isAnswerOpen ? text.hideAnswer : text.revealAnswer}
            </button>
          </div>

          {isAnswerOpen && (
            <div
              className={`mt-3 rounded-3xl border p-4 text-left leading-7 sm:mt-4 sm:p-5 ${
                isDark
                  ? 'border-white/10 bg-slate-900/70 text-slate-100'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {currentQuestion.hasAnswer ? (
                <FormattedAnswer text={currentQuestion.answer} />
              ) : (
                <p>{text.answersSoon}</p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
            >
              ← {text.previous}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex >= questions.length - 1}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
            >
              {text.next} →
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

type FormattedAnswerProps = {
  text: string
}

type AnswerToken =
  | {
      type: 'paragraph'
      lines: string[]
    }
  | {
      type: 'list'
      items: string[]
    }
  | {
      type: 'code'
      language: string
      code: string
    }
  | {
      type: 'table'
      rows: string[][]
    }
  | {
      type: 'space'
    }


function renderInlineMarkdown(value: string, theme: ThemeMode) {
  const isDark = theme === 'dark'
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g)

  return parts.map((part, index) => {
    if (!part) {
      return null
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={`${part}-${index}`}
          className={`rounded-md border px-1.5 py-0.5 font-mono text-[0.9em] ${
            isDark
              ? 'border-white/10 bg-white/10 text-slate-100'
              : 'border-slate-200 bg-slate-100 text-slate-900'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      )
    }

    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function isMarkdownTableSeparator(line: string) {
  const trimmed = line.trim()

  if (!trimmed.includes('|')) {
    return false
  }

  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed)
}

function parseMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isMarkdownTableStart(lines: string[], index: number) {
  const currentLine = lines[index]
  const nextLine = lines[index + 1]

  return Boolean(
    currentLine &&
      nextLine &&
      currentLine.includes('|') &&
      isMarkdownTableSeparator(nextLine)
  )
}

function parseAnswerTokens(text: string): AnswerToken[] {
  const lines = text.replace(/\r/g, '').split('\n')
  const tokens: AnswerToken[] = []

  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      tokens.push({ type: 'space' })
      index += 1
      continue
    }

    const codeFenceMatch = trimmed.match(/^```([\w#+.-]*)\s*$/)

    if (codeFenceMatch) {
      const language = codeFenceMatch[1] || ''
      const codeLines: string[] = []

      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      tokens.push({
        type: 'code',
        language,
        code: codeLines.join('\n'),
      })

      continue
    }

    if (isMarkdownTableStart(lines, index)) {
      const tableRows: string[][] = [parseMarkdownTableRow(lines[index])]

      index += 2

      while (index < lines.length && lines[index].includes('|')) {
        const tableLine = lines[index].trim()

        if (!tableLine || tableLine.startsWith('```')) {
          break
        }

        tableRows.push(parseMarkdownTableRow(tableLine))
        index += 1
      }

      tokens.push({
        type: 'table',
        rows: tableRows,
      })

      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }

      tokens.push({
        type: 'list',
        items,
      })

      continue
    }

    const paragraphLines: string[] = []

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().match(/^```([\w#+.-]*)\s*$/) &&
      !isMarkdownTableStart(lines, index) &&
      !/^[-*]\s+/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    tokens.push({
      type: 'paragraph',
      lines: paragraphLines,
    })
  }

  return tokens
}

function FormattedAnswer({ text }: FormattedAnswerProps) {
  const tokens = parseAnswerTokens(text)
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <div className="space-y-4">
      {tokens.map((token, index) => {
        if (token.type === 'space') {
          return <div key={index} className="h-1" />
        }

        if (token.type === 'paragraph') {
          return (
            <p key={index} className="leading-7">
              {renderInlineMarkdown(token.lines.join(' '), isDark ? 'dark' : 'light')}
            </p>
          )
        }

        if (token.type === 'list') {
          return (
            <ul key={index} className="space-y-2 pl-5">
              {token.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="list-disc leading-7">
                  {renderInlineMarkdown(item, isDark ? 'dark' : 'light')}
                </li>
              ))}
            </ul>
          )
        }

        if (token.type === 'code') {
          return (
            <div
              key={index}
              className={`overflow-hidden rounded-2xl border ${
                isDark
                  ? 'border-white/10 bg-slate-950 text-slate-100'
                  : 'border-slate-200 bg-slate-950 text-slate-100'
              }`}
            >
              {token.language && (
                <div
                  className={`border-b px-4 py-2 text-xs uppercase tracking-[0.18em] ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-400'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  {token.language}
                </div>
              )}

              <pre className="overflow-x-auto px-4 py-4 text-sm leading-6">
                <code>{token.code}</code>
              </pre>
            </div>
          )
        }

        if (token.type === 'table') {
          const [headRow, ...bodyRows] = token.rows

          return (
            <div
              key={index}
              className={`overflow-x-auto rounded-2xl border ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <table className="w-full min-w-max border-collapse text-left text-sm">
                <thead className={isDark ? 'bg-white/10' : 'bg-slate-100'}>
                  <tr>
                    {headRow.map((cell, cellIndex) => (
                      <th
                        key={`${cell}-${cellIndex}`}
                        className={`border-b px-4 py-3 font-semibold ${
                          isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                      >
                        {renderInlineMarkdown(cell, isDark ? 'dark' : 'light')}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {bodyRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={
                        isDark
                          ? 'odd:bg-white/[0.03] even:bg-transparent'
                          : 'odd:bg-white even:bg-slate-50'
                      }
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${cell}-${cellIndex}`}
                          className={`border-b px-4 py-3 align-top ${
                            isDark ? 'border-white/10' : 'border-slate-200'
                          }`}
                        >
                          {renderInlineMarkdown(cell, isDark ? 'dark' : 'light')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

type ConfirmLeaveModalProps = {
  theme: ThemeMode
  title: string
  description: string
  stayLabel: string
  goLabel: string
  siteTitle: string
  onStay: () => void
  onGo: () => void
}

function ConfirmLeaveModal({
  theme,
  title,
  description,
  stayLabel,
  goLabel,
  siteTitle,
  onStay,
  onGo,
}: ConfirmLeaveModalProps) {
  const isDark = theme === 'dark'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Close confirmation modal"
        onClick={onStay}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <div
        className={`relative z-[101] w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? 'border-white/10 bg-slate-950 text-white'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div
          className={`inline-flex rounded-2xl px-3 py-1 text-xs font-semibold ${
            isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {siteTitle}
        </div>

        <h3 className="mt-4 text-2xl font-semibold">{title}</h3>

        <p
          className={`mt-4 leading-7 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStay}
            className={`rounded-2xl border px-5 py-3 text-sm font-medium transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {stayLabel}
          </button>

          <button
            type="button"
            onClick={onGo}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              isDark
                ? 'bg-white text-slate-950 hover:bg-slate-100'
                : 'bg-slate-950 text-white hover:bg-slate-800'
            }`}
          >
            {goLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

type SiteHeaderProps = {
  interfaceLanguage: Language
  theme: ThemeMode
  onToggleTheme: () => void
  text: Dictionary
  onInterfaceLanguageChange?: (language: Language) => void
}

function SiteHeader({
  interfaceLanguage,
  theme,
  onToggleTheme,
  text,
  onInterfaceLanguageChange,
}: SiteHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  function handleHomeClick() {
    const isMarathonPage = location.pathname.startsWith('/marathon')

    if (isMarathonPage) {
      setIsConfirmOpen(true)
      return
    }

    navigate('/')
  }

  function handleConfirmGoHome() {
    setIsConfirmOpen(false)
    navigate('/')
  }

  function handleCloseConfirm() {
    setIsConfirmOpen(false)
  }

  return (
    <>
      <header
        className={`grid grid-cols-1 items-center gap-4 rounded-3xl border px-5 py-4 sm:grid-cols-[1fr_auto_1fr] ${
          isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-center sm:justify-start">
          <span
            className={`rounded-full px-3 py-1 text-xs sm:text-sm ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {text.madeByLabel} Andrey Zakharov
          </span>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={handleHomeClick}
            className="cursor-pointer text-xl font-semibold tracking-[0.18em] transition hover:opacity-80 sm:text-2xl"
          >
            {text.siteTitle}
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 sm:justify-end">
          {onInterfaceLanguageChange && (
            <div
              className={`inline-flex rounded-2xl border p-1 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onInterfaceLanguageChange('ru')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  interfaceLanguage === 'ru'
                    ? isDark
                      ? 'bg-white text-slate-950'
                      : 'bg-slate-950 text-white'
                    : isDark
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {text.languageRu}
              </button>
              <button
                type="button"
                onClick={() => onInterfaceLanguageChange('en')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  interfaceLanguage === 'en'
                    ? isDark
                      ? 'bg-white text-slate-950'
                      : 'bg-slate-950 text-white'
                    : isDark
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {text.languageEn}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className={`inline-flex items-center justify-center rounded-2xl border px-3 py-2 leading-none transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
            aria-label={theme === 'dark' ? text.themeLight : text.themeDark}
            title={theme === 'dark' ? text.themeLight : text.themeDark}
          >
            <span
              className={`theme-toggle-track border ${
                isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-200'
              }`}
              data-theme={theme}
            >
              <span
                className={`theme-toggle-thumb ${
                  isDark ? 'bg-white' : 'bg-slate-950'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {isConfirmOpen && (
        <ConfirmLeaveModal
          theme={theme}
          title={text.confirmLeaveTitle}
          description={text.confirmLeaveText}
          stayLabel={text.confirmLeaveStay}
          goLabel={text.confirmLeaveGo}
          siteTitle={text.siteTitle}
          onStay={handleCloseConfirm}
          onGo={handleConfirmGoHome}
        />
      )}
    </>
  )
}

type LanguageChoiceCardProps = {
  title: string
  languageCode: 'RU' | 'EN'
  stats: LanguageStats
  text: Dictionary
  theme: ThemeMode
  onClick: () => void
}

function LanguageChoiceCard({
  title,
  languageCode,
  stats,
  text,
  theme,
  onClick,
}: LanguageChoiceCardProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-3xl border p-5 text-left transition hover:translate-y-[-2px] ${
        isDark
          ? 'border-white/10 bg-black/10 text-white hover:bg-white/10'
          : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className={`text-xs uppercase tracking-[0.24em] ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {languageCode}
          </div>
          <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label={text.totalQuestions} value={stats.questions} theme={theme} />
        <MiniStat label={text.totalAnswers} value={stats.answers} theme={theme} />
        <MiniStat label={text.totalHeadings} value={stats.headings} theme={theme} />
      </div>
    </button>
  )
}

type MiniStatProps = {
  label: string
  value: number
  theme: ThemeMode
}

function MiniStat({ label, value, theme }: MiniStatProps) {
  const isDark = theme === 'dark'

  return (
    <div
      className={`flex min-h-[104px] flex-col items-center justify-center rounded-2xl p-3 text-center ${
        isDark ? 'bg-white/5 text-slate-200' : 'bg-white text-slate-900'
      }`}
    >
      <div
        className={`flex min-h-[32px] items-center justify-center text-center text-xs leading-4 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {label}
      </div>

      <div className="mt-3 text-center text-xl font-semibold leading-none">
        {value}
      </div>
    </div>
  )
}

type MenuCardProps = {
  theme: ThemeMode
  title: string
  description: string
  cta: string
  to: string
}

function MenuCard({
  theme,
  title,
  description,
  cta,
  to,
}: MenuCardProps) {
  const isDark = theme === 'dark'

  return (
    <Link
      to={to}
      className={`group cursor-pointer rounded-3xl border p-6 shadow-sm transition hover:translate-y-[-2px] hover:shadow-lg ${
        isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className={`mt-3 leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {description}
          </p>
        </div>

        <div className="inline-flex items-center text-sm font-semibold">
          {cta}
          <span className="ml-2 transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  )
}

export default App