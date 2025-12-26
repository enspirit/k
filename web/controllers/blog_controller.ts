import { Controller } from '@hotwired/stimulus';

export default class BlogController extends Controller {
  static targets = ['post'];

  declare postTargets: HTMLElement[];

  connect() {
    // All posts closed by default
    this.postTargets.forEach((post) => {
      post.classList.remove('open');
    });
  }

  toggle(event: Event) {
    const header = event.currentTarget as HTMLElement;
    const post = header.closest('[data-blog-target="post"]') as HTMLElement;

    if (post) {
      post.classList.toggle('open');
    }
  }
}
