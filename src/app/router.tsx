import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { HomePage } from '../features/home/HomePage';
import { SectionPage } from '../features/placeholders/SectionPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/find', element: <SectionPage title="Найти брата" description="Поиск по людям, задачам и компетенциям будет реализован на следующем этапе." /> },
      { path: '/brothers', element: <SectionPage title="Мои братья" description="Здесь появятся сохранённые участники." /> },
      { path: '/domains', element: <SectionPage title="Сферы" description="Интерактивная карта сфер сообщества появится после классификации данных." /> },
      { path: '/challenges', element: <SectionPage title="Похожие вызовы" description="Здесь будут участники, проходящие через похожие задачи и жизненные ситуации." /> },
      { path: '/import', element: <SectionPage title="Импорт чата" description="Локальный импорт Telegram HTML будет подключён отдельным модулем парсера." /> },
    ],
  },
]);
