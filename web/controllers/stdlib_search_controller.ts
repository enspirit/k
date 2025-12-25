import { Controller } from '@hotwired/stimulus';

export default class StdlibSearchController extends Controller {
  static targets = ['input', 'grid', 'clearButton'];

  declare inputTarget: HTMLInputElement;
  declare gridTargets: HTMLElement[];
  declare clearButtonTarget: HTMLButtonElement;
  declare hasClearButtonTarget: boolean;

  filter() {
    const query = this.inputTarget.value.toLowerCase().trim();

    // Show/hide clear button based on input
    if (this.hasClearButtonTarget) {
      this.clearButtonTarget.style.display = query ? 'block' : 'none';
    }

    this.gridTargets.forEach((grid) => {
      const cards = grid.querySelectorAll('.stdlib-fn');

      cards.forEach((card) => {
        const name = card.querySelector('.fn-name')?.textContent?.toLowerCase() || '';
        const desc = card.querySelector('.fn-desc')?.textContent?.toLowerCase() || '';

        const matches = query === '' || name.includes(query) || desc.includes(query);
        (card as HTMLElement).style.display = matches ? '' : 'none';
      });
    });
  }

  clear() {
    this.inputTarget.value = '';
    this.filter();
    this.inputTarget.focus();
  }
}
