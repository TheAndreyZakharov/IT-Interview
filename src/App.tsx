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

type Dictionary = {
  siteTitle: string
  heroTitle: string
  heroSubtitle: string
  heroButton: string
  languageTitle: string
  languageHint: string
  languageRu: string
  languageEn: string
  startHint: string
  updatedAt: string
  totalFiles: string
  ruFiles: string
  enFiles: string
  questionsOnly: string
  questionsWithAnswers: string
  tableAndComplete: string
  menuTitle: string
  menuSubtitle: string
  backHome: string
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
    siteTitle: 'IT Interview',
    heroTitle: 'Подготовка к IT-собеседованиям в одном месте',
    heroSubtitle:
      'На этом сайте собрана большая база вопросов для подготовки к IT-собеседованиям на русском и английском языках. Здесь будут марафоны, оглавления, режимы просмотра вопросов и ответов и удобная навигация по темам.',
    heroButton: 'Начать',
    languageTitle: 'Выберите язык',
    languageHint:
      'Язык подбирается автоматически по языку браузера, но его можно переключить вручную.',
    languageRu: 'Русский',
    languageEn: 'English',
    startHint: 'Выберите язык и переходите к режиму работы с базой.',
    updatedAt: 'Последнее обновление базы',
    totalFiles: 'Всего markdown-файлов',
    ruFiles: 'Файлы RU',
    enFiles: 'Файлы EN',
    questionsOnly: 'Файлы только с вопросами',
    questionsWithAnswers: 'Файлы с вопросами и ответами',
    tableAndComplete: 'Оглавления и полные банки',
    menuTitle: 'Выберите режим',
    menuSubtitle:
      'Ниже будут доступны разные способы работы с базой вопросов. Пока это стартовые страницы-заглушки.',
    backHome: 'На главный экран',
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
    siteTitle: 'IT Interview',
    heroTitle: 'Prepare for IT interviews in one place',
    heroSubtitle:
      'This site contains a large question bank for IT interview preparation in Russian and English. It will include marathons, table-of-contents views, question and answer modes, and convenient topic navigation.',
    heroButton: 'Start',
    languageTitle: 'Choose language',
    languageHint:
      'The language is selected automatically from the browser language, but you can switch it manually.',
    languageRu: 'Russian',
    languageEn: 'English',
    startHint: 'Choose a language and continue to the working modes.',
    updatedAt: 'Question bank last updated',
    totalFiles: 'Total markdown files',
    ruFiles: 'RU files',
    enFiles: 'EN files',
    questionsOnly: 'Question-only files',
    questionsWithAnswers: 'Question and answer files',
    tableAndComplete: 'Tables of contents and complete banks',
    menuTitle: 'Choose a mode',
    menuSubtitle:
      'Different ways to work with the question bank will be available below. For now these are placeholder pages.',
    backHome: 'Back to home',
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

function formatDate(isoDate: string, language: Language) {
  return new Date(isoDate).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [data, setData] = useState<ContentIndex | null>(null)
  const [language, setLanguage] = useState<Language>(detectInitialLanguage())

  useEffect(() => {
    document.documentElement.lang = language
    document.title = language === 'ru' ? 'IT Interview — подготовка к собеседованиям' : 'IT Interview — interview preparation'
  }, [language])

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

  const text = TEXT[language]
  const files = useMemo(() => data?.files ?? EMPTY_FILES, [data])

  const statsForSelectedLanguage = useMemo(() => {
    if (!data) {
      return {
        total: 0,
        questionsOnly: 0,
        questionsWithAnswers: 0,
        tableAndComplete: 0,
      }
    }

    const langPrefix = language === 'ru' ? 'RU/' : 'EN/'

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
      total:
        language === 'ru' ? data.stats.byLanguage.RU : data.stats.byLanguage.EN,
      questionsOnly,
      questionsWithAnswers,
      tableAndComplete,
    }
  }, [data, files, language])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            language={language}
            onLanguageChange={setLanguage}
            text={text}
            data={data}
            statsForSelectedLanguage={statsForSelectedLanguage}
          />
        }
      />
      <Route
        path="/menu"
        element={
          <MenuPage
            language={language}
            text={text}
          />
        }
      />
      <Route
        path="/marathon/all"
        element={<PlaceholderPage language={language} text={text} title={text.menuCards.allMarathon.title} />}
      />
      <Route
        path="/marathon/custom"
        element={<PlaceholderPage language={language} text={text} title={text.menuCards.customMarathon.title} />}
      />
      <Route
        path="/overview/questions"
        element={<PlaceholderPage language={language} text={text} title={text.menuCards.questionsOverview.title} />}
      />
      <Route
        path="/overview/answers"
        element={<PlaceholderPage language={language} text={text} title={text.menuCards.answersOverview.title} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

type HomePageProps = {
  language: Language
  onLanguageChange: (language: Language) => void
  text: Dictionary
  data: ContentIndex | null
  statsForSelectedLanguage: {
    total: number
    questionsOnly: number
    questionsWithAnswers: number
    tableAndComplete: number
  }
}

function HomePage({
  language,
  onLanguageChange,
  text,
  data,
  statsForSelectedLanguage,
}: HomePageProps) {
  const navigate = useNavigate()

  return (
    <main className="page-fade min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              {text.siteTitle}
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              {text.heroTitle}
            </h1>
          </div>

          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => onLanguageChange('ru')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                language === 'ru'
                  ? 'bg-white text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {text.languageRu}
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                language === 'en'
                  ? 'bg-white text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {text.languageEn}
            </button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              {text.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-950 transition hover:translate-y-[-1px] hover:bg-slate-100"
              >
                {text.heroButton}
              </button>

              <p className="text-sm text-slate-400">
                {text.startHint}
              </p>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold">{text.languageTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {text.languageHint}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="text-sm text-slate-400">{text.updatedAt}</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {data ? formatDate(data.generatedAt, language) : '—'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="text-sm text-slate-400">{text.totalFiles}</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {statsForSelectedLanguage.total}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard label={text.questionsOnly} value={statsForSelectedLanguage.questionsOnly} />
            <StatCard label={text.questionsWithAnswers} value={statsForSelectedLanguage.questionsWithAnswers} />
            <StatCard label={text.tableAndComplete} value={statsForSelectedLanguage.tableAndComplete} />
            <StatCard
              label={language === 'ru' ? text.ruFiles : text.enFiles}
              value={statsForSelectedLanguage.total}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

type MenuPageProps = {
  language: Language
  text: Dictionary
}

function MenuPage({ language, text }: MenuPageProps) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <main className="page-fade min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              {language === 'ru' ? 'Режимы работы' : 'Modes'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{text.menuTitle}</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              {text.menuSubtitle}
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {text.backHome}
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <MenuCard
            title={text.menuCards.allMarathon.title}
            description={text.menuCards.allMarathon.text}
            cta={text.menuCards.allMarathon.cta}
            to="/marathon/all"
          />
          <MenuCard
            title={text.menuCards.customMarathon.title}
            description={text.menuCards.customMarathon.text}
            cta={text.menuCards.customMarathon.cta}
            to="/marathon/custom"
          />
          <MenuCard
            title={text.menuCards.questionsOverview.title}
            description={text.menuCards.questionsOverview.text}
            cta={text.menuCards.questionsOverview.cta}
            to="/overview/questions"
          />
          <MenuCard
            title={text.menuCards.answersOverview.title}
            description={text.menuCards.answersOverview.text}
            cta={text.menuCards.answersOverview.cta}
            to="/overview/answers"
          />
        </div>
      </div>
    </main>
  )
}

type MenuCardProps = {
  title: string
  description: string
  cta: string
  to: string
}

function MenuCard({ title, description, cta, to }: MenuCardProps) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:translate-y-[-2px] hover:shadow-lg"
    >
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-3 leading-7 text-slate-600">{description}</p>
        </div>

        <div className="inline-flex items-center text-sm font-semibold text-slate-900">
          {cta}
          <span className="ml-2 transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  )
}

type PlaceholderPageProps = {
  language: Language
  text: Dictionary
  title: string
}

function PlaceholderPage({ language, text, title }: PlaceholderPageProps) {
  return (
    <main className="page-fade min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              {language === 'ru' ? 'Раздел' : 'Section'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          </div>

          <Link
            to="/menu"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {language === 'ru' ? 'Назад к выбору режима' : 'Back to mode selection'}
          </Link>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">{text.placeholderTitle}</h2>
          <p className="mt-4 leading-7 text-slate-600">
            {text.placeholderText}
          </p>
          <p className="mt-4 text-sm text-slate-500">{text.comingSoon}</p>
        </div>
      </div>
    </main>
  )
}

type StatCardProps = {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-3 text-4xl font-semibold text-white">{value}</div>
    </div>
  )
}

export default App