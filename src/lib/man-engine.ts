import { BUNDLED_MAN_PAGES, ManPage } from '../data/man';

export type { ManPage };

/**
 * Retrieves a bundled manual page by command name.
 * Case-insensitive and strips arguments/whitespace if provided.
 */
export function getManPage(command: string): ManPage | null {
  if (!command || typeof command !== 'string') return null;
  const cleanCmd = command.trim().toLowerCase().split(/\s+/)[0];
  return BUNDLED_MAN_PAGES[cleanCmd] || null;
}

/**
 * Returns all bundled manual pages.
 */
export function getAllManPages(): ManPage[] {
  return Object.values(BUNDLED_MAN_PAGES);
}

/**
 * Searches manual pages by keyword query across command, title, description,
 * options and examples.
 */
export function searchManPages(query: string): ManPage[] {
  if (!query || !query.trim()) return getAllManPages();
  const q = query.trim().toLowerCase();
  return getAllManPages().filter((page) => {
    return (
      page.command.toLowerCase().includes(q) ||
      page.title.toLowerCase().includes(q) ||
      page.description.toLowerCase().includes(q) ||
      page.synopsis.toLowerCase().includes(q) ||
      page.options.some((opt) => opt.toLowerCase().includes(q)) ||
      page.examples.some((ex) => ex.toLowerCase().includes(q))
    );
  });
}
