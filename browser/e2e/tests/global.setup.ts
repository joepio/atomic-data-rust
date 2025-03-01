import { test as setup, expect } from '@playwright/test';
import {
  before,
  DELETE_PREVIOUS_TEST_DRIVES,
  FRONTEND_URL,
  signIn,
} from './test-utils';

setup('delete previous test data', async ({ page }) => {
  setup.slow();

  if (!DELETE_PREVIOUS_TEST_DRIVES) {
    expect(true).toBe(true);

    return;
  }

  await before({ page });
  await signIn(page);
  await page.goto(`${FRONTEND_URL}/app/prunetests`);
  await expect(page.getByText('Prune Test Data')).toBeVisible();
  await page.getByRole('button', { name: 'Prune' }).click();

  await expect(page.getByTestId('prune-result')).toBeVisible();
});
