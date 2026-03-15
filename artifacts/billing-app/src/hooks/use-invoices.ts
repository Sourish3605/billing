import { useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  useListInvoices, 
  useGetInvoice,
  useCreateInvoice, 
  useUpdateInvoice,
  getListInvoicesQueryKey,
  getGetInvoiceQueryKey,
  getListProductsQueryKey,
  getGetDashboardQueryKey,
  type InvoiceInput
} from "@workspace/api-client-react";

export function useInvoicesData() {
  return useListInvoices();
}

export function useInvoiceData(id: number | null) {
  return useGetInvoice(id as number, { query: { enabled: !!id } });
}

export function useInvoiceMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };

  const create = useCreateInvoice({ 
    mutation: { onSuccess: invalidateAll } 
  });
  
  const update = useUpdateInvoice({ 
    mutation: { 
      onSuccess: (data) => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(data.id) });
      } 
    } 
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete invoice");
    },
    onSuccess: invalidateAll,
  });

  return {
    createInvoice: (data: InvoiceInput) => create.mutateAsync({ data }),
    updateInvoice: (id: number, data: InvoiceInput) => update.mutateAsync({ id, data }),
    deleteInvoice: (id: number) => remove.mutateAsync(id),
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
}
