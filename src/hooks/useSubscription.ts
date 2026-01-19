import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

// Re-export the hook that uses the context
// This ensures all existing imports continue to work
export function useSubscription() {
  return useSubscriptionContext();
}
