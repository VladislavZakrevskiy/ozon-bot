export interface Return {
  clearing_id: number;
  commission: number;
  commission_percent: number;
  exemplar_id: number;
  id: number;
  is_moving: boolean;
  is_opened: boolean;
  last_free_waiting_day: string;
  place_id: number;
  moving_to_place_name: string;
  picking_amount: number;
  posting_number: string;
  picking_tag: string;
  price: number;
  price_without_commission: number;
  product_id: number;
  product_name: string;
  quantity: number;
  return_barcode: string;
  return_clearing_id: number;
  return_date: string;
  return_reason_name: string;
  waiting_for_seller_date_time: string;
  returned_to_seller_date_time: string;
  waiting_for_seller_days: number;
  returns_keeping_cost: number;
  sku: number;
  status: string;
}

export interface OzonReturn {
  last_id: number;
  returns: Return[];
}
