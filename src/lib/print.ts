/* Petty — print = PDF export, honestly. Renders the letter text black-on-white
 * into an isolated #print-root (the app chrome is hidden via print CSS), honors
 * the file the user just built, and cleans up on afterprint. */
export function printDocument(title: string, text: string): void {
  if (typeof document === 'undefined') return;
  document.getElementById('print-root')?.remove();
  const root = document.createElement('pre');
  root.id = 'print-root';
  root.textContent = text;
  document.body.appendChild(root);
  const prevTitle = document.title;
  document.title = title;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    root.remove();
    document.title = prevTitle;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  window.setTimeout(cleanup, 120_000);
}
