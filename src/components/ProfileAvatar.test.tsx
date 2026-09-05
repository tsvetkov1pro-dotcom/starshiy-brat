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
  it('keeps the approved artwork inside one clean circular viewport', () => {
    const { container } = render(<ProfileAvatar profile={profile} size="md" />);
    const frame = container.querySelector('.profile-avatar') as HTMLElement;
    const image = container.querySelector('img') as HTMLImageElement;

    expect(frame.style.border).toBe('0px');
    expect(frame.style.boxShadow).toBe('none');
    expect(frame.style.background).toBe('transparent');
    expect(frame.style.aspectRatio).toBe('1 / 1');
    expect(frame.style.overflow).toBe('hidden');
    expect(frame.style.borderRadius).toBe('50%');
    expect(frame.style.padding).toBe('1px');
    expect(image.style.transform).toBe('none');
    expect(image.style.filter).toBe('none');
    expect(image.style.objectFit).toBe('contain');
    expect(image.style.borderRadius).toBe('50%');
    expect(image.getAttribute('width')).toBe('88');
    expect(image.getAttribute('height')).toBe('88');
  });
});
