/* eslint-disable @typescript-eslint/no-explicit-any */
// app/products/page.tsx
import ProductList from "./ProductList";

export default async function ProductsPage() {
  // Fetch data di server
  const res = await fetch("https://fakestoreapi.com/products");
  const data = await res.json();
  console.log("Response datane:", data);
  const products: { id: number; title: string }[] = data.map((item: any) => ({
    id: item.id,
    title: item.title,
  }));


  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Product List</h1>
      {/* kirim data ke client component */}
      <ProductList products={products} />
    </div>
  );
}
