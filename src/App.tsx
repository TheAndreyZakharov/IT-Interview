export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">IT Interview</h1>
        <p className="mt-4 text-lg text-slate-600">
          База вопросов и ответов для подготовки к IT-собеседованиям.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Сайт в разработке</h2>
          <p className="mt-3 text-slate-700">
            Скоро здесь появятся:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>переключение RU / EN</li>
            <li>просмотр только вопросов или вопросов с ответами</li>
            <li>поиск по темам</li>
            <li>удобная навигация по разделам</li>
          </ul>
        </div>
      </div>
    </main>
  )
}