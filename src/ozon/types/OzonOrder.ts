export interface Delivery_method {
  id: number;
  name: string;
  warehouse_id: number;
  warehouse: string;
  tpl_provider_id: number;
  tpl_provider: string;
}

export interface Cancellation {
  cancel_reason_id: number;
  cancel_reason: string;
  cancellation_type: string;
  cancelled_after_ship: boolean;
  affect_cancellation_rating: boolean;
  cancellation_initiator: string;
}

export interface Barcode {
  upper_barcode: string;
  lower_barcode: string;
}

export interface Analytics_data {
  region: string;
  city: string;
  delivery_type: string;
  is_premium: boolean;
  payment_type_group_name: string;
  warehouse_id: number;
  warehouse: string;
  tpl_provider_id: number;
  tpl_provider: string;
  delivery_date_begin: string;
  delivery_date_end: string;
  is_legal: boolean;
}

export interface Item_service {
  marketplace_service_item_fulfillment: number;
  marketplace_service_item_pickup: number;
  marketplace_service_item_dropoff_pvz: number;
  marketplace_service_item_dropoff_sc: number;
  marketplace_service_item_dropoff_ff: number;
  marketplace_service_item_direct_flow_trans: number;
  marketplace_service_item_return_flow_trans: number;
  marketplace_service_item_deliv_to_customer: number;
  marketplace_service_item_return_not_deliv_to_customer: number;
  marketplace_service_item_return_part_goods_customer: number;
  marketplace_service_item_return_after_deliv_to_customer: number;
}

export interface Product {
  product_id: number;
  price: string | number;
  currency_code: string;
  offer_id: string;
  name: string;
  sku: number;
  quantity: number;
  products_requiring_jw_uin: string;
  mandatory_mark: any[];
}

export interface Product {
  commission_amount: number;
  commission_percent: number;
  payout: number;
  product_id: number;
  old_price: number;
  price: number | string;
  total_discount_value: number;
  total_discount_percent: number;
  actions: string[];
  picking?: any;
  quantity: number;
  client_price: string;
  item_services: Item_service;
}

export interface Posting {
  posting_number: string;
  order_id: number;
  order_number: string;
  status: string;
  delivery_method: Delivery_method;
  tracking_number: string;
  tpl_integration_type: string;
  in_process_at: string;
  shipment_date: string;
  delivering_date?: any;
  cancellation: Cancellation;
  customer?: any;
  products: Product[];
  addressee?: any;
  barcodes: Barcode;
  analytics_data: Analytics_data;
  financial_data: Financial_data;
  is_express: boolean;
  requirements: Requirement;
}

export interface Posting_service {
  marketplace_service_item_fulfillment: number;
  marketplace_service_item_pickup: number;
  marketplace_service_item_dropoff_pvz: number;
  marketplace_service_item_dropoff_sc: number;
  marketplace_service_item_dropoff_ff: number;
  marketplace_service_item_direct_flow_trans: number;
  marketplace_service_item_return_flow_trans: number;
  marketplace_service_item_deliv_to_customer: number;
  marketplace_service_item_return_not_deliv_to_customer: number;
  marketplace_service_item_return_part_goods_customer: number;
  marketplace_service_item_return_after_deliv_to_customer: number;
}

export interface Financial_data {
  products: Product[];
  posting_services: Posting_service;
}

export interface Requirement {
  products_requiring_gtd: any[];
  products_requiring_country: any[];
  products_requiring_jwn: any[];
}

export interface OzonResult {
  postings: Posting[];
  count: number;
}

export interface OzonOrder {
  result: OzonResult;
}
