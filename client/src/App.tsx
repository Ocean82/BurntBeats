import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BurntBeatsEnhancedComplete from './components/BurntBeatsEnhancedComplete';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <BurntBeatsEnhancedComplete />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;