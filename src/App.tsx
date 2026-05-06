import { useEffect, useMemo, useRef, useState } from 'react'

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

const EMPTY_FILES: string[] = []

function buildContentUrl(file: string) {
  const encodedPath = file
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${import.meta.env.BASE_URL}content/${encodedPath}`
}

export default function App() {
  const [data, setData] = useState<ContentIndex | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedFileContent, setSelectedFileContent] = useState('')
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

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
    if (!selectedFile) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedFile])

  const files = useMemo(() => data?.files ?? EMPTY_FILES, [data])

  const ruFiles = useMemo(
    () => files.filter((file) => file.startsWith('RU/')),
    [files]
  )

  const enFiles = useMemo(
    () => files.filter((file) => file.startsWith('EN/')),
    [files]
  )

  function closeModal() {
    requestIdRef.current += 1
    setSelectedFile(null)
    setSelectedFileContent('')
    setFileError(null)
    setIsLoadingFile(false)
  }

  async function openFile(file: string) {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setSelectedFile(file)
    setSelectedFileContent('')
    setFileError(null)
    setIsLoadingFile(true)

    try {
      const res = await fetch(buildContentUrl(file))

      if (!res.ok) {
        throw new Error(`Failed to load file: ${res.status}`)
      }

      const text = await res.text()

      if (requestIdRef.current !== requestId) {
        return
      }

      setSelectedFileContent(text)
    } catch {
      if (requestIdRef.current !== requestId) {
        return
      }

      setFileError('Не удалось загрузить содержимое файла.')
      setSelectedFileContent('')
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingFile(false)
      }
    }
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-4xl font-bold tracking-tight">IT Interview</h1>
          <p className="mt-4 text-lg text-slate-600">
            Сайт подтягивает markdown-контент из репозитория IT-Interview-Question-Bank.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Синхронизация базы</h2>

            {!data ? (
              <p className="mt-4 text-slate-600">Не удалось загрузить индекс контента.</p>
            ) : (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-500">Всего markdown-файлов</div>
                    <div className="mt-2 text-3xl font-bold">
                      {data.stats.totalMarkdownFiles}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-500">RU</div>
                    <div className="mt-2 text-3xl font-bold">
                      {data.stats.byLanguage.RU}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-500">EN</div>
                    <div className="mt-2 text-3xl font-bold">
                      {data.stats.byLanguage.EN}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-500">Questions only</div>
                    <div className="mt-2 text-3xl font-bold">
                      {data.stats.byType.questions_only}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-500">Questions with answers</div>
                    <div className="mt-2 text-3xl font-bold">
                      {data.stats.byType.questions_with_answers}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-4">
                    <div className="text-sm text-slate-500">
                      Table of contents + complete banks
                    </div>
                    <div className="mt-2 text-3xl font-bold">
                      {data.stats.byType.table_of_contents +
                        data.stats.byType.complete_question_bank}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Время последней генерации:{' '}
                    {new Date(data.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  <section>
                    <h3 className="text-xl font-semibold">RU markdown files</h3>
                    <ul className="mt-4 max-h-[500px] space-y-2 overflow-auto rounded-xl bg-slate-100 p-4 text-sm">
                      {ruFiles.map((file) => (
                        <li key={file}>
                          <button
                            type="button"
                            onClick={() => void openFile(file)}
                            className="w-full rounded-lg px-3 py-2 text-left text-slate-800 transition hover:bg-slate-200 hover:text-slate-950"
                          >
                            {file}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold">EN markdown files</h3>
                    <ul className="mt-4 max-h-[500px] space-y-2 overflow-auto rounded-xl bg-slate-100 p-4 text-sm">
                      {enFiles.map((file) => (
                        <li key={file}>
                          <button
                            type="button"
                            onClick={() => void openFile(file)}
                            className="w-full rounded-lg px-3 py-2 text-left text-slate-800 transition hover:bg-slate-200 hover:text-slate-950"
                          >
                            {file}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {selectedFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold">{selectedFile}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Содержимое markdown-файла
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="ml-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Закрыть
              </button>
            </div>

            <div className="overflow-auto px-6 py-5">
              {isLoadingFile ? (
                <p className="text-slate-600">Загрузка файла...</p>
              ) : fileError ? (
                <p className="text-red-600">{fileError}</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words rounded-xl bg-slate-100 p-4 text-sm leading-6 text-slate-900">
                  {selectedFileContent}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}