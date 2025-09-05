import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { BRAND_MODULE } from "../modules/brand";
import BrandModuleService from "../modules/brand/service";

export type UpdateBrandStepInput = {
  id: string;
  name: string;
};

export const updateBrandStep = createStep(
  "update-brand-step",
  async (input: UpdateBrandStepInput, { container }) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE);

    // Store original brand data for potential rollback
    const originalBrand = await brandModuleService.retrieveBrand(input.id);

    const updatedBrand = await brandModuleService.updateBrands({
      id: input.id,
      name: input.name,
    });

    return new StepResponse(updatedBrand, { originalBrand });
  },
  async (compensateInput: { originalBrand: any }, { container }) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE);

    // Restore original brand data if needed for rollback
    await brandModuleService.updateBrands({
      id: compensateInput.originalBrand.id,
      name: compensateInput.originalBrand.name,
    });
  }
);

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  (input: UpdateBrandStepInput) => {
    const result = updateBrandStep(input);
    return new WorkflowResponse(result);
  }
);
