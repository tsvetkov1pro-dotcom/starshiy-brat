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
  it('renders the approved artwork without extra frame, shadow or CSS zoom', () => {
    const { container } = render(<ProfileAvatar profile={profile} size="md" />);
    const frame = container.querySelector('.profile-avatar') as HTMLElement;
    const image = container.querySelector('img') as HTMLImageElement;

    expect(frame).toBeTruthy();
    expect(image).toBeTruthy();
    expect(frame.style.border).toBe('0px');
    expect(frame.style.boxShadow).toBe('none');
    expect(frame.style.background).toBe('transparent');
    expect(frame.style.aspectRatio).toBe('1 / 1');
    expect(image.style.transform).toBe('none');
    expect(image.style.filter).toBe('none');
    expect(image.style.objectFit).toBe('cover');
    expect(image.getAttribute('width')).toBe('88');
    expect(image.getAttribute('height')).toBe('88');
  });
});
