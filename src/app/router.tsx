import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { BrothersPage } from '../features/directory/BrothersPage';
import { FindPage } from '../features/directory/FindPage';
import { TagDirectoryPage } from '../features/directory/TagDirectoryPage';
import { HomePage } from '../features/home/HomePage';
import { ImportPage } from '../features/import/ImportPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/find', element: <FindPage /> },
      { path: '/brothers', element: <BrothersPage /> },
      { path: '/domains', element: <TagDirectoryPage mode="domains" /> },
      { path: '/challenges', element: <TagDirectoryPage mode="challenges" /> },
      { path: '/import', element: <ImportPage /> },
    ],
  },
]);
