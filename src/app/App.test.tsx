import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('application shell', () => {
  it('renders the canonical product home without participant data', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(await screen.findByRole('region', { name: /Старший Брат — навигатор по сообществу/i })).toBeInTheDocument();
    expect(screen.getByText('Выберите себя')).toBeInTheDocument();
    expect(screen.getByText('Подобрано для тебя')).toBeInTheDocument();
    expect(screen.getByText('Сферы сообщества')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Поиск' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Обновить подборку' })).toBeDisabled();

    expect(await screen.findByText(/Сначала импортируй визитки сообщества/i)).toBeInTheDocument();
  });
});
