import { useSearch } from '@tanstack/react-router';
import { paths } from '../routes/paths';
import { SearchRoute } from '../routes/Search/SearchRoute';

export interface QueryScopeHandler {
  scope: string | undefined;
  enableScope: () => void;
  clearScope: () => void;
}

export function useQueryScopeHandler(subject: string): QueryScopeHandler;
export function useQueryScopeHandler(): Omit<QueryScopeHandler, 'enableScope'>;
export function useQueryScopeHandler(subject?: string): QueryScopeHandler {
  const { queryscope } = useSearch({ strict: false });
  const navigate = SearchRoute.useNavigate();

  const enableScope = () => {
    navigate({
      to: paths.search,
      search: prev => ({ ...prev, queryscope: subject ?? '' }),
    });
  };

  const clearScope = () => {
    navigate({
      to: '.',
      search: prev => ({ ...prev, queryscope: undefined }),
    });
  };

  return {
    scope: queryscope,
    enableScope,
    clearScope,
  };
}
