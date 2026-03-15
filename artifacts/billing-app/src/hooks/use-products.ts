import { useQueryClient } from "@tanstack/react-query";
import { 
  useListProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  getListProductsQueryKey,
  type ProductInput
} from "@workspace/api-client-react";

export function useProductsData() {
  return useListProducts();
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });

  const create = useCreateProduct({ mutation: { onSuccess: invalidate } });
  const update = useUpdateProduct({ mutation: { onSuccess: invalidate } });
  const remove = useDeleteProduct({ mutation: { onSuccess: invalidate } });

  return {
    createProduct: (data: ProductInput) => create.mutateAsync({ data }),
    updateProduct: (id: number, data: ProductInput) => update.mutateAsync({ id, data }),
    deleteProduct: (id: number) => remove.mutateAsync({ id }),
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
}
