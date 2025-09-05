import { defineRouteConfig } from "@medusajs/admin-sdk";
import { TagSolid, Plus, Trash, PencilSquare } from "@medusajs/icons";
import {
  Container,
  Button,
  Heading,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
  toast,
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../../lib/sdk";
import { useMemo, useState } from "react";
import { CreateBrandModal } from "./components/create-brand-modal";
import { EditBrandModal } from "./components/edit-brand-modal";

type Brand = {
  id: string;
  name: string;
};
type BrandsResponse = {
  brands: Brand[];
  count: number;
  limit: number;
  offset: number;
};

const BrandsPage = () => {
  const limit = 15;
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const queryClient = useQueryClient();

  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const { data, isLoading } = useQuery<BrandsResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/brands`, {
        query: {
          limit,
          offset,
        },
      }),
    queryKey: [["brands", limit, offset]],
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      return sdk.client.fetch(`/admin/brands/${brandId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Success", {
        description: "Brand deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [["brands"]] });
    },
    onError: (error) => {
      toast.error("Error", {
        description: `Failed to delete brand: ${error.message}`,
      });
    },
  });

  const handleDeleteBrand = async (brand: Brand) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${brand.name}"?`
    );

    if (confirmed) {
      deleteBrandMutation.mutate(brand.id);
    }
  };

  const columnHelper = createDataTableColumnHelper<Brand>();

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: ({ getValue }) => (
        <span className="text-xs text-ui-fg-muted">{getValue()}</span>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="transparent"
            size="small"
            onClick={() => {
              setSelectedBrand(row.original);
              setShowEditModal(true);
            }}
          >
            <PencilSquare className="text-ui-fg-muted" />
          </Button>
          <Button
            variant="transparent"
            size="small"
            onClick={() => handleDeleteBrand(row.original)}
            disabled={deleteBrandMutation.isPending}
          >
            <Trash className="text-ui-fg-muted" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useDataTable({
    columns,
    data: data?.brands || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  });

  return (
    <>
      <Container className="divide-y p-0">
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <Heading>Brands</Heading>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus /> Create Brand
            </Button>
          </DataTable.Toolbar>
          <DataTable.Table />
          <DataTable.Pagination />
        </DataTable>
      </Container>

      {showCreateModal && (
        <CreateBrandModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      )}
      {showEditModal && selectedBrand && (
        <EditBrandModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          brand={selectedBrand}
        />
      )}
    </>
  );
};

export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
});

export default BrandsPage;
