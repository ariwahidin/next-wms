export interface Transporter {
    ID: number;
    transporter_code: string;
    transporter_name: string;
    transporter_address: string;
    city: string;
    phone?: string;
    email?: string;
    pic?: string;
}