import { test as base } from '@playwright/test';
import { chromium } from 'playwright';

/**
 * When PLAYWRIGHT_USER_DATA_DIR is set, use a persistent browser profile so the same
 * device/session is reused across runs. After you approve the device once,
 * future runs won't hit the "Approve new device" step.
 */
const userDataDir = process.env.PLAYWRIGHT_USER_DATA_DIR?.trim();

export const test = userDataDir
  ? base.extend({
      context: async ({}, use) => {
        const persistentContext = await chromium.launchPersistentContext(userDataDir, {
          headless: process.env.HEADED !== '1',
          viewport: { width: 1280, height: 720 },
        });
        await use(persistentContext);
        await persistentContext.close();
      },
    })
  : base;

export { expect } from '@playwright/test';
