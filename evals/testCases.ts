export type EvalCase = {
  query: string;
  expectedIntent:
    | "part_lookup"
    | "compatibility_check"
    | "installation_guide"
    | "troubleshooting"
    | "cart_action"
    | "context_update"
    | "out_of_scope"
    | "clarification_needed";
  memory?: {
    currentModelNumber?: string | null;
    selectedPart?: string | null;
  };
};

export const testCases: EvalCase[] = [
  { query: "How can I install PS11752778?", expectedIntent: "installation_guide" },
  { query: "How can I install PS112?", expectedIntent: "clarification_needed" },
  { query: "How do I install this?", expectedIntent: "clarification_needed" },
  { query: "How do I install this part?", expectedIntent: "clarification_needed" },
  { query: "Is PS112 compatible with WDT780SAEM1?", expectedIntent: "clarification_needed" },
  { query: "Is PS11752778 compatible with WDT780SAEM1?", expectedIntent: "compatibility_check" },
  { query: "Is PS11752778 compatible with my model?", expectedIntent: "clarification_needed" },
  { query: "Is PS11752778 compatible with it?", expectedIntent: "compatibility_check", memory: { currentModelNumber: "WDT780SAEM1" } },
  { query: "Will this gasket fit my dishwasher model WDT780SAEM1?", expectedIntent: "clarification_needed" },
  { query: "The ice maker on my Whirlpool fridge is not working.", expectedIntent: "troubleshooting" },
  { query: "My dishwasher is leaking near the door.", expectedIntent: "troubleshooting" },
  { query: "Can you help me find a dishwasher door gasket?", expectedIntent: "part_lookup" },
  { query: "I need a refrigerator water inlet valve.", expectedIntent: "part_lookup" },
  { query: "Look up PS11752778 for me.", expectedIntent: "part_lookup" },
  { query: "Add PS11752778 to my cart.", expectedIntent: "cart_action" },
  { query: "Remove PS11752778 from my cart.", expectedIntent: "cart_action" },
  { query: "Put the lower spray arm in my cart.", expectedIntent: "cart_action" },
  { query: "What is the weather tomorrow?", expectedIntent: "out_of_scope" },
  { query: "Can you fix my oven heating issue?", expectedIntent: "out_of_scope" },
  { query: "I have model WDT780SAEM1", expectedIntent: "context_update" },
  { query: "My model number is WDT780SAEM1.", expectedIntent: "context_update" },
  { query: "Model: WDT780SAEM1", expectedIntent: "context_update" },
  { query: "I have a Whirlpool WDT780SAEM1 dishwasher.", expectedIntent: "context_update" },
  { query: "Is this compatible?", expectedIntent: "clarification_needed" },
  { query: "How do I replace it?", expectedIntent: "clarification_needed" },
  { query: "My dishwasher is making a loud noise and not cleaning well.", expectedIntent: "troubleshooting" },
  { query: "Show me installation steps for the lower spray arm.", expectedIntent: "clarification_needed" },
  { query: "Will PS11752778 fit my WDT780SAEM1 model?", expectedIntent: "compatibility_check" },
  { query: "Find part number PS11752778", expectedIntent: "part_lookup" },
  { query: "I need help with a broken rack wheel.", expectedIntent: "part_lookup" }
];
