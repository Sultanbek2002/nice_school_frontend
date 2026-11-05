"use client";
import { useEffect, useState } from "react";
import { GO_API_URL } from "@/utils/apiData";
interface Result {
  id: number;
  name: string;
  class_name: string;
  answers: string[][];
  score: number;
}
interface Test {
  id: number;
  title: string;
  subject: string;
  question_count: number;
  key: string[][];
  published_at: string;
  results: Result[];
}
export default function PaperResults() {
  const [tests, setTests] = useState<Test[]>([]),
    [testID, setTestID] = useState(""),
    [className, setClassName] = useState(""),
    [subject, setSubject] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`${GO_API_URL}/api/paper-results`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Не удалось загрузить результаты");
        return r.json();
      })
      .then((t) => {
        if (active) setTests(t);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const subjects = Array.from(new Set(tests.map((t) => t.subject))).sort(),
    classes = Array.from(
      new Set(tests.flatMap((t) => t.results.map((r) => r.class_name))),
    ).sort();
  const visible = tests.filter(
    (t) =>
      (!testID || String(t.id) === testID) &&
      (!subject || t.subject === subject),
  );
  const rows = visible.flatMap((t) =>
    t.results
      .filter((r) => !className || r.class_name === className)
      .map((r) => ({ ...r, test: t })),
  );
  const groupClasses = Array.from(
    new Set(rows.map((r) => r.class_name)),
  ).sort();
  return (
    <section className="mt-10 rounded-2xl border border-black/10 bg-white p-4 text-slate-800 shadow-sm sm:p-6">
      <h2 className="text-2xl font-bold">Результаты бумажных тестов</h2>
      <p className="mt-2 text-sm text-slate-500">
        Опубликованы после подтверждения суперадминистратором. 1 балл — за
        точное совпадение ответа с ключом.
      </p>
      {loading ? (
        <p className="py-6">Загрузка результатов…</p>
      ) : error ? (
        <p role="alert" className="py-6 text-red-600">
          {error}
        </p>
      ) : !tests.length ? (
        <p className="py-6 text-slate-500">
          Подтверждённых результатов пока нет.
        </p>
      ) : (
        <>
          <div className="my-5 grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              Предмет
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setTestID("");
                }}
              >
                <option value="">Все предметы</option>
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Работа
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={testID}
                onChange={(e) => setTestID(e.target.value)}
              >
                <option value="">Все работы</option>
                {tests
                  .filter((t) => !subject || t.subject === subject)
                  .map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm">
              Класс
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              >
                <option value="">Вся школа</option>
                {classes.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm">Проверенных работ учеников</p>
              <strong className="text-2xl">{rows.length}</strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm">Средний процент выполнения</p>
              <strong className="text-2xl">
                {rows.length
                  ? (
                      rows.reduce(
                        (sum, r) =>
                          sum + (r.score / r.test.question_count) * 100,
                        0,
                      ) / rows.length
                    ).toFixed(1)
                  : "0"}
                %
              </strong>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm">Классов в выборке</p>
              <strong className="text-2xl">{groupClasses.length}</strong>
            </div>
          </div>
          <p className="my-3 text-xs text-slate-500">
            Общий процент — среднее по проверенным работам, а не рейтинг
            сложности тестов. Один ученик может участвовать в нескольких
            работах.
          </p>
          <div className="my-5 grid gap-2 sm:grid-cols-3">
            {groupClasses.map((c) => {
              const group = rows.filter((r) => r.class_name === c);
              return (
                <button
                  key={c}
                  onClick={() => setClassName(c)}
                  className="rounded-xl border border-slate-200 p-3 text-left"
                >
                  <strong>{c}</strong>
                  <p className="text-sm">
                    {group.length} работ ·{" "}
                    {(
                      group.reduce(
                        (n, r) => n + (r.score / r.test.question_count) * 100,
                        0,
                      ) / group.length
                    ).toFixed(1)}
                    %
                  </p>
                </button>
              );
            })}
          </div>
          <div className="space-y-5">
            {visible.map((t) => {
              const results = t.results.filter(
                (r) => !className || r.class_name === className,
              );
              if (!results.length) return null;
              return (
                <article key={t.id}>
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  <p className="mb-3 text-sm text-slate-500">
                    {t.subject} · {t.question_count} вопросов · Подтверждено{" "}
                    {new Date(t.published_at).toLocaleDateString("ru-RU")}
                  </p>
                  <div className="space-y-2">
                    {results.map((r) => (
                      <details
                        key={r.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <summary className="cursor-pointer font-medium">
                          {r.name} · {r.class_name} — {r.score}/
                          {t.question_count} ·{" "}
                          {((r.score / t.question_count) * 100).toFixed(1)}%
                        </summary>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {r.answers.map((a, q) => (
                            <div
                              key={q}
                              className={`rounded-lg p-2 text-sm ${a.join("") === t.key[q].join("") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                            >
                              {q + 1}. Ответ: {a.join(", ") || "Нет ответа"} ·
                              Верно: {t.key[q].join(", ")}
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          {!rows.length && (
            <p className="py-5 text-slate-500">
              Для выбранных фильтров результатов нет.
            </p>
          )}
        </>
      )}
    </section>
  );
}
