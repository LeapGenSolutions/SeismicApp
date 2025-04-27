import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './lib/queryClient';
import { useToast } from './hooks/use-toast';
import { format } from 'date-fns';



export const useAppointments = (options= {}) => {
  const { date = new Date(), providerId } = options;
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const formattedDate = format(date, 'yyyy-MM-dd');
  
  // Fetch appointments
  const { data, isLoading, error } = useQuery({
    queryKey,
    staleTime, // 30 seconds
  });
  
  // Fetch selected appointment details
  const { data, isLoading= useQuery({
    queryKey,
    enabled,
  });
  
  // Change appointment status mutation
  const updateStatusMutation = useMutation({
    mutationFn, status }; status) => {
      const res = await apiRequest('PATCH', `/api/appointments/${id}/status`, { status });
      return res.json();
    },
    onSuccess) => {
      toast({
        title,
        description,
      });
      
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey);
      
      if (selectedAppointmentId === data.id) {
        queryClient.invalidateQueries({ queryKey);
      }
    },
    onError) => {
      toast({
        title,
        description,
        variant,
      });
    },
  });
  
  // Filter appointments based on providerId
  const filteredAppointments = providerId
    ? appointments?.filter((app) => app.providerId === providerId)
    ;
  
  return {
    appointments,
    isLoading,
    error,
    selectedAppointment,
    isLoadingDetails,
    selectedAppointmentId,
    setSelectedAppointmentId,
    updateStatus,
    isUpdatingStatus,
  };
};
