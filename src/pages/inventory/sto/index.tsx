'use client';

import { useState } from "react";
import StockTakeForm from "./form-sto";
import StockTakeList from "./list-sto";

export default function Page() {
  const [refreshSignal, setRefreshSignal] = useState(0);

  const refresh = () => setRefreshSignal(prev => prev + 1);

  return (
    <div className="p-4 max-w-md mx-auto">
      <StockTakeForm onSave={refresh} />
      <StockTakeList refreshSignal={refreshSignal} />
    </div>
  );
}
