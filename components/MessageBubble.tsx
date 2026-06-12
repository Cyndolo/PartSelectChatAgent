import type { ChatMessage, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

type MessageBubbleProps = {
  message: ChatMessage;
  onViewInstallationGuide: (product: Product) => void;
  onCheckCompatibility: (product: Product) => void;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function MessageBubble({
  message,
  onViewInstallationGuide,
  onCheckCompatibility
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const response = message.response;

  if (isUser) {
    return (
      <div className="flex justify-end animate-[fadeIn_0.25s_ease-out]">
        <div className="max-w-[92%] rounded-[24px] bg-blue-700 px-4 py-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-50">
            Customer
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-white">{message.content}</p>
        </div>
      </div>
    );
  }

  const isTroubleshooting = response?.intent === "troubleshooting";
  const visibleSections =
    response?.sections
      ?.map((section) => ({
        ...section,
        title: safeText(section.title),
        items: section.items.map(safeText).filter(Boolean)
      }))
      .filter((section) => section.title && section.items.length > 0) ?? [];

  return (
    <div className="flex justify-start animate-[fadeIn_0.25s_ease-out]">
      <div
        className="glass max-w-[92%] rounded-[28px] px-4 py-4 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">
            PartSelect
          </span>
          {response?.groundingStatus && response.groundingStatus === "verified_live" && (
            <GroundingBadge status={response.groundingStatus} />
          )}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{message.content}</p>

        {response && (
          <div className="mt-4 space-y-4">
            {isTroubleshooting && visibleSections.length > 0 && (
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">Repair workflow</p>
                  <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800">
                    Guided steps
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {visibleSections.map((section) => (
                    <div key={section.title} className="rounded-2xl border border-blue-100 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
                        {section.title}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {section.items.map((item) => (
                          <li key={item} className="flex gap-2 text-sm text-slate-700">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                            <span className="leading-6">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isTroubleshooting && response.steps && response.steps.length > 0 && (
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Installation guide
                </p>
                <ol className="mt-3 space-y-2">
                  {response.steps.map((step, index) => (
                    <li key={`${step}-${index}`} className="flex gap-3 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <span className="leading-6">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {response.products && response.products.length > 0 && (
              <div className="grid gap-3">
                {response.products.map((product) => (
                  <ProductCard
                    key={product.partNumber}
                    product={product}
                    onViewInstallationGuide={onViewInstallationGuide}
                    onCheckCompatibility={onCheckCompatibility}
                    responseIntent={response.intent}
                    compatibilityStatus={
                      response.compatibility?.partNumber === product.partNumber
                        ? response.compatibility.isCompatible
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GroundingBadge({ status }: { status: NonNullable<ChatMessage["response"]>["groundingStatus"] }) {
  const label =
    status === "verified_live"
      ? "Verified from PartSelect"
      : "Searching PartSelect...";

  const classes =
    status === "verified_live"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-blue-50 text-blue-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}>{label}</span>
  );
}
