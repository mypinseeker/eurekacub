import { test, expect } from '@playwright/test'

test.describe('9.x Language & Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('eurekacub:lang')
      localStorage.removeItem('eurekacub:settings')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('9.1 Chinese display — default language is zh, UI shows Chinese text', async ({ page }) => {
    // Default language is zh (from i18n config fallbackLng)
    // "探索家" appears in both label and sublabel spans, so use .first()
    await expect(page.locator('text=探索家').first()).toBeVisible()
    await expect(page.locator('text=挑战者').first()).toBeVisible()
    await expect(page.locator('text=共享模块').first()).toBeVisible()
  })

  test('9.2 English display — switch to en, all text shows English', async ({ page }) => {
    // Open settings drawer — aria-label is "打开设置" in zh
    const settingsButton = page.locator('button[aria-label*="设置"], button[aria-label*="settings"], button[aria-label*="Settings"]').first()
    await settingsButton.click()
    await page.waitForTimeout(400)

    // Click the English language button (hardcoded aria-label)
    // Two SettingsDrawer instances may exist in DOM, use .first()
    const enButton = page.locator('button[aria-label="Switch to English"]').first()
    await expect(enButton).toBeVisible()
    await enButton.click()
    await page.waitForTimeout(300)

    // Close settings drawer
    const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="关闭"]').first()
    await closeButton.click()
    await page.waitForTimeout(400)

    // Verify English text
    await expect(page.locator('text=Explorer').first()).toBeVisible()
    await expect(page.locator('text=Challenger').first()).toBeVisible()
    await expect(page.locator('text=Shared Modules').first()).toBeVisible()
  })

  test('9.3 language switch — clicking language switcher toggles instantly', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label*="设置"], button[aria-label*="settings"], button[aria-label*="Settings"]').first()
    await settingsButton.click()
    await page.waitForTimeout(400)

    // Should see settings title in Chinese initially
    await expect(page.locator('text=设置').first()).toBeVisible()

    // Click English
    await page.locator('button[aria-label="Switch to English"]').first().click()
    await page.waitForTimeout(300)

    // Settings title should now be in English
    await expect(page.locator('text=Settings').first()).toBeVisible()

    // Switch back to Chinese
    await page.locator('button[aria-label="Switch to Chinese"]').first().click()
    await page.waitForTimeout(300)

    // Should be Chinese again
    await expect(page.locator('text=设置').first()).toBeVisible()
  })

  test('9.4 persistence — language preference survives page reload', async ({ page }) => {
    // Open settings and switch to English
    const settingsButton = page.locator('button[aria-label*="设置"], button[aria-label*="settings"], button[aria-label*="Settings"]').first()
    await settingsButton.click()
    await page.waitForTimeout(400)

    await page.locator('button[aria-label="Switch to English"]').first().click()
    await page.waitForTimeout(300)

    // Close settings
    const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="关闭"]').first()
    await closeButton.click()
    await page.waitForTimeout(400)

    // Verify English
    await expect(page.locator('text=Explorer').first()).toBeVisible()

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be English after reload
    await expect(page.locator('text=Explorer').first()).toBeVisible()
    await expect(page.locator('text=Challenger').first()).toBeVisible()
  })
})

test.describe('Settings Drawer — Open/Close & Toggles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('eurekacub:settings')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('settings drawer opens and closes', async ({ page }) => {
    // Drawer uses transform classes for slide animation — use .first() as there may be 2 instances
    const drawer = page.locator('.fixed.top-0.right-0.h-full.w-72').first()
    await expect(drawer).toHaveClass(/translate-x-full/)

    // Open settings
    const settingsButton = page.locator('button[aria-label*="设置"], button[aria-label*="settings"], button[aria-label*="Settings"]').first()
    await settingsButton.click()
    await page.waitForTimeout(400)

    // Drawer should now be visible (translate-x-0)
    await expect(drawer).toHaveClass(/translate-x-0/)

    // Close via close button
    const closeButton = page.locator('button[aria-label*="关闭"], button[aria-label*="Close"]').first()
    await closeButton.click()
    await page.waitForTimeout(400)

    // Drawer should be off-screen again
    await expect(drawer).toHaveClass(/translate-x-full/)
  })

  test('sound toggle works', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label*="设置"], button[aria-label*="settings"], button[aria-label*="Settings"]').first()
    await settingsButton.click()
    await page.waitForTimeout(400)

    // Find the sound toggle row — look for 🔊 icon, then the toggle button in that row
    const soundRow = page.locator('div.flex.items-center.justify-between', { hasText: /🔊|音效|Sound/ }).first()
    const soundToggle = soundRow.locator('button')

    // Default is ON (bg-green-400)
    await expect(soundToggle).toHaveClass(/bg-green-400/)

    // Click to turn off
    await soundToggle.click()
    await page.waitForTimeout(200)

    // Should now be OFF (bg-gray-300)
    await expect(soundToggle).toHaveClass(/bg-gray-300/)

    // Click again to turn back on
    await soundToggle.click()
    await page.waitForTimeout(200)

    await expect(soundToggle).toHaveClass(/bg-green-400/)
  })

  test('haptic toggle works', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label*="设置"], button[aria-label*="settings"], button[aria-label*="Settings"]').first()
    await settingsButton.click()
    await page.waitForTimeout(400)

    // Find the haptic toggle row — look for 📳 icon
    const hapticRow = page.locator('div.flex.items-center.justify-between', { hasText: /📳|振动|Haptic/ }).first()
    const hapticToggle = hapticRow.locator('button')

    // Default is ON (bg-green-400)
    await expect(hapticToggle).toHaveClass(/bg-green-400/)

    // Click to turn off
    await hapticToggle.click()
    await page.waitForTimeout(200)

    // Should now be OFF (bg-gray-300)
    await expect(hapticToggle).toHaveClass(/bg-gray-300/)

    // Click again to turn back on
    await hapticToggle.click()
    await page.waitForTimeout(200)

    await expect(hapticToggle).toHaveClass(/bg-green-400/)
  })
})
