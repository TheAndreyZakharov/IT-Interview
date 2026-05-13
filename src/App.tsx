import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
  unavailableBadge: string
  unavailableAnswersMode: string
  themeLight: string
  themeDark: string
  menuTitle: string
  menuSubtitle: string
  backHome: string
  back: string
  modeLabel: string
  placeholderSection: string
  backToModes: string
  noAnswerYet: string
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
  leaveMarathonConfirm: string
  confirmLeaveTitle: string
  confirmLeaveText: string
  confirmLeaveStay: string
  confirmLeaveGo: string
  menuCards: {
    allMarathon: { title: string; text: string; cta: string }
    customMarathon: { title: string; text: string; cta: string }
    questionsOverview: { title: string; text: string; cta: string }
    answersOverview: { title: string; text: string; cta: string }
  }
  placeholderTitle: string
  placeholderText: string
  comingSoon: string
}

type LanguageStats = {
  questions: number
  answers: number
  headings: number
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
    madeByLabel: 'Сделано',
    heroTitle: 'Подготовка к IT-собеседованиям в одном месте',
    heroSubtitle:
      'На этом сайте собрана большая база вопросов для подготовки к IT-собеседованиям на русском и английском языках. Здесь будут марафоны, оглавления, режимы просмотра вопросов и ответов и удобная навигация по темам.',
    languageTitle: 'Выберите язык базы',
    languageHint:
      'Язык интерфейса определяется автоматически по языку браузера, но его можно переключить вручную. Для начала работы просто нажмите на одну из карточек языка ниже.',
    languageRu: 'Русский',
    languageEn: 'English',
    chooseLanguageCardHint:
      'После нажатия на карточку выбранный язык сохранится и будет использоваться на следующих страницах.',
    updatedAt: 'Последнее обновление базы',
    totalQuestions: 'Количество вопросов',
    totalAnswers: 'Количество ответов',
    totalHeadings: 'Количество тем и подтем',
    selectedLanguage: 'Выбранный язык базы',
    unavailableBadge: 'Недоступно',
    unavailableAnswersMode: 'Для английской базы этот режим пока недоступен',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    menuTitle: 'Выберите режим',
    menuSubtitle: 'Ниже доступны основные сценарии работы с базой.',
    backHome: 'На главный экран',
    back: 'Назад',
    modeLabel: 'Режимы работы',
    placeholderSection: 'Раздел',
    backToModes: 'Назад к выбору режима',
    noAnswerYet: 'Для этого вопроса ответ пока не добавлен.',
    revealAnswer: 'Показать ответ / подсказку / пояснение',
    hideAnswer: 'Скрыть ответ',
    previous: 'Назад',
    next: 'Вперёд',
    questionOf: 'Вопрос',
    topic: 'Тема',
    subtopic: 'Подтема',
    subtopics: 'Подтемы',
    randomModeHint: 'Вопросы перемешаны в случайном порядке.',
    chooseTopicsTitle: 'Выберите темы и подтемы',
    chooseTopicsHint:
      'Отметьте нужные пункты, затем начните марафон только по выбранным разделам.',
    selectAll: 'Выбрать всё',
    clearAll: 'Очистить всё',
    startMarathon: 'Начать марафон',
    selectedItems: 'Выбрано пунктов',
    nothingSelected: 'Сначала выберите хотя бы один пункт.',
    noQuestionsForSelection: 'По текущему выбору вопросы не найдены.',
    closeSelection: 'Закрыть выбор',
    shuffleAgain: 'Перемешать заново',
    leaveMarathonConfirm:
      'Вы сейчас находитесь в марафоне. Если перейти на главный экран, текущий прогресс на этой странице сбросится. Перейти?',
    confirmLeaveTitle: 'Выйти на главный экран?',
    confirmLeaveText:
      'Вы сейчас находитесь в марафоне. Если перейти на главный экран, текущий прогресс на этой странице сбросится.',
    confirmLeaveStay: 'Остаться',
    confirmLeaveGo: 'Перейти',
    menuCards: {
      allMarathon: {
        title: 'Марафон по всем вопросам',
        text: 'Случайный проход по всем вопросам выбранной базы.',
        cta: 'Открыть',
      },
      customMarathon: {
        title: 'Марафон по выбранным темам',
        text: 'Сначала выбираете темы и подтемы, затем проходите карточки только по ним.',
        cta: 'Открыть',
      },
      questionsOverview: {
        title: 'Оглавление и вопросы',
        text: 'Просмотр структуры тем и файлов только с вопросами.',
        cta: 'Открыть',
      },
      answersOverview: {
        title: 'Оглавление, вопросы и ответы',
        text: 'Просмотр структуры тем и файлов с вопросами и ответами.',
        cta: 'Открыть',
      },
    },
    placeholderTitle: 'Раздел в разработке',
    placeholderText:
      'Эта страница пока пустая. На следующем этапе сюда добавим реальный функционал.',
    comingSoon: 'Скоро здесь появится содержимое выбранного режима.',
  },
  en: {
    siteTitle: 'IT INTERVIEW',
    madeByLabel: 'Made by',
    heroTitle: 'Prepare for IT interviews in one place',
    heroSubtitle:
      'This site contains a large question bank for IT interview preparation in Russian and English. It will include marathons, table-of-contents views, question and answer modes, and convenient topic navigation.',
    languageTitle: 'Choose the question bank language',
    languageHint:
      'The interface language is selected automatically from the browser language, but you can switch it manually. To begin, just click one of the language cards below.',
    languageRu: 'Russian',
    languageEn: 'English',
    chooseLanguageCardHint:
      'After clicking a card, the selected language will be saved and used on the next pages.',
    updatedAt: 'Question bank last updated',
    totalQuestions: 'Question count',
    totalAnswers: 'Answer count',
    totalHeadings: 'Topics and subtopics',
    selectedLanguage: 'Selected question bank language',
    unavailableBadge: 'Unavailable',
    unavailableAnswersMode: 'This mode is not available for the English bank yet',
    themeLight: 'Light',
    themeDark: 'Dark',
    menuTitle: 'Choose a mode',
    menuSubtitle: 'Below are the main ways to work with the question bank.',
    backHome: 'Back to home',
    back: 'Back',
    modeLabel: 'Modes',
    placeholderSection: 'Section',
    backToModes: 'Back to mode selection',
    noAnswerYet: 'There is no answer for this question yet.',
    revealAnswer: 'Show answer / hint / explanation',
    hideAnswer: 'Hide answer',
    previous: 'Previous',
    next: 'Next',
    questionOf: 'Question',
    topic: 'Topic',
    subtopic: 'Subtopic',
    subtopics: 'Subtopics',
    randomModeHint: 'Questions are shuffled randomly.',
    chooseTopicsTitle: 'Choose topics and subtopics',
    chooseTopicsHint:
      'Select the needed items and start the marathon only for them.',
    selectAll: 'Select all',
    clearAll: 'Clear all',
    startMarathon: 'Start marathon',
    selectedItems: 'Selected items',
    nothingSelected: 'Select at least one item first.',
    noQuestionsForSelection: 'No questions found for the current selection.',
    closeSelection: 'Close selection',
    shuffleAgain: 'Shuffle again',
    leaveMarathonConfirm:
      'You are currently in a marathon. If you go to the home page, the current progress on this page will be reset. Continue?',
    confirmLeaveTitle: 'Go to home page?',
    confirmLeaveText:
      'You are currently in a marathon. If you go to the home page, the current progress on this page will be reset.',
    confirmLeaveStay: 'Stay',
    confirmLeaveGo: 'Go',
    menuCards: {
      allMarathon: {
        title: 'Marathon for all questions',
        text: 'A random run through all questions in the selected bank.',
        cta: 'Open',
      },
      customMarathon: {
        title: 'Marathon by selected topics',
        text: 'First choose topics and subtopics, then go through cards only for them.',
        cta: 'Open',
      },
      questionsOverview: {
        title: 'Contents and questions',
        text: 'Browse the topic structure and question-only files.',
        cta: 'Open',
      },
      answersOverview: {
        title: 'Contents, questions, and answers',
        text: 'Browse the topic structure and files with questions and answers.',
        cta: 'Open',
      },
    },
    placeholderTitle: 'Section under construction',
    placeholderText:
      'This page is empty for now. On the next step we will add the actual functionality here.',
    comingSoon: 'The selected mode content will appear here soon.',
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

function getStatsForBankLanguage(data: ContentIndex | null, bankLanguage: Language): LanguageStats {
  if (!data) {
    return EMPTY_LANGUAGE_STATS
  }

  return bankLanguage === 'ru'
    ? data.contentStats.byLanguage.RU
    : data.contentStats.byLanguage.EN
}

function getContentForBankLanguage(data: ContentData | null, bankLanguage: Language): LanguageContentData {
  if (!data) {
    return EMPTY_LANGUAGE_CONTENT
  }

  return bankLanguage === 'ru'
    ? data.byLanguage.RU
    : data.byLanguage.EN
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

function getQuestionSubtopicTrail(
  question: ParsedQuestion,
  tocFlat: TocFlatNode[]
) {
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
    document.title =
      interfaceLanguage === 'ru'
        ? 'IT INTERVIEW — подготовка к собеседованиям'
        : 'IT INTERVIEW — interview preparation'
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
      <Route
        path="/menu"
        element={
          <MenuPage
            {...sharedProps}
            onInterfaceLanguageChange={setInterfaceLanguage}
          />
        }
      />
      <Route
        path="/marathon/all"
        element={
          <AllMarathonPage
            key={`all-${bankLanguage}`}
            {...sharedProps}
            contentData={contentData}
            onInterfaceLanguageChange={setInterfaceLanguage}
          />
        }
      />
      <Route
        path="/marathon/custom"
        element={
          <CustomMarathonPage
            key={`custom-${bankLanguage}`}
            {...sharedProps}
            contentData={contentData}
            onInterfaceLanguageChange={setInterfaceLanguage}
          />
        }
      />
      <Route
        path="/overview/questions"
        element={
          <PlaceholderPage
            {...sharedProps}
            title={text.menuCards.questionsOverview.title}
            onInterfaceLanguageChange={setInterfaceLanguage}
          />
        }
      />
      <Route
        path="/overview/answers"
        element={
          <PlaceholderPage
            {...sharedProps}
            title={text.menuCards.answersOverview.title}
            onInterfaceLanguageChange={setInterfaceLanguage}
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
    <main className={`page-fade min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
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

              <p className={`mt-6 text-lg leading-8 sm:text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {text.heroSubtitle}
              </p>
            </div>

            <div className={`mx-auto mt-10 max-w-4xl rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{text.languageTitle}</h2>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {text.languageHint}
                </p>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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

              <div className={`mt-6 rounded-2xl border p-4 text-center ${isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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

type MenuPageProps = SharedPageProps & {
  onInterfaceLanguageChange: (language: Language) => void
}

function MenuPage({
  interfaceLanguage,
  bankLanguage,
  theme,
  onToggleTheme,
  text,
  onInterfaceLanguageChange,
}: MenuPageProps) {
  const location = useLocation()
  const isDark = theme === 'dark'
  const isAnswersModeUnavailable = bankLanguage === 'en'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <main className={`page-fade min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        <div className="mt-10 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-sm uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {text.modeLabel}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{text.menuTitle}</h1>
              <p className={`mt-3 max-w-3xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {text.menuSubtitle}
              </p>
            </div>

            <Link
              to="/"
              className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {text.backHome}
            </Link>
          </div>

          <div className={`inline-flex w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
            <span className="font-medium">{text.selectedLanguage}:</span>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {bankLanguage === 'ru' ? text.languageRu : text.languageEn}
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <MenuCard
            theme={theme}
            title={text.menuCards.allMarathon.title}
            description={text.menuCards.allMarathon.text}
            cta={text.menuCards.allMarathon.cta}
            to="/marathon/all"
          />
          <MenuCard
            theme={theme}
            title={text.menuCards.customMarathon.title}
            description={text.menuCards.customMarathon.text}
            cta={text.menuCards.customMarathon.cta}
            to="/marathon/custom"
          />
          <MenuCard
            theme={theme}
            title={text.menuCards.questionsOverview.title}
            description={text.menuCards.questionsOverview.text}
            cta={text.menuCards.questionsOverview.cta}
            to="/overview/questions"
          />
          <MenuCard
            theme={theme}
            title={text.menuCards.answersOverview.title}
            description={text.menuCards.answersOverview.text}
            cta={text.menuCards.answersOverview.cta}
            to="/overview/answers"
            disabled={isAnswersModeUnavailable}
            disabledLabel={text.unavailableBadge}
            disabledOverlayText={text.unavailableAnswersMode}
          />
        </div>
      </div>
    </main>
  )
}

type AllMarathonPageProps = SharedPageProps & {
  contentData: ContentData | null
  onInterfaceLanguageChange: (language: Language) => void
}

function AllMarathonPage({
  interfaceLanguage,
  bankLanguage,
  theme,
  onToggleTheme,
  text,
  contentData,
  onInterfaceLanguageChange,
}: AllMarathonPageProps) {
  const content = useMemo(() => getContentForBankLanguage(contentData, bankLanguage), [contentData, bankLanguage])
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerOpen, setIsAnswerOpen] = useState(false)
  const isDark = theme === 'dark'

  const questions = useMemo(() => {
    void shuffleSeed
    return shuffleArray(content.questions)
  }, [content.questions, shuffleSeed])

  const currentQuestion = questions[currentIndex] ?? null

  return (
    <main className={`page-fade min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        <QuestionMarathonLayout
          theme={theme}
          text={text}
          title={text.menuCards.allMarathon.title}
          subtitle={text.randomModeHint}
          questions={questions}
          tocFlat={content.tocFlat}
          currentIndex={currentIndex}
          currentQuestion={currentQuestion}
          isAnswerOpen={isAnswerOpen}
          onToggleAnswer={() => setIsAnswerOpen((prev) => !prev)}
          onPrev={() => {
            setCurrentIndex((prev) => Math.max(prev - 1, 0))
            setIsAnswerOpen(false)
          }}
          onNext={() => {
            setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
            setIsAnswerOpen(false)
          }}
          extraAction={
            <button
              type="button"
              onClick={() => {
                setShuffleSeed((prev) => prev + 1)
                setCurrentIndex(0)
                setIsAnswerOpen(false)
              }}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              {text.shuffleAgain}
            </button>
          }
        />
      </div>
    </main>
  )
}

type CustomMarathonPageProps = SharedPageProps & {
  contentData: ContentData | null
  onInterfaceLanguageChange: (language: Language) => void
}

function CustomMarathonPage({
  interfaceLanguage,
  bankLanguage,
  theme,
  onToggleTheme,
  text,
  contentData,
  onInterfaceLanguageChange,
}: CustomMarathonPageProps) {
  const content = useMemo(() => getContentForBankLanguage(contentData, bankLanguage), [contentData, bankLanguage])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(true)
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnswerOpen, setIsAnswerOpen] = useState(false)
  const isDark = theme === 'dark'

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

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
    if (selectedIds.length === 0) {
      return
    }

    const filtered = content.questions.filter((question) =>
      question.headingIds.some((id) => selectedSet.has(id)) ||
      selectedSet.has(question.topicId) ||
      selectedSet.has(question.subtopicId)
    )

    setQuestions(shuffleArray(filtered))
    setCurrentIndex(0)
    setIsAnswerOpen(false)
    setIsSelectorOpen(false)
  }

  const currentQuestion = questions[currentIndex] ?? null

  return (
    <main className={`page-fade min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        {isSelectorOpen ? (
          <TopicSelectorPanel
            theme={theme}
            text={text}
            tocTree={content.tocTree}
            tocFlat={content.tocFlat}
            selectedIds={selectedIds}
            onToggleNode={toggleNode}
            onSelectAll={() => setSelectedIds(content.tocFlat.map((item) => item.id))}
            onClearAll={() => setSelectedIds([])}
            onStart={startSelectedMarathon}
          />
        ) : (
          <QuestionMarathonLayout
            theme={theme}
            text={text}
            title={text.menuCards.customMarathon.title}
            subtitle={`${text.selectedItems}: ${selectedIds.length}`}
            questions={questions}
            tocFlat={content.tocFlat}
            currentIndex={currentIndex}
            currentQuestion={currentQuestion}
            isAnswerOpen={isAnswerOpen}
            onToggleAnswer={() => setIsAnswerOpen((prev) => !prev)}
            onPrev={() => {
              setCurrentIndex((prev) => Math.max(prev - 1, 0))
              setIsAnswerOpen(false)
            }}
            onNext={() => {
              setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
              setIsAnswerOpen(false)
            }}
            extraAction={
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
              >
                {text.closeSelection}
              </button>
            }
          />
        )}
      </div>
    </main>
  )
}

type TopicSelectorPanelProps = {
  theme: ThemeMode
  text: Dictionary
  tocTree: TocNode[]
  tocFlat: TocFlatNode[]
  selectedIds: string[]
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
  onToggleNode,
  onSelectAll,
  onClearAll,
  onStart,
}: TopicSelectorPanelProps) {
  const isDark = theme === 'dark'
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const flatMap = useMemo(() => new Map(tocFlat.map((item) => [item.id, item])), [tocFlat])

  return (
    <section className="mt-10">
      <div className={`rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{text.chooseTopicsTitle}</h1>
            <p className={`mt-3 max-w-3xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {text.chooseTopicsHint}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/menu"
              className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              {text.backToModes}
            </Link>
            <button
              type="button"
              onClick={onSelectAll}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              {text.selectAll}
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              {text.clearAll}
            </button>
            <button
              type="button"
              onClick={onStart}
              className={`rounded-2xl px-5 py-2 text-sm font-semibold transition ${isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              {text.startMarathon}
            </button>
          </div>
        </div>

        <div className={`mt-6 inline-flex rounded-2xl border px-4 py-2 text-sm ${isDark ? 'border-white/10 bg-black/10 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          {text.selectedItems}: {selectedIds.length}
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
          <p className={`mt-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {text.nothingSelected}
          </p>
        )}
      </div>
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
    <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selectedSet.has(node.id)}
          onChange={() => onToggleNode(flatNode)}
          className="mt-1 h-4 w-4"
        />
        <span className={`leading-7 ${node.level === 2 ? 'text-lg font-semibold' : node.level === 3 ? 'font-medium' : ''}`}>
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
  const subtopicTrail = currentQuestion ? getQuestionSubtopicTrail(currentQuestion, tocFlat) : []

  return (
    <section className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className={`mt-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {extraAction}
          <Link
            to="/menu"
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {text.backToModes}
          </Link>
        </div>
      </div>

      {questions.length === 0 || !currentQuestion ? (
        <div className={`mt-10 rounded-3xl border p-8 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
            {text.noQuestionsForSelection}
          </p>
        </div>
      ) : (
        <div className={`mt-10 rounded-3xl border p-6 shadow-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className={`inline-flex rounded-2xl border px-4 py-2 text-sm ${isDark ? 'border-white/10 bg-black/10 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
              {text.questionOf} {currentIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="mt-6 space-y-4">
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

          <div className={`mt-6 rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'}`}>
            <h2 className="text-2xl font-semibold leading-9">{currentQuestion.text}</h2>

            <button
              type="button"
              onClick={onToggleAnswer}
              className={`mt-6 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              <span className={`transition ${isAnswerOpen ? 'rotate-180' : ''}`}>⌄</span>
              {isAnswerOpen ? text.hideAnswer : text.revealAnswer}
            </button>

            {isAnswerOpen && (
              <div className={`mt-6 rounded-2xl border p-5 leading-7 ${isDark ? 'border-white/10 bg-slate-900/70 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}>
                {currentQuestion.hasAnswer ? (
                  <FormattedAnswer text={currentQuestion.answer} />
                ) : (
                  <p>{text.noAnswerYet}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentIndex === 0}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              {text.previous}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex >= questions.length - 1}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
            >
              {text.next}
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

function FormattedAnswer({ text }: FormattedAnswerProps) {
  const lines = text.split('\n')

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} className="h-2" />
        }

        if (trimmed.startsWith('- ')) {
          return (
            <div key={index} className="flex gap-2">
              <span>•</span>
              <span>{trimmed.replace(/^- /, '')}</span>
            </div>
          )
        }

        return <p key={index}>{trimmed}</p>
      })}
    </div>
  )
}

type PlaceholderPageProps = SharedPageProps & {
  title: string
  onInterfaceLanguageChange: (language: Language) => void
}

function PlaceholderPage({
  interfaceLanguage,
  theme,
  onToggleTheme,
  text,
  title,
  onInterfaceLanguageChange,
}: PlaceholderPageProps) {
  const isDark = theme === 'dark'

  return (
    <main className={`page-fade min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SiteHeader
          interfaceLanguage={interfaceLanguage}
          theme={theme}
          onToggleTheme={onToggleTheme}
          text={text}
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        <div className="mt-10 flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {text.placeholderSection}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          </div>

          <Link
            to="/menu"
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${isDark ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {text.backToModes}
          </Link>
        </div>

        <div className={`mt-10 rounded-3xl border p-8 shadow-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className={`mt-4 leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {text.placeholderText}
          </p>
          <p className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {text.comingSoon}
          </p>
        </div>
      </div>
    </main>
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
    const isMarathonPage = location.pathname.startsWith('/marathon/')

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
      <header className={`grid grid-cols-1 items-center gap-4 rounded-3xl border px-5 py-4 sm:grid-cols-[1fr_auto_1fr] ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-center sm:justify-start">
          <span className={`rounded-full px-3 py-1 text-xs sm:text-sm ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
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
            <div className={`inline-flex rounded-2xl border p-1 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
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
            className={`rounded-2xl border px-3 py-2 transition ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
            aria-label={theme === 'dark' ? text.themeLight : text.themeDark}
            title={theme === 'dark' ? text.themeLight : text.themeDark}
          >
            <span className={`theme-toggle-track border ${isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-200'}`} data-theme={theme}>
              <span className={`theme-toggle-thumb ${isDark ? 'bg-white' : 'bg-slate-950'}`} />
            </span>
          </button>
        </div>
      </header>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <button
            type="button"
            aria-label="Close confirmation modal"
            onClick={handleCloseConfirm}
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
                isDark
                  ? 'bg-white/10 text-slate-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {text.siteTitle}
            </div>

            <h3 className="mt-4 text-2xl font-semibold">
              {text.confirmLeaveTitle}
            </h3>

            <p className={`mt-4 leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {text.confirmLeaveText}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                className={`rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {text.confirmLeaveStay}
              </button>

              <button
                type="button"
                onClick={handleConfirmGoHome}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  isDark
                    ? 'bg-white text-slate-950 hover:bg-slate-100'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {text.confirmLeaveGo}
              </button>
            </div>
          </div>
        </div>
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
      className={`cursor-pointer rounded-3xl border p-5 text-left transition hover:translate-y-[-2px] ${isDark ? 'border-white/10 bg-black/10 text-white hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`text-xs uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
    <div className={`rounded-2xl p-3 ${isDark ? 'bg-white/5 text-slate-200' : 'bg-white text-slate-900'}`}>
      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  )
}

type MenuCardProps = {
  theme: ThemeMode
  title: string
  description: string
  cta: string
  to: string
  disabled?: boolean
  disabledLabel?: string
  disabledOverlayText?: string
}

function MenuCard({
  theme,
  title,
  description,
  cta,
  to,
  disabled = false,
  disabledLabel,
  disabledOverlayText,
}: MenuCardProps) {
  const isDark = theme === 'dark'

  if (disabled) {
    return (
      <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/45 backdrop-blur-[1px]" />

        <div className="absolute left-4 top-4 z-20">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
            {disabledLabel}
          </span>
        </div>

        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className={`rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-lg ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            {disabledOverlayText}
          </div>
        </div>

        <div className="flex h-full flex-col justify-between gap-6 opacity-55">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className={`mt-3 leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {description}
            </p>
          </div>

          <div className="inline-flex items-center text-sm font-semibold">
            {cta}
            <span className="ml-2">→</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link
      to={to}
      className={`group cursor-pointer rounded-3xl border p-6 shadow-sm transition hover:translate-y-[-2px] hover:shadow-lg ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}
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