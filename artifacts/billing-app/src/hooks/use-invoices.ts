import { useQueryClient } from "@tanstack/react-query";
import { 
  useListInvoices, 
  useGetInvoice,
  useCreateInvoice, 
  useUpdateInvoice,
  getListInvoicesQueryKey,
  getGetInvoiceQueryKey,
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
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });

  const create = useCreateInvoice({ 
    mutation: { onSuccess: invalidateList } 
  });
  
  const update = useUpdateInvoice({ 
    mutation: { 
      onSuccess: (data) => {
        invalidateList();
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(data.id) });
      } 
    } 
  });

  return {
    createInvoice: (data: InvoiceInput) => create.mutateAsync({ data }),
    updateInvoice: (id: number, data: InvoiceInput) => update.mutateAsync({ id, data }),
    isCreating: create.isPending,
    isUpdating: update.isPending,
  };
}
