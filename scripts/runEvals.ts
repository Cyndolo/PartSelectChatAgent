import { createConversationMemory } from "@/lib/agent/memory";
import { routeQuery } from "@/lib/agent/router";
import { testCases } from "@/evals/testCases";

type EvalSummary = {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
};

function runEvaluation(): EvalSummary {
  let passed = 0;

  for (const testCase of testCases) {
    const memory = {
      ...createConversationMemory(),
      ...testCase.memory
    };
    const routed = routeQuery(testCase.query, memory);
    const isCorrect = routed.intent === testCase.expectedIntent;
    if (isCorrect) passed += 1;

    console.log(
      JSON.stringify(
        {
          query: testCase.query,
          expectedIntent: testCase.expectedIntent,
          predictedIntent: routed.intent,
          selectedTool: routed.selectedTool,
          passed: isCorrect
        },
        null,
        2
      )
    );
  }

  const total = testCases.length;
  const failed = total - passed;
  const accuracy = total > 0 ? (passed / total) * 100 : 0;

  return {
    total,
    passed,
    failed,
    accuracy
  };
}

const summary = runEvaluation();

console.log(
  JSON.stringify(
    {
      totalCases: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      accuracy: `${summary.accuracy.toFixed(1)}%`
    },
    null,
    2
  )
);
