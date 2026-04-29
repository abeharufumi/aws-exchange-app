export interface IconFrameItem {
  id: number;
  name: string;
  description?: string;
  image_url: string;
  price_jpy: number;
  is_free: boolean;
  rarity: "common" | "rare" | "epic" | "legendary" | string;
  is_owned: boolean;
  is_equipped: boolean;
}

export interface IconFramePurchaseResponse {
  purchase_id: number;
  frame_id: number;
  frame_name: string;
  price_jpy: number;
  status: "purchased" | "already_owned" | string;
}

export interface IconFrameEquipResponse {
  frame_id: number;
  status: "equipped" | string;
}
