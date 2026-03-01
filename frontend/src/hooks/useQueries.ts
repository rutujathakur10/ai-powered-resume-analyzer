import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { JobRole } from '../backend';

export function useGetJobRoles() {
  const { actor, isFetching } = useActor();

  return useQuery<JobRole[]>({
    queryKey: ['jobRoles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getJobRoles();
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
  });
}

export function useGetCertifications() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['certifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCertifications();
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
  });
}

export function useGetActionVerbSuggestions() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, { weakVerb: string; strongAlternatives: string[] }]>>({
    queryKey: ['actionVerbSuggestions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActionVerbSuggestions();
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
  });
}
