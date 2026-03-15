import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey, useLogin, useLogout, type LoginRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
        toast({ title: "Welcome back", description: "Logged in successfully" });
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
