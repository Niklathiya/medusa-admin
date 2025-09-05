import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { BRAND_MODULE } from "../modules/brand";
import BrandModuleService from "../modules/brand/service";

export type DeleteBrandStepInput = {
  id: string;
};

export const deleteBrandStep = createStep(
  "delete-brand-step",
  async (input: DeleteBrandStepInput, { container }) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE);

    // Store brand data for potential rollback
    const brand = await brandModuleService.retrieveBrand(input.id);
    
    await brandModuleService.deleteBrands(input.id);

    return new StepResponse(
      { id: input.id },
      { brand }
    );
  },
  async (compensateInput: { brand: any }, { container }) => {
    const brandModuleService: BrandModuleService =
      container.resolve(BRAND_MODULE);

    // Recreate the brand if needed for rollback
    await brandModuleService.createBrands({
      id: compensateInput.brand.id,
      name: compensateInput.brand.name,
    });
  }
);

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  (input: DeleteBrandStepInput) => {
    const result = deleteBrandStep(input);
    return new WorkflowResponse(result);
  }
);