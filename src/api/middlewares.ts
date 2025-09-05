import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostAdminCreateBrand } from "./admin/brands/validators";
import { z } from "zod";

export const GetBrandsSchema = createFindParams();

export const UpdateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
});

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateBrand)],
    },
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name", "products.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/products",
      method: ["POST", "PATCH"],
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    {
      matcher: "/admin/products/:id",
      method: "POST",
      additionalDataValidator: {
        brand_id: z.string().optional(),
      },
    },
    {
      matcher: "/admin/brands/:id",
      method: "DELETE",
      middlewares: [],
    },
    {
      matcher: "/admin/brands/:id",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name", "products.*"],
        }),
      ],
    },
    {
      matcher: "/admin/brands/:id",
      method: "PATCH",
      middlewares: [validateAndTransformBody(UpdateBrandSchema)],
    },
  ],
});
