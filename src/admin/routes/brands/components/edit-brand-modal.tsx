import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, toast, Drawer } from "@medusajs/ui";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { sdk } from "../../../lib/sdk";

type EditBrandModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: { id: string; name: string };
};

// Zod schema
const brandSchema = z.object({
  name: z
    .string({ message: "Brand name is required" })
    .min(1, "Brand name is required"),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export const EditBrandModal = ({
  open,
  onOpenChange,
  brand,
}: EditBrandModalProps) => {
  const queryClient = useQueryClient();

  const updateBrandMutation = useMutation({
    mutationFn: async (brandName: string) => {
      return sdk.client.fetch(`/admin/brands/${brand.id}`, {
        method: "PATCH",
        body: { name: brandName },
      });
    },
    onSuccess: () => {
      toast.success("Success", {
        description: "Brand updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [["brands"]] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: `Failed to update brand: ${error.message}`,
      });
    },
  });

  const formik = useFormik<BrandFormValues>({
    initialValues: { name: brand.name },
    validationSchema: toFormikValidationSchema(brandSchema),
    onSubmit: (values) => {
      updateBrandMutation.mutate(values.name.trim());
    },
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Edit Brand</Drawer.Title>
        </Drawer.Header>

        <form onSubmit={formik.handleSubmit}>
          <Drawer.Body className="space-y-4">
            <div>
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter brand name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={formik.touched.name && !!formik.errors.name}
              />
              {formik.touched.name && formik.errors.name && (
                <small className="text-red-500">{formik.errors.name}</small>
              )}
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Drawer.Close>
            <Button
              type="submit"
              disabled={updateBrandMutation.isPending || !formik.isValid}
            >
              {updateBrandMutation.isPending ? "Updating..." : "Update Brand"}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};
