// data/dummy.ts

import { Product } from "@/types/example/index";

export const products: Product[] = [
    {
        id: "P001",
        name: "Aqua Galon",
        uoms: [
            { uom: "pcs", conversion: 1, is_base: true },
            { uom: "dus", conversion: 6, is_base: false },
            { uom: "pallet", conversion: 120, is_base: false },
        ],
    },
    {
        id: "P002",
        name: "Indomie Goreng",
        uoms: [
            { uom: "pcs", conversion: 1, is_base: true },
            { uom: "dus", conversion: 40, is_base: false },
            { uom: "pallet", conversion: 1000, is_base: false },
        ],
    },
];
