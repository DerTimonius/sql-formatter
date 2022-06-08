import dedent from 'dedent-js';

import { FormatFn } from 'src/sqlFormatter';
import behavesLikeSqlFormatter from './behavesLikeSqlFormatter';

import supportsCreateTable from './features/createTable';
import supportsAlterTable from './features/alterTable';
import supportsBetween from './features/between';
import supportsJoin from './features/join';
import supportsConstraints from './features/constraints';
import supportsDeleteFrom from './features/deleteFrom';
import supportsComments from './features/comments';
import supportsStrings from './features/strings';
import supportsIdentifiers from './features/identifiers';
import supportsParams from './options/param';

/**
 * Shared tests for MySQL and MariaDB
 */
export default function behavesLikeMariaDbFormatter(format: FormatFn) {
  behavesLikeSqlFormatter(format);
  supportsComments(format, { hashComments: true });
  supportsStrings(format, ["''", '""', "X''"]);
  supportsIdentifiers(format, ['``']);
  supportsCreateTable(format);
  supportsConstraints(format);
  supportsAlterTable(format);
  supportsDeleteFrom(format);
  supportsBetween(format);
  supportsJoin(format, {
    without: ['FULL'],
    additionally: [
      'STRAIGHT_JOIN',
      'NATURAL LEFT JOIN',
      'NATURAL LEFT OUTER JOIN',
      'NATURAL RIGHT JOIN',
      'NATURAL RIGHT OUTER JOIN',
    ],
  });
  supportsParams(format, { positional: true });

  // TODO: Disabled for now.
  // Bring these back later by implementing a generic support for variables in all dialects.
  it.skip('supports @variables', () => {
    expect(format('SELECT @foo, @bar')).toBe(dedent`
      SELECT
        @foo,
        @bar
    `);
  });

  it.skip('supports setting variables: @var :=', () => {
    expect(format('SET @foo := (SELECT * FROM tbl);')).toBe(dedent`
      SET
        @foo := (
          SELECT
            *
          FROM
            tbl
        );
    `);
  });

  it('supports @"name", @\'name\', @`name` variables', () => {
    expect(format(`SELECT @"foo fo", @'bar ar', @\`baz zaz\` FROM tbl;`)).toBe(dedent`
      SELECT
        @"foo fo",
        @'bar ar',
        @\`baz zaz\`
      FROM
        tbl;
    `);
  });

  it('supports setting variables: @"var" :=', () => {
    expect(format('SET @"foo" := (SELECT * FROM tbl);')).toBe(dedent`
      SET
        @"foo" := (
          SELECT
            *
          FROM
            tbl
        );
    `);
  });

  // Issue #181
  it('does not wrap CHARACTER SET to multiple lines', () => {
    expect(format('ALTER TABLE t MODIFY col1 VARCHAR(50) CHARACTER SET greek')).toBe(dedent`
      ALTER TABLE
        t MODIFY col1 VARCHAR(50) CHARACTER SET greek
    `);
  });
}
