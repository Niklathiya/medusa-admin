// import { defineWidgetConfig } from "@medusajs/admin-sdk";
// import { Select, Label } from "@medusajs/ui";
// import { useQuery } from "@tanstack/react-query";
// import { sdk } from "../lib/sdk";
// import { useEffect, useState } from "react";

// type Brand = {
//   id: string;
//   name: string;
// };

// type BrandsResponse = {
//   brands: Brand[];
//   count: number;
// };

// const ProductBrandFormWidget = ({ data }: { data?: any }) => {
//   const [selectedBrandId, setSelectedBrandId] = useState<string>("");

//   const { data: brandsData, isLoading } = useQuery<BrandsResponse>({
//     queryFn: () =>
//       sdk.client.fetch(`/admin/brands`, {
//         query: { limit: 1000 },
//       }),
//     queryKey: [["brands", "all"]],
//   });
//   console.log("Brands data:", brandsData?.brands);

//   // Try to get the current brand from product data if editing
//   useEffect(() => {
//     if (data?.brand?.id) {
//       setSelectedBrandId(data.brand.id);
//     }
//   }, [data]);

//   const handleBrandChange = (value: string) => {
//     setSelectedBrandId(value);

//     // Try to update the form via DOM manipulation or global state
//     // This is a fallback approach when React Hook Form context isn't available
//     const event = new CustomEvent("brandSelected", {
//       detail: { brandId: value || undefined },
//     });
//     window.dispatchEvent(event);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center gap-2 p-4">
//         <span>Loading brands...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-2">
//       <Label htmlFor="brand-select">Brand</Label>
//       <Select value={selectedBrandId || ""} onValueChange={handleBrandChange}>
//         <Select.Trigger>
//           <Select.Value placeholder="Select a brand" />
//         </Select.Trigger>
//         <Select.Content>
//           {brandsData?.brands?.map((brand) => (
//             <Select.Item key={brand.id} value={brand.id}>
//               {brand.name}
//             </Select.Item>
//           ))}
//         </Select.Content>
//       </Select>
//     </div>
//   );
// };

// export const config = defineWidgetConfig({
//   zone: "product.details.before",
// });

// export default ProductBrandFormWidget;

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import {
  clx,
  Container,
  Heading,
  Select,
  Label,
  Button,
  toast,
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { useEffect, useState } from "react";

type Brand = {
  id: string;
  name: string;
};

type BrandsResponse = {
  brands: Brand[];
  count: number;
};

type AdminProductBrand = AdminProduct & {
  brand?: {
    id: string;
    name: string;
  };
};

const ProductBrandFormWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Get product with brand data
  const { data: productData } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "+brand.*",
      }),
    queryKey: [["product", product.id]],
  });

  // Get all brands
  const { data: brandsData, isLoading: brandsLoading } =
    useQuery<BrandsResponse>({
      queryFn: () =>
        sdk.client.fetch(`/admin/brands`, {
          query: { limit: 1000 },
        }),
      queryKey: [["brands", "all"]],
    });

  // Update brand mutation
  const updateBrandMutation = useMutation({
    mutationFn: async (brandId: string | null) => {
      return sdk.client.fetch(`/admin/products/${product.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand_id: brandId,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Brand updated successfully!");
      setHasChanges(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [["product", product.id]],
      });
    },
    onError: (error: any) => {
      toast.error(
        `Failed to update brand: ${error.message || "Unknown error"}`
      );
    },
  });

  const currentBrand = (productData?.product as AdminProductBrand)?.brand;

  // Set initial selected brand
  useEffect(() => {
    const currentBrandId = currentBrand?.id || "";
    setSelectedBrandId(currentBrandId);
  }, [currentBrand]);

  const handleBrandChange = (value: string) => {
    setSelectedBrandId(value);
    setHasChanges(value !== (currentBrand?.id || ""));
  };

  const handleSave = async () => {
    const brandIdToSave = selectedBrandId || null;
    await updateBrandMutation.mutateAsync(brandIdToSave);
  };

  const handleReset = () => {
    setSelectedBrandId(currentBrand?.id || "");
    setHasChanges(false);
  };

  if (brandsLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Brand</Heading>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span>Loading brands...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand</Heading>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-select">Select Brand</Label>
          <Select
            value={selectedBrandId || ""}
            onValueChange={handleBrandChange}
            disabled={updateBrandMutation.isPending}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select a brand (optional)" />
            </Select.Trigger>
            <Select.Content>
              {brandsData?.brands?.map((brand) => (
                <Select.Item key={brand.id} value={brand.id}>
                  {brand.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        {/* Current brand display */}
        {currentBrand && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Current Brand:</span>{" "}
            {currentBrand.name}
          </div>
        )}

        {/* Action buttons */}
        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateBrandMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateBrandMutation.isPending && (
                <span className="loader-border h-4 w-4" >Loading</span>
              )}
              Save Changes
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={updateBrandMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.before",
});

export default ProductBrandFormWidget;
