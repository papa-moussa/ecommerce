/** @type {import('@lhci/cli').LighthouseConfig} */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3002/', 'http://localhost:3002/produits'],
      numberOfRuns: 1,
      settings: {
        // Simulate mobile (Lighthouse default audit device)
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Core quality gates (backlog DoD Sprint 4)
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
        // Specific SEO checks
        'document-title': 'error',
        'meta-description': 'error',
        canonical: 'warn',
        'structured-data': 'warn',
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
