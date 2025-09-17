export interface Customer {
    ID: number;
    customer_code: string;
    customer_name: string;
    cust_addr1 : string;
    cust_addr2? : string;
    cust_city : string;
    cust_area? : string;
    cust_country? : string;
    cust_phone? : string;
    cust_email? : string;
}