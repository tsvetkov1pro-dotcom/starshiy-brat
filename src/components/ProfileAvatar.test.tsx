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
  it('renders one approved image with corrected optical centering', () => {
    const { container } = render(<ProfileAvatar profile={profile} size="md" />);
    const frame = container.querySelector('.profile-avatar') as HTMLElement;
    const image = container.querySelector('img') as HTMLImageElement;

    expect(frame.style.display).toBe('grid');
    expect(frame.style.placeItems).toBe('center');
    expect(frame.style.borderRadius).toBe('50%');
    expect(frame.style.overflow).toBe('hidden');
    expect(frame.style.border).toContain('2px');
    expect(frame.style.boxShadow).toContain('rgba');
    expect(frame.style.background).toBe('rgb(27, 24, 20)');

    expect(image).not.toBeNull();
    expect(image.src).toContain('data:image/webp;base64,');
    expect(image.style.width).toBe('100%');
    expect(image.style.height).toBe('100%');
    expect(image.style.objectFit).toBe('cover');
    expect(image.style.objectPosition).toBe('50% 50%');
    expect(image.style.transform).toBe('translate(-10%, -7%) scale(1.14)');
    expect(image.style.transformOrigin).toBe('50% 50%');
    expect(image.style.filter).toBe('none');
    expect(image.getAttribute('width')).toBe('88');
    expect(image.getAttribute('height')).toBe('88');
  });
});
