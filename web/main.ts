import { Application } from '@hotwired/stimulus';
import PlaygroundController from './controllers/playground_controller';
import TabsController from './controllers/tabs_controller';
import DocController from './controllers/doc_controller';
import StdlibSearchController from './controllers/stdlib_search_controller';
import { highlightAll, highlightAllJS } from './highlighter';

// Apply theme immediately (before Stimulus starts) to avoid flash
const storedTheme = localStorage.getItem('elo-theme');
const isLightMode = storedTheme ? storedTheme === 'light' : true;
if (isLightMode) {
  document.body.classList.add('light-theme');
}

// Start Stimulus application
const application = Application.start();

// Expose Stimulus for cross-controller communication
(window as any).Stimulus = application;

// Register controllers
application.register('playground', PlaygroundController);
application.register('tabs', TabsController);
application.register('doc', DocController);
application.register('stdlib-search', StdlibSearchController);

// Theme toggle functionality (theme already applied at top of file)
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle?.querySelector('.theme-icon');

  updateIcon();

  // Toggle handler
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('elo-theme', isLight ? 'light' : 'dark');
    updateIcon();
  });

  function updateIcon() {
    if (themeIcon) {
      const isLight = document.body.classList.contains('light-theme');
      // Show sun in dark mode (switch to light), moon in light mode (switch to dark)
      themeIcon.innerHTML = isLight ? '&#9790;' : '&#9728;';
    }
  }
}

// Apply syntax highlighting to all code examples
document.addEventListener('DOMContentLoaded', () => {
  highlightAll('.example-code');
  highlightAllJS('.code-js');
  initTheme();
});
