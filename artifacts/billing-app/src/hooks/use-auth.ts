import { useQueryClient } from "@tanstack/react-query";
import { getMe, useGetMe, getGetMeQueryKey, useLogin, useLogout, type LoginRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), {
          username: data.username,
          authenticated: true,
        });

        try {
          const me = await getMe();
          queryClient.setQueryData(getGetMeQueryKey(), me);
          setLocation("/dashboard");
          toast({ title: "Welcome back", description: "Logged in successfully" });
        } catch {
          queryClient.setQueryData(getGetMeQueryKey(), null);
          toast({
            title: "Session issue",
            description: "Login response succeeded, but the session cookie was not established. Please allow cookies and try again.",
            variant: "destructive",
          });
        }
      },
      onError: () => {
        toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/login");
      }
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user?.authenticated,
    login: (data: LoginRequest) => loginMutation.mutateAsync({ data }),
    isLoggingIn: loginMutation.isPending,
    logout: () => logoutMutation.mutateAsync(undefined),
  };
}
