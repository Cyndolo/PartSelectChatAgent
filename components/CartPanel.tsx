import type { Product } from "@/lib/types";

type CartPanelProps = {
  recentlyViewed: Product[];
  onQuickHelp: (message: string) => void;
};

export function CartPanel({
  recentlyViewed,
  onQuickHelp
}: CartPanelProps) {
  return (
    <aside className="glass rounded-[32px] p-5 shadow-[0_14px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
            Customer Help
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Customer hub</h2>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
              Recently Viewed
            </h3>
          </div>
          <div className="mt-3 space-y-3">
            {recentlyViewed.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">No recently viewed parts</p>
                <p className="mt-1">Parts you view during this session will appear here.</p>
              </div>
            ) : (
              recentlyViewed.map((item) => (
                <div key={item.partNumber} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{item.partNumber}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700">
            Quick Help
          </h3>
          <div className="mt-3 grid gap-2">
            {[
              ["Find a Part", "Can you help me find a dishwasher door gasket?"],
              ["Check Compatibility", "Is PS11752778 compatible with my WDT780SAEM1 model?"],
              ["Installation Help", "How can I install part number PS11752778?"],
              ["Troubleshoot an Issue", "The ice maker on my Whirlpool fridge is not working. How can I fix it?"]
            ].map(([label, prompt]) => (
              <button
                key={label}
                type="button"
                onClick={() => onQuickHelp(prompt)}
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span>{label}</span>
                <span className="text-xs font-medium text-slate-500">Open</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
