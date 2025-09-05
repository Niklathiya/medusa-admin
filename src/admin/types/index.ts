import { AdminUpdateProduct } from "@medusajs/framework/types";

declare module "@medusajs/framework/types" {
  interface AdminUpdateProduct {
    additional_data?: {
      brand_id?: string | null;
    };
  }
}
