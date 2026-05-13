import { useEffect, useMemo, useState } from 'react'
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
  files: string[]
}

type Language = 'ru' | 'en'
type ThemeMode = 'light' | 'dark'

type Dictionary = {
  siteTitle: string
  authorLabel: string
  heroTitle: string
  heroSubtitle: string
  languageTitle: string
  languageHint: string
  languageRu: string
  languageEn: string
  chooseLanguageCardHint: string
  updatedAt: string
  totalFiles: string
  ruFiles: string
  enFiles: string
  questionsOnly: string
  questionsWithAnswers: string
  tableAndComplete: string
  selectedLanguage: string
  unavailableBadge: string
  unavailableAnswersMode: string
  infoTooltip: string
  themeLight: string
  themeDark: string
  menuTitle: string
  menuSubtitle: string
  backHome: string
  modeLabel: string
  placeholderSection: string
  backToModes: string
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

const EMPTY_FILES: string[] = []

const TEXT: Record<Language, Dictionary> = {
  ru: {
    siteTitle: 'IT INTERVIEW',
    authorLabel: 'Автор',
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
    totalFiles: 'Всего markdown-файлов',
    ruFiles: 'Файлы RU',
    enFiles: 'Файлы EN',
    questionsOnly: 'Файлы только с вопросами',
    questionsWithAnswers: 'Файлы с вопросами и ответами',
    tableAndComplete: 'Оглавления и полные банки',
    selectedLanguage: 'Выбранный язык базы',
    unavailableBadge: 'Недоступно',
    unavailableAnswersMode: 'Для английской базы этот режим пока недоступен',
    infoTooltip: 'Скоро появится',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    menuTitle: 'Выберите режим',
    menuSubtitle:
      'Ниже доступны основные сценарии работы с базой. Пока это стартовые страницы-заглушки, дальше сюда добавим реальный функционал.',
    backHome: 'На главный экран',
    modeLabel: 'Режимы работы',
    placeholderSection: 'Раздел',
    backToModes: 'Назад к выбору режима',
    menuCards: {
      allMarathon: {
        title: 'Марафон по всем вопросам',
        text: 'Последовательный режим прохождения всей базы вопросов.',
        cta: 'Открыть',
      },
      customMarathon: {
        title: 'Марафон по выбранным темам',
        text: 'Режим, в котором пользователь сможет выбрать конкретные темы.',
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
    authorLabel: 'Author',
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
    totalFiles: 'Total markdown files',
    ruFiles: 'RU files',
    enFiles: 'EN files',
    questionsOnly: 'Question-only files',
    questionsWithAnswers: 'Question and answer files',
    tableAndComplete: 'Tables of contents and complete banks',
    selectedLanguage: 'Selected question bank language',
    unavailableBadge: 'Unavailable',
    unavailableAnswersMode: 'This mode is not available for the English bank yet',
    infoTooltip: 'Coming soon',
    themeLight: 'Light',
    themeDark: 'Dark',
    menuTitle: 'Choose a mode',
    menuSubtitle:
      'Below are the main ways to work with the question bank. For now these are placeholder pages, and later we will add the real functionality.',
    backHome: 'Back to home',
    modeLabel: 'Modes',
    placeholderSection: 'Section',
    backToModes: 'Back to mode selection',
    menuCards: {
      allMarathon: {
        title: 'Marathon for all questions',
        text: 'A sequential mode for going through the entire question bank.',
        cta: 'Open',
      },
      customMarathon: {
        title: 'Marathon by selected topics',
        text: 'A mode where the user will be able to choose specific topics.',
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

function getStatsForBankLanguage(data: ContentIndex | null, files: string[], bankLanguage: Language) {
  if (!data) {
    return {
      total: 0,
      questionsOnly: 0,
      questionsWithAnswers: 0,
      tableAndComplete: 0,
    }
  }

  const langPrefix = bankLanguage === 'ru' ? 'RU/' : 'EN/'

  let questionsOnly = 0
  let questionsWithAnswers = 0
  let tableAndComplete = 0

  for (const file of files) {
    if (!file.startsWith(langPrefix)) {
      continue
    }

    if (file.includes('/Questions_By_Topic_')) {
      questionsOnly += 1
    } else if (file.includes('/Questions_with_AI_Answers_By_Topic_')) {
      questionsWithAnswers += 1
    } else if (file.includes('Table_of_Contents') || file.includes('Complete_Question_Bank')) {
      tableAndComplete += 1
    }
  }

  return {
    total: bankLanguage === 'ru' ? data.stats.byLanguage.RU : data.stats.byLanguage.EN,
    questionsOnly,
    questionsWithAnswers,
    tableAndComplete,
  }
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

  const text = TEXT[interfaceLanguage]
  const files = useMemo(() => data?.files ?? EMPTY_FILES, [data])

  const ruStats = useMemo(() => getStatsForBankLanguage(data, files, 'ru'), [data, files])
  const enStats = useMemo(() => getStatsForBankLanguage(data, files, 'en'), [data, files])

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
          <PlaceholderPage
            {...sharedProps}
            title={text.menuCards.allMarathon.title}
            onInterfaceLanguageChange={setInterfaceLanguage}
          />
        }
      />
      <Route
        path="/marathon/custom"
        element={
          <PlaceholderPage
            {...sharedProps}
            title={text.menuCards.customMarathon.title}
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
  ruStats: {
    total: number
    questionsOnly: number
    questionsWithAnswers: number
    tableAndComplete: number
  }
  enStats: {
    total: number
    questionsOnly: number
    questionsWithAnswers: number
    tableAndComplete: number
  }
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
              <p
                className={`text-sm uppercase tracking-[0.24em] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {text.siteTitle}
              </p>
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
                isDark
                  ? 'border-white/10 bg-white/5'
                  : 'border-slate-200 bg-white'
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
                  isDark
                    ? 'border-white/10 bg-black/10'
                    : 'border-slate-200 bg-slate-50'
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
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        <div className="mt-10 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className={`text-sm uppercase tracking-[0.24em] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {text.modeLabel}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{text.menuTitle}</h1>
              <p
                className={`mt-3 max-w-3xl ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {text.menuSubtitle}
              </p>
            </div>

            <Link
              to="/"
              className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {text.backHome}
            </Link>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-300'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
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
            infoTooltip={text.infoTooltip}
          />
          <MenuCard
            theme={theme}
            title={text.menuCards.customMarathon.title}
            description={text.menuCards.customMarathon.text}
            cta={text.menuCards.customMarathon.cta}
            to="/marathon/custom"
            infoTooltip={text.infoTooltip}
          />
          <MenuCard
            theme={theme}
            title={text.menuCards.questionsOverview.title}
            description={text.menuCards.questionsOverview.text}
            cta={text.menuCards.questionsOverview.cta}
            to="/overview/questions"
            infoTooltip={text.infoTooltip}
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
            infoTooltip={text.infoTooltip}
          />
        </div>
      </div>
    </main>
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
          onInterfaceLanguageChange={onInterfaceLanguageChange}
        />

        <div className="mt-10 flex items-center justify-between gap-4">
          <div>
            <p
              className={`text-sm uppercase tracking-[0.24em] ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {text.placeholderSection}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          </div>

          <Link
            to="/menu"
            className={`inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-medium transition ${
              isDark
                ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {text.backToModes}
          </Link>
        </div>

        <div
          className={`mt-10 rounded-3xl border p-8 shadow-sm ${
            isDark
              ? 'border-white/10 bg-white/5'
              : 'border-slate-200 bg-white'
          }`}
        >
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p
            className={`mt-4 leading-7 ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {text.placeholderText}
          </p>
          <p
            className={`mt-4 text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
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
  const isDark = theme === 'dark'

  return (
    <header
      className={`flex flex-col gap-4 rounded-3xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        isDark
          ? 'border-white/10 bg-white/5'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div>
        <div
          className={`text-xs uppercase tracking-[0.28em] ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {text.siteTitle}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-xl font-semibold">{text.siteTitle}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isDark
                ? 'bg-white/10 text-slate-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {text.authorLabel}: Andrey Zakharov
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onInterfaceLanguageChange && (
          <div
            className={`inline-flex rounded-2xl border p-1 ${
              isDark
                ? 'border-white/10 bg-white/5'
                : 'border-slate-200 bg-slate-50'
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
          className={`rounded-2xl border px-3 py-2 transition ${
            isDark
              ? 'border-white/10 bg-white/5 text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
          aria-label={theme === 'dark' ? text.themeLight : text.themeDark}
          title={theme === 'dark' ? text.themeLight : text.themeDark}
        >
          <span
            className={`theme-toggle-track border ${
              isDark
                ? 'border-white/10 bg-slate-800'
                : 'border-slate-200 bg-slate-200'
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
  )
}

type LanguageChoiceCardProps = {
  title: string
  languageCode: 'RU' | 'EN'
  stats: {
    total: number
    questionsOnly: number
    questionsWithAnswers: number
    tableAndComplete: number
  }
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
      className={`rounded-3xl border p-5 text-left transition hover:translate-y-[-2px] ${
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

        <span
          className={`rounded-full px-3 py-1 text-xs ${
            isDark
              ? 'bg-white/10 text-slate-300'
              : 'bg-white text-slate-600'
          }`}
        >
          {text.totalFiles}: {stats.total}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniStat label={text.questionsOnly} value={stats.questionsOnly} theme={theme} />
        <MiniStat label={text.questionsWithAnswers} value={stats.questionsWithAnswers} theme={theme} />
        <MiniStat label={text.tableAndComplete} value={stats.tableAndComplete} theme={theme} />
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
      className={`rounded-2xl p-3 ${
        isDark
          ? 'bg-white/5 text-slate-200'
          : 'bg-white text-slate-900'
      }`}
    >
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
  infoTooltip: string
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
  infoTooltip,
}: MenuCardProps) {
  const isDark = theme === 'dark'

  if (disabled) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm ${
          isDark
            ? 'border-white/10 bg-white/5'
            : 'border-slate-200 bg-white'
        }`}
      >
        <InfoTooltip theme={theme} text={infoTooltip} />

        <div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/45 backdrop-blur-[1px]" />

        <div className="absolute left-4 top-4 z-20">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isDark
                ? 'bg-white text-slate-950'
                : 'bg-slate-950 text-white'
            }`}
          >
            {disabledLabel}
          </span>
        </div>

        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div
            className={`rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-lg ${
              isDark
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-900'
            }`}
          >
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
      className={`group relative rounded-3xl border p-6 shadow-sm transition hover:translate-y-[-2px] hover:shadow-lg ${
        isDark
          ? 'border-white/10 bg-white/5'
          : 'border-slate-200 bg-white'
      }`}
    >
      <InfoTooltip theme={theme} text={infoTooltip} />

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

type InfoTooltipProps = {
  theme: ThemeMode
  text: string
}

function InfoTooltip({ theme, text }: InfoTooltipProps) {
  const isDark = theme === 'dark'

  return (
    <div className="absolute right-4 top-4 z-30">
      <div className="group/info relative">
        <button
          type="button"
          tabIndex={0}
          onClick={(event) => event.preventDefault()}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
            isDark
              ? 'border-white/15 bg-slate-900/85 text-white'
              : 'border-slate-300 bg-white/95 text-slate-700'
          }`}
          aria-label={text}
          title={text}
        >
          i
        </button>

        <div
          className={`pointer-events-none absolute right-0 top-10 w-44 rounded-xl px-3 py-2 text-xs leading-5 opacity-0 shadow-lg transition duration-200 group-hover/info:opacity-100 group-focus-within/info:opacity-100 ${
            isDark
              ? 'bg-slate-900 text-slate-100'
              : 'bg-slate-950 text-white'
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

export default App