export interface SubscriptionPlanInput {
  plan_name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  lead_limit_per_month: number;
  number_of_regions: number;
  highlight_in_result: boolean;
  verification_badge: boolean;
  status: "active" | "inactive";
}


export interface ISubscriptionPlan {
  id: string;
  plan_name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  lead_limit_per_month: number;
  number_of_regions: number;
  highlight_in_result: boolean;
  verification_badge: boolean;
  status: "active" | "inactive";
  created_at: Date;
  updated_at: Date;
}