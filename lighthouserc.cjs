// Lighthouse CI: lab Core Web Vitals and category scores on the BUILT site (mobile profile, simulated slow 4G), run in CI.
// Thresholds mirror .cursor/rules/performance.mdc. A drop below them fails the pipeline.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // Representative templates: home, the calendar, the booking form, the story, the shop and a product.
      url: ['/index.html', '/calendar/index.html', '/book/index.html', '/our-story/index.html', '/faqs/index.html', '/shop/index.html', '/shop/house-blend/index.html'],
      numberOfRuns: 2,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'uses-responsive-images': 'warn',
        'unsized-images': 'error',
        'meta-description': 'error',
        'document-title': 'error',
        canonical: 'error',
        'is-crawlable': 'error',
        'image-alt': 'error',
        'heading-order': 'error',
        'link-name': 'error',
        'color-contrast': 'error',
        'target-size': 'error',
        viewport: 'error',
        'is-on-https': 'off',
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
