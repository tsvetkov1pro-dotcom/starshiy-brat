import { RouterProvider } from 'react-router-dom';
import { AppDataProvider } from './AppDataContext';
import { router } from './router';

export function App() {
  return (
    <AppDataProvider>
      <RouterProvider router={router} />
    </AppDataProvider>
  );
}
