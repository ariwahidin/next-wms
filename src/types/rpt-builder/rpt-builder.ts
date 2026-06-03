export interface Rpt2Column {
  id: number
  template_id: number
  sheet_id: number
  column_key: string
  display_name: string
  column_order: number
  excel_width: number
  excel_format: string // TEXT | NUMBER | DATE
  is_default_visible: boolean
  is_toggleable: boolean
}

export interface Rpt2Sheet {
  id: number
  template_id: number
  sheet_name: string
  sql_query: string
  sheet_order: number
  columns: Rpt2Column[]
}

export interface Rpt2Param {
  id: number
  template_id: number
  param_key: string
  label: string
  param_type: string // DATE | DATERANGE | SELECT | TEXT | NUMBER
  default_value: string
  options_query: string
  applicable_sheets: string
  is_required: boolean
  param_order: number
}

export interface Rpt2Template {
  id: number
  code: string
  name: string
  description: string
  category: string
  is_active: boolean
  created_by: number
  created_at: string
  sheets: Rpt2Sheet[]
  params: Rpt2Param[]
}

export interface ReqSaveSheet {
  sheet_name: string
  sql_query: string
  sheet_order: number
  columns: ReqSaveColumn[]
}

export interface ReqSaveColumn {
  column_key: string
  display_name: string
  column_order: number
  excel_width: number
  excel_format: string
  is_default_visible: boolean
  is_toggleable: boolean
}

export interface ReqSaveParam {
  param_key: string
  label: string
  param_type: string
  default_value: string
  options_query: string
  applicable_sheets: string
  is_required: boolean
  param_order: number
}

export const PARAM_TYPES = [
  { value: "DATE", label: "Date" },
  { value: "DATERANGE", label: "Date Range" },
  { value: "SELECT", label: "Dropdown" },
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
]

export const EXCEL_FORMATS = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
]

export const CATEGORIES = [
  "INBOUND",
  "OUTBOUND",
  "INVENTORY",
  "STOCK TAKE",
  "GENERAL",
]