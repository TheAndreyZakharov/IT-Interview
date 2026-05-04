import { useEffect, useState } from 'react'

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

export default function App() {
  const [data, setData] = useState<ContentIndex | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content-index.json`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData(null))
  }, [])

  const files = data?.files ?? []

  return (
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
                  <div className="mt-2 text-3xl font-bold">{data.stats.totalMarkdownFiles}</div>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <div className="text-sm text-slate-500">RU</div>
                  <div className="mt-2 text-3xl font-bold">{data.stats.byLanguage.RU}</div>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <div className="text-sm text-slate-500">EN</div>
                  <div className="mt-2 text-3xl font-bold">{data.stats.byLanguage.EN}</div>
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
                  <div className="text-sm text-slate-500">Table of contents + complete banks</div>
                  <div className="mt-2 text-3xl font-bold">
                    {data.stats.byType.table_of_contents + data.stats.byType.complete_question_bank}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Время последней генерации: {new Date(data.generatedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <section>
                  <h3 className="text-xl font-semibold">RU markdown files</h3>
                  <ul className="mt-4 max-h-[500px] list-disc space-y-2 overflow-auto rounded-xl bg-slate-100 p-4 pl-8 text-sm">
                    {files
                      .filter((file) => file.startsWith('RU/'))
                      .map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold">EN markdown files</h3>
                  <ul className="mt-4 max-h-[500px] list-disc space-y-2 overflow-auto rounded-xl bg-slate-100 p-4 pl-8 text-sm">
                    {files
                      .filter((file) => file.startsWith('EN/'))
                      .map((file) => (
                        <li key={file}>{file}</li>
                      ))}
                  </ul>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}