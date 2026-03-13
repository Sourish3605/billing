import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetSettings, 
  useUpdateSettings,
  getGetSettingsQueryKey,
  type ShopSettings
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useSettingsData() {
  return useGetSettings();
}

export function useSettingsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const update = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: "Settings saved successfully" });
      },
      onError: () => {
        toast({ title: "Error saving settings", variant: "destructive" });
      }
    }
  });

  return {
    updateSettings: (data: ShopSettings) => update.mutateAsync({ data }),
    isUpdating: update.isPending,
  };
}
