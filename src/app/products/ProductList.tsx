"use client";

import { useState } from "react";

type Product = {
  id: number;
  title: string;
};

export default function ProductList({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <ul className="space-y-2">
      {products.map((p) => (
        <li
          key={p.id}
          className={`p-2 border rounded cursor-pointer ${
            selected === p.id ? "bg-blue-100" : ""
          }`}
          onClick={() => setSelected(p.id)}
        >
          {p.title}
        </li>
      ))}
    </ul>
  );
}
