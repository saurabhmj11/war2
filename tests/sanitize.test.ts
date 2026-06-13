import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../src/lib/sanitize';

describe('sanitizeHtml - XSS Prevention', () => {
  it('escapes script injection', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('hello');
  });

  it('escapes HTML event handlers', () => {
    const result = sanitizeHtml('<img onerror="alert(1)" src="x">');
    // The tag is HTML-entity escaped — no executable code possible
    expect(result).not.toContain('<img');                  // no raw tag
    expect(result).not.toContain('onerror="');            // no raw attribute
    expect(result).toContain('&lt;img');                   // safely escaped
  });

  it('escapes angle brackets', () => {
    const result = sanitizeHtml('<b>bold</b>');
    expect(result).toContain('&lt;b&gt;');
    expect(result).not.toContain('<b>');
  });

  it('converts **bold** to safe <strong> tags', () => {
    const result = sanitizeHtml('This is **important**');
    expect(result).toContain('<strong>important</strong>');
  });

  it('converts newlines to <br> tags', () => {
    const result = sanitizeHtml('Line 1\nLine 2');
    expect(result).toContain('<br>');
  });

  it('handles ampersands safely', () => {
    const result = sanitizeHtml('A & B');
    expect(result).toContain('&amp;');
    expect(result).not.toMatch(/[^&]&[^a-z#]/); // no raw & except in entity refs
  });

  it('handles double-quote injection', () => {
    const result = sanitizeHtml('"quoted"');
    expect(result).toContain('&quot;');
  });

  it('handles single-quote injection', () => {
    const result = sanitizeHtml("'quoted'");
    expect(result).toContain('&#x27;');
  });

  it('handles normal AI response text correctly', () => {
    const result = sanitizeHtml(
      "I noticed you mentioned **Physics**. That sounds stressful.\nWould you like to talk about it?"
    );
    expect(result).toContain('<strong>Physics</strong>');
    expect(result).toContain('<br>');
    expect(result).toContain("I noticed you mentioned");
  });

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('prevents CSS injection', () => {
    const result = sanitizeHtml('<style>body{display:none}</style>');
    expect(result).not.toContain('<style>');
  });

  it('prevents iframe injection', () => {
    const result = sanitizeHtml('<iframe src="evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
  });
});
