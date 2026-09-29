"use client";

interface ProductTabsProps {
  activeTab: "all" | "bundle";
  onTabChange: (tab: "all" | "bundle") => void;
  allCount?: number;
  bundleCount?: number;
}

const ProductTabs = ({
  activeTab,
  onTabChange,
  allCount,
  bundleCount,
}: ProductTabsProps) => {
  return (
    <div className="mb-4 border-b border-slate-200">
      <div className="flex items-center gap-6">
        {/* All */}
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>All</span>

          {typeof allCount === "number" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {allCount}
            </span>
          )}

          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>

        {/* Bundling Item */}
        <button
          type="button"
          onClick={() => onTabChange("bundle")}
          className={`relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === "bundle"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Bundling Item</span>

          {typeof bundleCount === "number" && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                activeTab === "bundle"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {bundleCount}
            </span>
          )}

          {activeTab === "bundle" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductTabs;