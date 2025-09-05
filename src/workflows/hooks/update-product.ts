// import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
// import { StepResponse } from "@medusajs/framework/workflows-sdk";
// import { Modules } from "@medusajs/framework/utils";
// import { LinkDefinition } from "@medusajs/framework/types";
// import { BRAND_MODULE } from "../../modules/brand";
// import BrandModuleService from "../../modules/brand/service";

// updateProductsWorkflow.hooks.productsUpdated(
//   async ({ products, additional_data }, { container }) => {
//     if (!additional_data?.brand_id) {
//       return new StepResponse([], []);
//     }

//     const brandModuleService: BrandModuleService =
//       container.resolve(BRAND_MODULE);
//     // If the brand doesn't exist, an error is thrown.
//     await brandModuleService.retrieveBrand(additional_data.brand_id as string);

//     const link = container.resolve("link");
//     const logger = container.resolve("logger");

//     const links: LinkDefinition[] = [];
//     const previousLinks: LinkDefinition[] = [];

//     for (const product of products) {
//       // Store existing link for compensation (rollback)
//       const existingLinks = await link.list({
//         filters: {
//           [Modules.PRODUCT]: { product_id: product.id },
//           [BRAND_MODULE]: { brand_id: additional_data.brand_id },
//         },
//       });

//       if (existingLinks.length > 0) {
//         previousLinks.push(
//           ...existingLinks.filter(
//             (l): l is LinkDefinition =>
//               typeof l === "object" && l !== null && Object.keys(l).length > 0
//           )
//         );
//       }

//       links.push({
//         [Modules.PRODUCT]: {
//           product_id: product.id,
//         },
//         [BRAND_MODULE]: {
//           brand_id: additional_data.brand_id,
//         },
//       });
//     }

//     // Dismiss existing links to avoid duplicates
//     if (previousLinks.length > 0) {
//       await link.dismiss(previousLinks);
//     }

//     // Create new links
//     await link.create(links);

//     logger.info("Updated brand link for products");

//     return new StepResponse(links, previousLinks);
//   },
//   async (previousLinks, { container }) => {
//     if (!previousLinks?.length) {
//       return;
//     }

//     const link = container.resolve("link");

//     // Restore previous links in case of rollback
//     await link.create(previousLinks);

//     const logger = container.resolve("logger");
//     logger.info("Restored previous brand links for products");
//   }
// );

import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { LinkDefinition } from "@medusajs/framework/types";
import { BRAND_MODULE } from "../../modules/brand";
import BrandModuleService from "../../modules/brand/service";

export type UpdateProductBrandStepInput = {
  product_id: string;
  brand_id?: string;
};

type UpdateProductBrandWorkflowInput = {
  product_id: string;
  brand_id?: string;
};

export const updateProductBrandStep = createStep(
  "update-product-brand-step",
  async (input: UpdateProductBrandStepInput, { container }) => {
    const link = container.resolve("link");
    const logger = container.resolve("logger");

    // First, get any existing brand links for this product
    const existingLinks = await link.list({
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
    });

    const brandLinks = existingLinks.filter(
      (linkItem: any) => linkItem[BRAND_MODULE]?.brand_id
    );

    if (brandLinks.length > 0) {
      await link.dismiss(brandLinks.map((linkItem: any) => linkItem.id));
    }

    let newLink: any = null;

    // If brand_id is provided, create new link
    if (input.brand_id) {
      const brandModuleService: BrandModuleService =
        container.resolve(BRAND_MODULE);

      // Verify brand exists
      await brandModuleService.retrieveBrand(input.brand_id);

      const linkDefinition: LinkDefinition = {
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
        [BRAND_MODULE]: {
          brand_id: input.brand_id,
        },
      };

      const createdLinks = await link.create([linkDefinition]);
      newLink = Array.isArray(createdLinks) ? createdLinks[0] : createdLinks;

      logger.info(
        `Updated product ${input.product_id} with brand ${input.brand_id}`
      );
    } else {
      logger.info(`Removed brand from product ${input.product_id}`);
    }

    return new StepResponse(
      { success: true, link: newLink },
      { product_id: input.product_id, previous_links: brandLinks }
    );
  },
  async (
    compensateData: { product_id: string; previous_links: any[] } | undefined,
    { container }
  ) => {
    if (!compensateData) return;

    const link = container.resolve("link");

    // Restore previous links if they existed
    if (compensateData.previous_links?.length > 0) {
      // Recreate the links using the original link definitions
      const linkDefinitions: LinkDefinition[] =
        compensateData.previous_links.map((linkItem: any) => ({
          [Modules.PRODUCT]: {
            product_id: compensateData.product_id,
          },
          [BRAND_MODULE]: {
            brand_id: linkItem[BRAND_MODULE]?.brand_id,
          },
        }));

      await link.create(linkDefinitions);
    }
  }
);

export const updateProductBrandWorkflow = createWorkflow(
  "update-product-brand",
  (input: UpdateProductBrandWorkflowInput) => {
    const result = updateProductBrandStep(input);
    return new WorkflowResponse(result);
  }
);
