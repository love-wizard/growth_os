import { CoachInput } from "@/components/ai-coach/CoachInput";
import { CoachResponse } from "@/components/ai-coach/CoachResponse";
import { ExpertReviewedLabel } from "@/components/ai-coach/ExpertReviewedLabel";
import { QuickQuestions } from "@/components/ai-coach/QuickQuestions";
import { WeeklyPlanDraftConfirm } from "@/components/ai-coach/WeeklyPlanDraftConfirm";
import { Card } from "@/components/ui/card";

export default function AICoachPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-5 py-8">
      <section>
        <p className="text-sm text-muted-foreground">AI 教练</p>
        <h1 className="mt-2 text-3xl font-semibold">AI 成长教练</h1>
      </section>
      <QuickQuestions />
      <Card className="p-4">
        <CoachInput />
      </Card>
      <CoachResponse
        response={{
          title: "把练琴变成一个更小的开始",
          summary: "先判断是临时情绪、任务过重，还是兴趣进入低谷。",
          analysis: [
            "如果孩子最近还能主动接触音乐，多半不是兴趣消失，而是启动成本太高。",
            "本周目标先放在保持兴趣，练习时间可以缩短，但要保留稳定节奏。"
          ],
          actions: [
            "今天只弹一首最熟悉的曲子，控制在8分钟内。",
            "让孩子选开始方式，例如先听一遍、先弹右手或先给家人表演。",
            "结束后记录一句孩子的感受，下次周计划按真实反应调整。"
          ],
          followUpQuestion: "最近一次不想练琴，是在开始前还是练到一半时出现？"
        }}
      />
      <ExpertReviewedLabel reviewed />
      <div>
        <WeeklyPlanDraftConfirm disabled />
      </div>
    </main>
  );
}
