import { Controller } from '@hotwired/stimulus';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import utc from 'dayjs/plugin/utc';
import {
  parse,
  compileToRuby,
  compileToJavaScript,
  compileToSQL,
  getPrelude
} from '@enspirit/elo';
import type { PreludeTarget } from '@enspirit/elo';
import { elo } from '../codemirror/elo-language';
import { eloDarkTheme, eloLightTheme } from '../codemirror/elo-theme';
import { highlightJS, highlightRuby, highlightSQL } from '../highlighter';
import { formatCode } from '../formatters';

// Enable dayjs plugins
dayjs.extend(duration);
dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);
dayjs.extend(utc);

// Make dayjs available globally for eval (used by compiled IIFE helpers)
(window as any).dayjs = dayjs;

type TargetLanguage = 'ruby' | 'javascript' | 'sql';

export default class PlaygroundController extends Controller {
  static targets = ['editor', 'output', 'language', 'pretty', 'prelude', 'error', 'result', 'copyButton', 'saveButton', 'runButton'];

  declare editorTarget: HTMLDivElement;
  declare outputTarget: HTMLPreElement;
  declare languageTarget: HTMLSelectElement;
  declare prettyTarget: HTMLInputElement;
  declare preludeTarget: HTMLInputElement;
  declare errorTarget: HTMLDivElement;
  declare resultTarget: HTMLDivElement;
  declare copyButtonTarget: HTMLButtonElement;
  declare saveButtonTarget: HTMLButtonElement;
  declare runButtonTarget: HTMLButtonElement;

  private editorView: EditorView | null = null;
  private themeObserver: MutationObserver | null = null;
  private compileVersion = 0;
  private currentOutput = ''; // Raw output for copy/save

  connect() {
    this.initializeEditor();

    // Watch for theme changes on body
    this.themeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          this.reinitializeEditor();
        }
      }
    });
    this.themeObserver.observe(document.body, { attributes: true });

    // Check for code in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      this.setCode(codeFromUrl);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Compile on initial load
    this.compile();

    // Auto-run if requested via URL
    if (urlParams.get('run') === '1' && codeFromUrl) {
      setTimeout(() => this.run(), 100);
    }
  }

  private initializeEditor() {
    const initialCode = this.editorTarget.dataset.initialCode || '';
    const currentCode = this.editorView?.state.doc.toString() || initialCode;
    const isLight = document.body.classList.contains('light-theme');
    const theme = isLight ? eloLightTheme : eloDarkTheme;

    this.editorView = new EditorView({
      state: EditorState.create({
        doc: currentCode,
        extensions: [
          history(),
          bracketMatching(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          elo(),
          ...theme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              this.compile();
            }
          }),
          EditorView.lineWrapping
        ]
      }),
      parent: this.editorTarget
    });
  }

  private reinitializeEditor() {
    if (this.editorView) {
      this.editorView.destroy();
    }
    this.initializeEditor();
  }

  disconnect() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }

  getCode(): string {
    return this.editorView?.state.doc.toString() || '';
  }

  setCode(code: string) {
    if (this.editorView) {
      this.editorView.dispatch({
        changes: { from: 0, to: this.editorView.state.doc.length, insert: code }
      });
    }
  }

  async compile() {
    const version = ++this.compileVersion;
    const input = this.getCode();
    const language = this.languageTarget.value as TargetLanguage;
    const prettyPrint = this.prettyTarget.checked;
    const includePrelude = this.preludeTarget.checked;

    // Hide result when code changes
    this.hideResult();

    // Enable/disable run button based on language
    this.runButtonTarget.disabled = language !== 'javascript';

    if (!input.trim()) {
      this.outputTarget.textContent = '';
      this.currentOutput = '';
      this.hideError();
      return;
    }

    try {
      const ast = parse(input);
      let output = this.compileToLanguage(ast, language);

      // Format the output (pretty print) if enabled
      const formattedOutput = prettyPrint ? await formatCode(output, language) : output;

      // Check if this compilation is still current (race condition handling)
      if (version !== this.compileVersion) return;

      // Build final output with optional prelude
      let finalOutput = formattedOutput;
      if (includePrelude) {
        const preludeTarget: PreludeTarget = language === 'javascript' ? 'javascript' : language as PreludeTarget;
        const prelude = getPrelude(preludeTarget);
        if (prelude) {
          finalOutput = `${prelude}\n\n${formattedOutput}`;
        }
      }

      // Store raw output for copy/save
      this.currentOutput = finalOutput;

      // Apply syntax highlighting based on language
      this.outputTarget.innerHTML = this.highlightOutput(finalOutput, language);
      this.hideError();
    } catch (error) {
      if (version !== this.compileVersion) return;
      this.outputTarget.innerHTML = '';
      this.currentOutput = '';
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }

  run() {
    const input = this.getCode();

    if (!input.trim()) {
      return;
    }

    try {
      const ast = parse(input);
      const jsCode = compileToJavaScript(ast);

      // Evaluate the JavaScript code
      const result = eval(jsCode);

      // Display the result
      this.showResult(this.formatResult(result));
      this.hideError();
    } catch (error) {
      this.hideResult();
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }

  async copy() {
    if (!this.currentOutput) return;

    try {
      await navigator.clipboard.writeText(this.currentOutput);
      // Brief visual feedback
      const btn = this.copyButtonTarget;
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1000);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.currentOutput;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  save() {
    if (!this.currentOutput) return;

    const language = this.languageTarget.value as TargetLanguage;
    const extensions: Record<TargetLanguage, string> = {
      javascript: 'js',
      ruby: 'rb',
      sql: 'sql'
    };

    const blob = new Blob([this.currentOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elo-output.${extensions[language]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private formatResult(value: any): string {
    if (value === undefined) {
      return 'undefined';
    }
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    // Handle dayjs objects
    if (value && typeof value === 'object' && value.$d instanceof Date) {
      return value.format();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }

  private compileToLanguage(ast: ReturnType<typeof parse>, language: TargetLanguage): string {
    switch (language) {
      case 'ruby':
        return compileToRuby(ast);
      case 'javascript':
        return compileToJavaScript(ast);
      case 'sql':
        return compileToSQL(ast);
      default:
        return '';
    }
  }

  private highlightOutput(code: string, language: TargetLanguage): string {
    switch (language) {
      case 'javascript':
        return highlightJS(code);
      case 'ruby':
        return highlightRuby(code);
      case 'sql':
        return highlightSQL(code);
      default:
        return code;
    }
  }

  private showResult(message: string) {
    this.resultTarget.textContent = `Result: ${message}`;
    this.resultTarget.classList.add('visible');
  }

  private hideResult() {
    this.resultTarget.textContent = '';
    this.resultTarget.classList.remove('visible');
  }

  private showError(message: string) {
    this.errorTarget.textContent = message;
    this.errorTarget.classList.add('visible');
  }

  private hideError() {
    this.errorTarget.textContent = '';
    this.errorTarget.classList.remove('visible');
  }
}
