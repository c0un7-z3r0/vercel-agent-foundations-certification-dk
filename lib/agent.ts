import {
  getAllCategories,
  getProductDetails,
  returnOrder,
  searchProducts,
} from "@/lib/tools";
import type { InferUITools, UIMessage, UIToolInvocation } from "ai";

export const shoppingAgentTools = {
  searchProducts,
  getAllCategories,
  returnOrder,
  getProductDetails,
};

export type ShoppingAgentUIMessage = UIMessage<
  unknown,
  never,
  InferUITools<typeof shoppingAgentTools>
>;
export type SearchProductsToolInvocation = UIToolInvocation<
  typeof searchProducts
>;
export type ProductDetailsToolInvocation = UIToolInvocation<
  typeof getProductDetails
>;
