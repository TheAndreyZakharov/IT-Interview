import { useEffect, useState } from 'react'

export default function App() {
  const [files, setFiles] = useState<string[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content-index.json`)
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => setFiles([]))
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">IT Interview</h1>
        <p className="mt-4 text-lg text-slate-600">
          База вопросов и ответов для подготовки к IT-собеседованиям.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Синхронизация базы</h2>
          <p className="mt-3 text-slate-700">
            Ниже список файлов, которые сайт получил из репозитория базы во время сборки:
          </p>

          <div className="mt-6 rounded-xl bg-slate-100 p-4">
            {files.length === 0 ? (
              <p className="text-slate-600">Файлы пока не найдены.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-6 text-sm text-slate-800">
                {files.slice(0, 50).map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}