type SuggestedPromptsProps = {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
};

export function SuggestedPrompts({ prompts, onPromptClick }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPromptClick(prompt)}
          className="rounded-full border border-blue-200 bg-white px-4 py-2 text-left text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
