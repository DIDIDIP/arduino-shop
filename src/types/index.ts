export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  specs: string[];
  image_url: string | null;
  source_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type OrderStatus = "pending" | "paid" | "shipping" | "delivered" | "cancelled";

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  order_name: string;
  total_amount: number;
  shipping_fee: number;
  recipient: string;
  phone: string;
  address: string;
  memo: string | null;
  payment_key: string | null;
  paid_at: string | null;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: string;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};
