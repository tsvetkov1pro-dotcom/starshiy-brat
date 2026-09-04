import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('application shell', () => {
  it('renders the canonical product home without participant data', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(await screen.findByRole('img', { name: /Старший Брат — найдите своего человека в сообществе/i })).toBeInTheDocument();
    expect(screen.getByText('Выберите себя')).toBeInTheDocument();
    expect(screen.getByText('Подобрано для тебя')).toBeInTheDocument();
    expect(screen.getByText('Сферы сообщества')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Поиск' })).toBeInTheDocument();

    // Wait for the async IndexedDB bootstrap to settle before jsdom teardown.
    expect(await screen.findByText(/Сначала импортируй визитки сообщества/i)).toBeInTheDocument();
  });
});
