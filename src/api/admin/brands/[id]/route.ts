import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { deleteBrandWorkflow } from "../../../../workflows/delete-brand";
import { updateBrandWorkflow } from "../../../../workflows/update-brand";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  await deleteBrandWorkflow(req.scope).run({
    input: { id },
  });

  res.status(200).json({
    id,
    object: "brand",
    deleted: true,
  });
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const query = req.scope.resolve("query");

  const {
    data: [brand],
  } = await query.graph({
    entity: "brand",
    filters: { id },
    ...req.queryConfig,
  });

  if (!brand) {
    return res.status(404).json({ message: "Brand not found" });
  }

  res.json({ brand });
};

export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { name } = req.validatedBody as { name: string };

  const result = await updateBrandWorkflow(req.scope).run({
    input: { id, name },
  });

  res.json({ brand: result });
};
