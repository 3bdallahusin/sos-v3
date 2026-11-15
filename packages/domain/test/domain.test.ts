import { describe, it, expect } from 'vitest';
import {
  generateUuidV7,
  NAVIGATION_DESTINATIONS,
  NAVIGATION_ITEMS,
  SHELL_DIMENSIONS
} from '../src/index.js';

describe('Domain Models & Constants (Phase 01)', () => {
  it('defines the approved eight navigation destinations in the exact order', () => {
    expect(NAVIGATION_DESTINATIONS).toEqual([
      'home',
      'library',
      'learning',
      'tracking',
      'calendar',
      'community',
      'profile',
      'settings'
    ]);

    expect(NAVIGATION_ITEMS.map((item) => item.id)).toEqual(
      NAVIGATION_DESTINATIONS
    );
  });

  it('verifies exact canonical shell dimensions', () => {
    expect(SHELL_DIMENSIONS.headerHeightPx).toBe(48);
    expect(SHELL_DIMENSIONS.leftRailCollapsedWidthPx).toBe(56);
    expect(SHELL_DIMENSIONS.leftRailExpandedWidthPx).toBe(240);
    expect(SHELL_DIMENSIONS.rightAiPanelWidthPx).toBe(340);
    expect(SHELL_DIMENSIONS.islandGapPx).toBe(8);
    expect(SHELL_DIMENSIONS.islandBorderRadiusPx).toBe(24);
  });

  it('generates valid RFC 9562 UUIDv7 identifiers', () => {
    const id1 = generateUuidV7();
    const id2 = generateUuidV7();

    // Standard UUID pattern
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(id1).toMatch(uuidRegex);
    expect(id2).toMatch(uuidRegex);
    expect(id1).not.toBe(id2);
  });
});
