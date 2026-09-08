import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package } from "lucide-react";

type TopOutboundItem = {
  item_code: string;
  item_name: string;
  quantity: number;
};

interface Props {
  items: TopOutboundItem[];
  loading: boolean;
}

export default function TopOutboundItems({
  items,
  loading,
}: Props) {
  const maxQty =
    items.length > 0
      ? Math.max(...items.map((item) => item.quantity))
      : 0;

  return (
    <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm h-full">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Top 5 Outbound Items
        </CardTitle>

        <p className="text-xs text-slate-500 mt-0.5">
          Highest outbound quantity
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {loading ? (
          <div className="h-[220px] flex items-center justify-center">
            <Loader2 className="animate-spin w-5 h-5 text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-center">
            <Package className="w-8 h-8 text-slate-300 mb-2" />

            <p className="text-sm text-slate-500">
              No outbound data
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const percentage =
                maxQty > 0
                  ? (item.quantity / maxQty) * 100
                  : 0;

              return (
                <div key={item.item_code}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-5">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p
                          className="text-xs font-semibold text-slate-700 truncate"
                          title={item.item_code}
                        >
                          {item.item_code}
                        </p>

                        <p
                          className="text-[11px] text-slate-400 truncate"
                          title={item.item_name}
                        >
                          {item.item_name}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-900 ml-2 whitespace-nowrap">
                      {item.quantity.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}