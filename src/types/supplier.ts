// export interface Supplier {
//     ID: number;
//     supplier_code: string;
//     supplier_name: string;
//     supp_addr1?: string;
//     supp_city?: string;
//     supp_country?: string;
//     supp_phone?: string;
//     supp_email?: string;
//     owner_code?: string;
// }

export interface Supplier {
  ID: number;
  owner_code: string;
  supplier_code: string;
  supplier_name: string;
  supp_addr1: string;
  supp_addr2: string;
  supp_city: string;
  supp_area: string;
  supp_country: string;
  supp_phone: string;
  supp_email: string;
}