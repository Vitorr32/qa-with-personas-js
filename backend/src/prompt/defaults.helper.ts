import { readFileSync } from 'fs';
import { join } from 'path';

export function loadDefaultPrompts(): { mainPrompt: string; analystPrompt: string; temperature: number } {
  const baseDir = process.cwd();
  const defaultsDir = join(baseDir, 'defaults');

  const read = (name: string, fallback: string) => {
    try {
      const content = readFileSync(join(defaultsDir, name), 'utf8');
      return content.trim();
    } catch {
      return fallback;
    }
  };

  const mainPrompt = read(
    'default-main-prompt.txt',
    'You are a helpful assistant representing a specific persona. Answer concisely and stay aligned with the persona description.'
  );
  const analystPrompt = read(
    'default-analyst-prompt.txt',
    'You analyze multiple persona responses and produce a balanced, structured synthesis with key themes, disagreements, and actionable insights.'
  );

  return {
    mainPrompt,
    analystPrompt,
    temperature: 0.7,
  };
}
