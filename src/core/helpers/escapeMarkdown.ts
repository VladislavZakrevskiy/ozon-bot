export function escapeMarkdown(text: string) {
  const escapeChars = [
    '_',
    '*',
    '[',
    ']',
    '(',
    ')',
    '~',
    // '`',
    '>',
    '#',
    '+',
    '-',
    '=',
    '|',
    '{',
    '}',
    '.',
    '!',
  ];
  let escapedText = text;

  escapeChars.forEach((char) => {
    const escapedChar = '\\' + char;
    const regex = new RegExp(`\\${char}`, 'g');
    escapedText = escapedText.replace(regex, escapedChar);
  });

  return escapedText;
}
