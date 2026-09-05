import { render } from '@testing-library/react';
import type { Profile } from '../types/profile';
import { ProfileAvatar } from './ProfileAvatar';

const profile: Profile = {
  id: 'avatar-rendering-test',
  telegramDisplayName: 'Тестовый брат',
  domains: [],
  challenges: [],
  searchKeywords: [],
  rawProfileText: 'Тестовая визитка',
  avatarSeed: 'avatar-rendering-test',
};

describe('ProfileAvatar', () => {
  it('renders one approved high-density sprite cell without an extra frame or crop', () => {
    const { container } = render(<ProfileAvatar profile={profile} size="md" />);
    const frame = container.querySelector('.profile-avatar') as HTMLElement;

    expect(frame).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(frame.style.aspectRatio).toBe('1 / 1');
    expect(frame.style.border).toBe('0px');
    expect(frame.style.boxShadow).toBe('none');
    expect(frame.style.backgroundColor).toBe('transparent');
    expect(frame.style.backgroundImage).toContain('data:image/webp;base64');
    expect(frame.style.backgroundRepeat).toBe('no-repeat');
    expect(frame.style.backgroundSize).toBe('300% 200%');
    expect(['0% 0%', '50% 0%', '100% 0%', '0% 100%', '50% 100%', '100% 100%'])
      .toContain(frame.style.backgroundPosition);
    expect(frame.style.padding).toBe('0px');
    expect(frame.style.transform).toBe('none');
    expect(frame.style.filter).toBe('none');
    expect(Number(frame.dataset.avatarIndex)).toBeGreaterThanOrEqual(0);
    expect(Number(frame.dataset.avatarIndex)).toBeLessThan(6);
  });
});
