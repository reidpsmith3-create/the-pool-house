import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { pickGroups, pickOptions, pools } from "@/db/schema";
import { getIsAdmin } from "@/lib/auth-helpers";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
};

function getQuestionTypeLabel(questionType: string) {
  const labels: Record<string, string> = {
    multiple_choice_single: "Multiple Choice · Select One",
    multiple_choice_multiple: "Multiple Choice · Select Multiple",
    blank: "Blank Answer",
    rank: "Rank Choices",
  };

  return labels[questionType] ?? questionType;
}

export default async function PredictionsSetupPage({
  params,
  searchParams,
}: PageProps) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  const { slug } = await params;
  const { created } = await searchParams;

  const poolRows = await db
    .select()
    .from(pools)
    .where(eq(pools.slug, slug))
    .limit(1);

  const pool = poolRows[0];
  if (!pool) redirect("/admin");

  const questions = await db
    .select()
    .from(pickGroups)
    .where(eq(pickGroups.poolId, pool.id))
    .orderBy(asc(pickGroups.sortOrder), asc(pickGroups.createdAt));

  const choices = await db
    .select()
    .from(pickOptions)
    .where(eq(pickOptions.poolId, pool.id))
    .orderBy(asc(pickOptions.createdAt));

  const choicesByQuestion = new Map<string, typeof choices>();

  for (const choice of choices) {
    if (!choice.groupId) continue;

    const existing = choicesByQuestion.get(choice.groupId) ?? [];
    existing.push(choice);
    choicesByQuestion.set(choice.groupId, existing);
  }

  return (
    <main className="min-h-screen bg-[#0d0f12] px-5 py-8 text-zinc-50">
      <div className="mx-auto max-w-md">
        <p className="text-xs font-black uppercase text-amber-300">
          Admin · Predictions Setup
        </p>

        <h1 className="mt-3 text-3xl font-black">Predictions Setup</h1>

        <p className="mt-2 text-sm text-zinc-400">{pool.title}</p>

        {created === "1" && (
          <div className="mt-5 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <p className="font-black">Prediction question added.</p>
          </div>
        )}

        <form
          action={`/api/admin/pools/${pool.slug}/predictions/questions/create`}
          method="post"
          className="mt-6 rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
        >
          <h2 className="text-lg font-black">Add Custom Question</h2>

          <label className="mt-4 block">
            <span className="text-sm font-bold">Question</span>
            <input
              name="question"
              required
              placeholder="Who will win the World Series?"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">Question Type</span>
            <select
              name="questionType"
              defaultValue="multiple_choice_single"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            >
              <option value="multiple_choice_single">
                Multiple Choice · Select One
              </option>
              <option value="multiple_choice_multiple">
                Multiple Choice · Select Multiple
              </option>
              <option value="blank">Blank Answer · User Types Answer</option>
              <option value="rank">Rank Choices</option>
            </select>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">Answer Choices</span>
            <textarea
              name="choices"
              rows={8}
              placeholder={"Dodgers\nYankees\nBraves\nCubs"}
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <p className="mt-2 text-xs text-zinc-500">
            For multiple choice or rank questions, enter one choice per line. For
            blank answer questions, leave choices empty.
          </p>

          <label className="mt-4 block">
            <span className="text-sm font-bold">
              Max Selections / Ranking Spots
            </span>
            <input
              name="maxPicks"
              type="number"
              min="1"
              defaultValue="1"
              className="mt-2 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-50 outline-none"
            />
          </label>

          <p className="mt-2 text-xs text-zinc-500">
            Use 1 for select-one or blank answer. For select-multiple, this is
            the max number of answers. For rank, this is how many choices the
            user ranks.
          </p>

          <button className="mt-5 w-full rounded-2xl bg-amber-300 px-4 py-4 text-sm font-black uppercase tracking-wide text-zinc-950">
            Add Question
          </button>
        </form>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-black">Current Questions</h2>

          {questions.length === 0 ? (
            <div className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5">
              <p className="font-black">No prediction questions yet.</p>
              <p className="mt-2 text-sm text-zinc-400">
                Add your first custom question above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => {
                const questionChoices = choicesByQuestion.get(question.id) ?? [];

                return (
                  <div
                    key={question.id}
                    className="rounded-3xl border border-zinc-700/70 bg-gradient-to-b from-[#202226] to-[#15161a] p-5"
                  >
                    <p className="text-xs font-black uppercase text-zinc-500">
                      Question {index + 1}
                    </p>

                    <h3 className="mt-2 text-lg font-black">{question.name}</h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-amber-300 px-3 py-1 text-[11px] font-black uppercase text-zinc-950">
                        {getQuestionTypeLabel(question.questionType)}
                      </span>

                      <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-black uppercase text-zinc-400">
                        Max {question.maxPicks}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {question.questionType === "blank" ? (
                        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400">
                          Users will type their own answer.
                        </div>
                      ) : questionChoices.length === 0 ? (
                        <p className="text-sm text-zinc-400">
                          No answer choices.
                        </p>
                      ) : (
                        questionChoices.map((choice) => (
                          <div
                            key={choice.id}
                            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200"
                          >
                            {choice.displayName ?? choice.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Link
          href={`/admin/pools/${pool.slug}`}
          className="mt-5 block rounded-2xl bg-zinc-100 px-4 py-4 text-center text-sm font-black uppercase tracking-wide text-zinc-950"
        >
          Back to Pool Admin
        </Link>
      </div>
    </main>
  );
}