import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AppRoutes, ScreenNav } from './routes.generated';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScreenNav />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
