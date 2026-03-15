import { useQueryClient } from "@tanstack/react-query";
import { 
  useListCustomers, 
  useCreateCustomer, 
  useUpdateCustomer, 
  useDeleteCustomer,
  getListCustomersQueryKey,
  type CustomerInput
} from "@workspace/api-client-react";

export function useCustomersData() {
  return useListCustomers();
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });

  const create = useCreateCustomer({ mutation: { onSuccess: invalidate } });
  const update = useUpdateCustomer({ mutation: { onSuccess: invalidate } });
  const remove = useDeleteCustomer({ mutation: { onSuccess: invalidate } });

  return {
    createCustomer: (data: CustomerInput) => create.mutateAsync({ data }),
    updateCustomer: (id: number, data: CustomerInput) => update.mutateAsync({ id, data }),
    deleteCustomer: (id: number) => remove.mutateAsync({ id }),
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
}
