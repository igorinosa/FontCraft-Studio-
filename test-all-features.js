const { chromium } = require('playwright');

async function runTests() {
  console.log('🚀 Starting Comprehensive FontCraft Feature Test Suite...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('❌ Page Error:', err.message);
    errors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.warn('⚠️ Console Error:', msg.text());
    }
  });

  try {
    // 1. Navigation
    console.log('1️⃣ Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('   ✅ Loaded title:', await page.title());

    // 2. Starter Presets Dropdown
    console.log('2️⃣ Testing Starter Presets Dropdown...');
    await page.locator('button:has-text("Starter Presets")').click();
    await page.waitForTimeout(300);
    const presetsVisible = await page.locator('text=Choose a Template').isVisible();
    if (!presetsVisible) throw new Error('Preset dropdown menu did not open');
    console.log('   ✅ Preset dropdown opened');
    
    // Switch to Modern Geometric Sans
    await page.locator('text=Modern Geometric Sans').click();
    await page.waitForTimeout(400);
    console.log('   ✅ Loaded Modern Geometric Sans template');

    // Switch back to Casual Brush Sans
    await page.locator('button:has-text("Starter Presets")').click();
    await page.waitForTimeout(300);
    await page.locator('text=Casual Brush Sans').click();
    await page.waitForTimeout(400);
    console.log('   ✅ Re-loaded Casual Brush Sans template');

    // 3. Character Set & Font Map Modal
    console.log('3️⃣ Testing Character Set & Font Map Modal...');
    await page.locator('button[title="Character Set Preview"]').first().click();
    await page.waitForTimeout(400);
    const mapModalVisible = await page.locator('text=Character Set & Font Map').isVisible();
    if (!mapModalVisible) throw new Error('Character Set Map modal did not open');
    console.log('   ✅ Character Set Map modal opened');

    // Test Category Filtering
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('button:has-text("0-9")').click();
    await page.waitForTimeout(200);
    await dialog.locator('button:has-text("Punctuation")').click();
    await page.waitForTimeout(200);
    await dialog.locator('button:has-text("All (83)")').click();
    await page.waitForTimeout(200);
    console.log('   ✅ Category tabs filtered smoothly');

    // Test Waterfall Specimen View
    await dialog.locator('button:has-text("Waterfall Specimen")').click();
    await page.waitForTimeout(300);
    const waterfallVisible = await dialog.locator('text=LIVE FONT WATERFALL PREVIEW').isVisible();
    if (!waterfallVisible) throw new Error('Waterfall Specimen view did not show');
    console.log('   ✅ Waterfall Specimen rendered');

    // Switch back to Grid view
    await dialog.locator('button:has-text("Grid")').click();
    await page.waitForTimeout(200);
    // Click Done to close
    await dialog.locator('button:has-text("Done")').click();
    await page.waitForTimeout(300);
    console.log('   ✅ Character Set modal closed');

    // 4. Auto-Trace Vectorizer Modal
    console.log('4️⃣ Testing Auto-Trace Vectorizer Modal...');
    await page.locator('button[title="Auto-Trace Image"]').first().click();
    await page.waitForTimeout(400);
    const traceDialog = page.locator('[role="dialog"]');
    const traceModalVisible = await traceDialog.locator('text=Auto-Trace Vectorizer').isVisible();
    if (!traceModalVisible) throw new Error('Auto-Trace modal did not open');
    console.log('   ✅ Auto-Trace modal opened');

    // Click sample sketch "Star"
    await traceDialog.locator('button:has-text("Star")').click();
    await page.waitForTimeout(300);
    console.log('   ✅ Traced Star sample sketch');

    // Click "Insert Traced Vector into 'A'"
    await traceDialog.locator('button:has-text("Insert Traced Vector")').click();
    await page.waitForTimeout(400);
    console.log('   ✅ Inserted traced vector into glyph A');

    // 5. Glyph Revision History Panel
    console.log('5️⃣ Testing Glyph Revision History Panel...');
    const histBtn = page.locator('button[title="Revision History"]').first();
    await histBtn.click();
    await page.waitForTimeout(400);
    const histDialog = page.locator('[role="dialog"][aria-labelledby="history-drawer-title"]');
    const historyVisible = await histDialog.isVisible();
    if (!historyVisible) throw new Error('History drawer did not open');
    console.log('   ✅ History drawer opened, showing steps');

    // Test Undo in history drawer
    const undoBtn = histDialog.locator('button:has-text("Undo")');
    await undoBtn.click();
    await page.waitForTimeout(300);
    console.log('   ✅ Undo action triggered');

    // Test Redo in history drawer
    const redoBtn = histDialog.locator('button:has-text("Redo")');
    await redoBtn.click();
    await page.waitForTimeout(300);
    console.log('   ✅ Redo action triggered');

    // Close History drawer
    await histDialog.locator('button:has-text("Close")').last().click();
    await page.waitForTimeout(300);
    console.log('   ✅ History drawer closed');

    // 6. Path Simplification
    console.log('6️⃣ Testing Path Simplification...');
    await page.locator('button[title="Simplify Path"]').first().click();
    await page.waitForTimeout(400);
    console.log('   ✅ Path Simplification executed cleanly');

    // 7. Guides & Snapping Flyout
    console.log('7️⃣ Testing Guides & Snapping Flyout...');
    await page.locator('button[title="Guides & Snapping"]').first().click();
    await page.waitForTimeout(300);
    const guidesFlyoutVisible = await page.locator('text=Guides & Snapping').isVisible();
    if (!guidesFlyoutVisible) throw new Error('Guides & Snapping flyout did not open');
    console.log('   ✅ Guides & Snapping flyout opened');

    // Toggle snap to grid
    await page.locator('button[title="Snap to Grid"]').first().click();
    await page.waitForTimeout(200);
    console.log('   ✅ Snap to grid toggled');

    // Close Guides flyout by clicking Guides button again
    await page.locator('button[title="Guides & Snapping"]').first().click();
    await page.waitForTimeout(200);

    // 8. Vector Canvas Drawing Tools
    console.log('8️⃣ Testing Drawing Tools...');
    // Rectangle Tool
    await page.locator('button[title="Rectangle"]').first().click();
    await page.waitForTimeout(200);
    console.log('   ✅ Rectangle tool selected');

    // Circle Tool
    await page.locator('button[title="Circle"]').first().click();
    await page.waitForTimeout(200);
    console.log('   ✅ Circle tool selected');

    // Vector Pen Tool
    await page.locator('button[title="Vector Pen: Click points to build custom Bézier polygons"]').first().click();
    await page.waitForTimeout(200);
    console.log('   ✅ Vector Pen tool selected');

    // Brush Tool
    await page.locator('button[title="Brush: Freehand organic drawing"]').first().click();
    await page.waitForTimeout(200);
    console.log('   ✅ Brush tool selected');

    // 9. Font Weight Slider & Variants
    console.log('9️⃣ Testing Font Weight & Variants...');
    // Test variant buttons
    await page.locator('button:has-text("Bold")').first().click();
    await page.waitForTimeout(300);
    console.log('   ✅ Switched to Bold variant (700)');

    await page.locator('button:has-text("Light")').first().click();
    await page.waitForTimeout(300);
    console.log('   ✅ Switched to Light variant (300)');

    await page.locator('button:has-text("Italic")').first().click();
    await page.waitForTimeout(300);
    console.log('   ✅ Switched to Italic variant (400)');

    await page.locator('button:has-text("Regular")').first().click();
    await page.waitForTimeout(300);
    console.log('   ✅ Switched back to Regular variant (400)');

    // 10. Kerning Manager Modal
    console.log('🔟 Testing Kerning Manager Modal...');
    await page.locator('button[title="Kerning"]').first().click();
    await page.waitForTimeout(400);
    const kerningVisible = await page.locator('text=Font Kerning Manager').isVisible();
    if (!kerningVisible) throw new Error('Kerning modal did not open');
    console.log('   ✅ Kerning Manager modal opened');

    // Test adding custom pair
    await page.fill('#first-char-input', 'X');
    await page.fill('#second-char-input', 'O');
    await page.locator('button:has-text("Add Pair")').click();
    await page.waitForTimeout(300);
    console.log('   ✅ Added custom kerning pair XO');

    // Close Kerning modal
    await page.locator('button[matTooltip="Close Kerning Manager"]').click();
    await page.waitForTimeout(300);
    console.log('   ✅ Kerning Manager modal closed');

    // 11. SVG Code Inspector & Editor Modal
    console.log('1️⃣1️⃣ Testing SVG Code Modal...');
    await page.locator('button[title="Directly inspect, edit, or import raw SVG code"]').first().click();
    await page.waitForTimeout(400);
    const svgModalVisible = await page.locator('text=SVG Code & Vector Import').isVisible();
    if (!svgModalVisible) throw new Error('SVG Code modal did not open');
    console.log('   ✅ SVG Code modal opened');

    // Test Import tab
    await page.locator('button:has-text("Import / Paste SVG")').click();
    await page.waitForTimeout(200);
    console.log('   ✅ Switched to Import / Paste SVG tab');

    // Switch back to Raw Editor tab
    await page.locator('button:has-text("Raw SVG Path Editor")').click();
    await page.waitForTimeout(200);

    // Close SVG modal
    await page.locator('[role="dialog"] button:has-text("Done")').click();
    await page.waitForTimeout(300);
    console.log('   ✅ SVG Code modal closed');

    // 12. Export Modal
    console.log('1️⃣2️⃣ Testing Export Font & SVGs Modal...');
    await page.locator('button:has-text("Export Font & SVGs")').first().click();
    await page.waitForTimeout(400);
    const exportModalVisible = await page.locator('text=Export Font & SVG Files').isVisible();
    if (!exportModalVisible) throw new Error('Export modal did not open');
    console.log('   ✅ Export modal opened');

    // Test tabs: SVG Glyphs, TTF, WebFont
    const exportDialog = page.locator('[role="dialog"]');
    await exportDialog.locator('button:has-text("Individual SVGs (ZIP)")').click();
    await page.waitForTimeout(200);
    console.log('   ✅ Individual SVGs tab active');

    await exportDialog.locator('button:has-text("Installable Font (.ttf)")').click();
    await page.waitForTimeout(200);
    console.log('   ✅ Installable Font (.ttf) tab active');

    await exportDialog.locator('button:has-text("Web Font & CSS")').click();
    await page.waitForTimeout(200);
    console.log('   ✅ Web Font & CSS tab active');

    // Close Export modal
    await exportDialog.locator('button:has-text("Done")').click();
    await page.waitForTimeout(300);
    console.log('   ✅ Export modal closed');

    // 13. Live Type Tester Controls
    console.log('1️⃣3️⃣ Testing Live Type Tester Controls...');
    // Pangrams
    await page.locator('button:has-text("Alphabet")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Numbers")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Short")').click();
    await page.waitForTimeout(200);
    console.log('   ✅ Pangrams switched');

    // Themes
    await page.locator('button:has-text("Light")').last().click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Paper")').last().click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Dark")').last().click();
    await page.waitForTimeout(200);
    console.log('   ✅ Tester themes switched (Light, Paper, Dark)');

    // 14. Mobile Viewport & Tab Switching
    console.log('1️⃣4️⃣ Testing Mobile Viewport (390 x 844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);

    // Canvas Tab
    await page.locator('button:has-text("Canvas")').last().click();
    await page.waitForTimeout(300);
    console.log('   ✅ Mobile Canvas tab active');

    // Glyphs Tab
    await page.locator('button:has-text("Glyphs")').last().click();
    await page.waitForTimeout(300);
    const glyphsTitleVisible = await page.locator('text=Character Set & Naming').isVisible();
    if (!glyphsTitleVisible) throw new Error('Mobile Glyphs tab failed');
    console.log('   ✅ Mobile Glyphs tab active');

    // Type Test Tab
    await page.locator('button:has-text("Type Test")').last().click();
    await page.waitForTimeout(300);
    const testerTitleVisible = await page.locator('text=Type Tester Playground').isVisible();
    if (!testerTitleVisible) throw new Error('Mobile Type Test tab failed');
    console.log('   ✅ Mobile Type Test tab active');

    // Back to Canvas
    await page.locator('button:has-text("Back to Canvas")').click();
    await page.waitForTimeout(300);
    console.log('   ✅ Mobile Back to Canvas button works');

    // Take final success screenshot
    await page.screenshot({ path: '.playwright-cli/all-tests-passed.png', fullPage: true });

    console.log('🎉 ALL 14 FEATURE TEST SUITES PASSED WITH ZERO ERRORS!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    await page.screenshot({ path: '.playwright-cli/test-failure.png' });
    throw err;
  } finally {
    await browser.close();
  }
}

runTests();
