import dedent from 'dedent-js';

import { FormatFn } from 'src/sqlFormatter';

export default function supportsNewlineBeforeSemicolon(format: FormatFn) {
  it('formats lonely semicolon', () => {
    expect(format(';')).toBe(';');
  });

  it('does not add newline before lonely semicolon when newlineBeforeSemicolon:true', () => {
    expect(format(';', { newlineBeforeSemicolon: true })).toBe(';');
  });

  it('defaults to semicolon on end of last line', () => {
    const result = format(`SELECT a FROM b;`);
    expect(result).toBe(dedent`
      SELECT
        a
      FROM
        b;
    `);
  });

  it('supports semicolon on separate line', () => {
    const result = format(`SELECT a FROM b;`, { newlineBeforeSemicolon: true });
    expect(result).toBe(dedent`
      SELECT
        a
      FROM
        b
      ;
    `);
  });

  // the nr of empty lines here depends on linesBetweenQueries option
  it('formats multiple lonely semicolons', () => {
    expect(format(';;;')).toBe(dedent`
      ;

      ;

      ;
    `);
  });

  it('does not introduce extra empty lines between semicolons when newlineBeforeSemicolon:true', () => {
    expect(format(';;;', { newlineBeforeSemicolon: true })).toBe(dedent`
      ;

      ;

      ;
    `);
  });
}
