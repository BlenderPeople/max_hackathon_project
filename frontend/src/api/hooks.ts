import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AvailabilitySchedule, CreateOrderInput, CreateServiceInput, OrderFilter, RecordPaymentInput, UpdateBusinessProfileInput, UpdateOrderInput } from './contracts';
import { api } from './client';

export function useService(publicToken: string) {
  return useQuery({ queryKey: ['service', publicToken], queryFn: () => api.getService(publicToken) });
}

export function useBusiness() {
  return useQuery({ queryKey: ['business'], queryFn: api.getBusiness });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateBusinessProfileInput) => api.updateBusiness(input), onSuccess: (profile) => { queryClient.setQueryData(['business'], profile); } });
}

export function useSchedule() {
  return useQuery({ queryKey: ['schedule'], queryFn: api.getSchedule });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: AvailabilitySchedule) => api.updateSchedule(input), onSuccess: (schedule) => { queryClient.setQueryData(['schedule'], schedule); queryClient.invalidateQueries({ queryKey: ['business'] }); } });
}

export function useAvailableSlots(serviceToken: string, date: string) {
  return useQuery({ queryKey: ['availability', serviceToken, date], queryFn: () => api.getAvailableSlots(serviceToken, date), enabled: Boolean(serviceToken && date) });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CreateServiceInput) => api.createService(input), onSuccess: (service) => { queryClient.invalidateQueries({ queryKey: ['business'] }); queryClient.setQueryData(['service', service.public_token], service); } });
}

export function useUpdateService(publicToken: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: CreateServiceInput) => api.updateService(publicToken, input), onSuccess: (service) => { queryClient.invalidateQueries({ queryKey: ['business'] }); queryClient.setQueryData(['service', publicToken], service); } });
}

export function useOrders(filter: OrderFilter) {
  return useQuery({ queryKey: ['orders', filter], queryFn: () => api.getOrders(filter) });
}

export function useOrder(publicToken: string) {
  return useQuery({ queryKey: ['order', publicToken], queryFn: () => api.getOrder(publicToken) });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.createOrder(input),
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.public_token], order);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

function useOrderAction(publicToken: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['order', publicToken] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  };
}

export function useDecideApproval(publicToken: string) {
  const invalidate = useOrderAction(publicToken);
  return useMutation({
    mutationFn: ({ approvalId, approved }: { approvalId: string; approved: boolean }) =>
      api.decideApproval(publicToken, approvalId, approved),
    onSuccess: invalidate,
  });
}

export function useRecordPayment(publicToken: string) {
  const invalidate = useOrderAction(publicToken);
  return useMutation({
    mutationFn: (input: Omit<RecordPaymentInput, 'order_public_token'>) =>
      api.recordPayment({ ...input, order_public_token: publicToken }),
    onSuccess: invalidate,
  });
}

export function useActivateStage(publicToken: string) {
  const invalidate = useOrderAction(publicToken);
  return useMutation({ mutationFn: (stageId: string) => api.activateStage(publicToken, stageId), onSuccess: invalidate });
}

export function useCompleteOrder(publicToken: string) {
  const invalidate = useOrderAction(publicToken);
  return useMutation({ mutationFn: () => api.completeOrder(publicToken), onSuccess: invalidate });
}

export function useUpdateOrder(publicToken: string) {
  const invalidate = useOrderAction(publicToken);
  return useMutation({ mutationFn: (input: UpdateOrderInput) => api.updateOrder(publicToken, input), onSuccess: invalidate });
}
