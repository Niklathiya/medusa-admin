import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, toast, Drawer } from "@medusajs/ui";
import { useFormik } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { sdk } from "../../../lib/sdk";

type CreateBrandModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Zod schema
const brandSchema = z.object({
  name: z.string({message: "Brand name is required"}).min(1, "Brand name is required"),
});

type BrandFormValues = z.infer<typeof brandSchema>;

export const CreateBrandModal = ({
  open,
  onOpenChange,
}: CreateBrandModalProps) => {
  const queryClient = useQueryClient();

  const createBrandMutation = useMutation({
    mutationFn: async (brandName: string) => {
      return sdk.client.fetch("/admin/brands", {
        method: "POST",
        body: { name: brandName },
      });
    },
    onSuccess: () => {
      toast.success("Success", {
        description: "Brand created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [["brands"]] });
      formik.resetForm(); // reset form after success
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: `Failed to create brand: ${error.message}`,
      });
    },
  });

  const formik = useFormik<BrandFormValues>({
    initialValues: { name: "" },
    validationSchema: toFormikValidationSchema(brandSchema),
    onSubmit: (values) => {
      createBrandMutation.mutate(values.name.trim());
    },
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Create Brand</Drawer.Title>
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
              disabled={createBrandMutation.isPending || !formik.isValid}
            >
              {createBrandMutation.isPending ? "Creating..." : "Create Brand"}
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};
