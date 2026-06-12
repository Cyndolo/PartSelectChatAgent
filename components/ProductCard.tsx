import type { AgentIntent, Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  onViewInstallationGuide?: (product: Product) => void;
  onCheckCompatibility?: (product: Product) => void;
  compatibilityStatus?: boolean;
  responseIntent?: AgentIntent;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function ProductCard({
  product,
  onViewInstallationGuide,
  onCheckCompatibility,
  compatibilityStatus,
  responseIntent
}: ProductCardProps) {
  const showInstallationAction = responseIntent !== "installation_guide";
  const showCompatibilityAction = responseIntent !== "compatibility_check";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(37,99,235,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{product.name}</h3>
          <p className="mt-1 font-mono text-xs text-slate-500">{product.partNumber}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            product.availability === "In stock"
              ? "bg-emerald-50 text-emerald-700"
              : product.availability === "Limited stock"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {product.availability}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {product.brand}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {product.applianceType}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            product.availability === "In stock"
              ? "bg-emerald-50 text-emerald-700"
              : product.availability === "Limited stock"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          Stock {product.availability}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Part Number</dt>
          <dd className="mt-1 font-mono font-medium text-slate-900">{product.partNumber}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Price</dt>
          <dd className="mt-1 font-semibold text-slate-900">{currency(product.price)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {product.applianceType}
        </span>
        {compatibilityStatus !== undefined && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              compatibilityStatus
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {compatibilityStatus ? "Compatible" : "Not compatible"}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Common symptoms</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.symptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
            >
              {symptom}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <a
          href={product.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          View Product
        </a>
        {showInstallationAction && (
          <button
            type="button"
            onClick={() => onViewInstallationGuide?.(product)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
          >
            Installation Guide
          </button>
        )}
        {showCompatibilityAction && (
          <button
            type="button"
            onClick={() => onCheckCompatibility?.(product)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
          >
            Check Fit
          </button>
        )}
      </div>
    </article>
  );
}
