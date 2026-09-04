import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('application scaffold', () => {
  it('renders the product shell without participant data', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Найди того, кто уже проходил через это/i })).toBeInTheDocument();
    expect(screen.getByText('Выберите себя')).toBeInTheDocument();
    expect(screen.getByText('Подобрано для тебя')).toBeInTheDocument();
    expect(screen.getByText('Сферы сообщества')).toBeInTheDocument();
  });
});
