import { Controller } from '@hotwired/stimulus';

// Get base URL at build time
const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default class DocController extends Controller {
  tryExample(event: Event) {
    const target = event.currentTarget as HTMLElement;
    const codeElement = target.querySelector('.example-code') || target.querySelector('.comparison-code');

    if (!codeElement) return;

    const code = (codeElement.textContent || '').trim();

    // Navigate to playground with code as URL parameter
    const encodedCode = encodeURIComponent(code);
    window.location.href = `${BASE_URL}/try?code=${encodedCode}&run=1`;
  }
}
