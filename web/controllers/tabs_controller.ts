import { Controller } from '@hotwired/stimulus';

export default class TabsController extends Controller {
  static targets = ['tab', 'panel'];

  declare tabTargets: HTMLAnchorElement[];
  declare panelTargets: HTMLElement[];

  connect() {
    // Handle initial hash on page load
    this.handleHashChange();

    // Listen for hash changes (back/forward buttons)
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  disconnect() {
    window.removeEventListener('hashchange', () => this.handleHashChange());
  }

  handleHashChange() {
    const hash = window.location.hash.slice(1); // Remove leading #
    if (!hash) {
      this.activateTab('home');
      return;
    }

    // Parse hash: could be "home", "try", "doc", or "doc/section-name"
    const [tabName, section] = hash.split('/');

    if (['home', 'try', 'doc'].includes(tabName)) {
      this.activateTab(tabName, section);
    } else {
      // Unknown hash, default to home
      this.activateTab('home');
    }
  }

  switch(event: Event) {
    event.preventDefault();
    const target = event.currentTarget as HTMLAnchorElement;
    const tabName = target.dataset.tab;

    if (tabName) {
      // Update URL hash (this will trigger hashchange and activateTab)
      window.location.hash = tabName;
    }
  }

  activateTab(tabName: string, section?: string) {
    // Update tab active states
    this.tabTargets.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Show/hide panels
    this.panelTargets.forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.panel !== tabName);
    });

    // If there's a section, scroll to it after a brief delay (for DOM to update)
    if (section && tabName === 'doc') {
      setTimeout(() => {
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }
}
