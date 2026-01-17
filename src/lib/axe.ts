/**
 * Accessibility Testing Configuration
 * axe-core for development mode only
 * Runs on page load in development to catch accessibility issues early
 */

export async function initializeAccessibilityTesting() {
  // Only run in development mode
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const axe = await import('axe-core');
    axe.run(async (error: any, results: any) => {
      if (error) {
        console.error('Accessibility testing error:', error);
        return;
      }

      if (results.violations.length > 0) {
        console.warn('🚨 Accessibility violations found:');
        results.violations.forEach((violation: any) => {
          console.warn(`\n❌ ${violation.id}: ${violation.description}`);
          console.warn(`   Impact: ${violation.impact}`);
          console.warn(`   Elements: ${violation.nodes.length}`);
          violation.nodes.forEach((node: any) => {
            console.warn(`   - ${node.html}`);
          });
          console.warn(`   ${violation.helpUrl}`);
        });
      } else {
        console.log('✅ No accessibility violations detected');
      }

      if (results.incomplete.length > 0) {
        console.warn('⚠️ Accessibility checks incomplete:');
        results.incomplete.forEach((check: any) => {
          console.warn(`\n⚠️ ${check.id}: ${check.description}`);
          console.warn(`   ${check.helpUrl}`);
        });
      }
    });
  } catch (error) {
    console.error('Error initializing accessibility testing:', error);
  }
}

// Export function to check accessibility programmatically
export async function checkAccessibility() {
  if (typeof window === 'undefined') return null;

  try {
    const axe = await import('axe-core');
    const results = await new Promise((resolve, reject) => {
      axe.run((error: any, results: any) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    return results;
  } catch (error) {
    console.error('Error running accessibility check:', error);
    return null;
  }
}
