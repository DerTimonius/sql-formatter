import { format as originalFormat, FormatFn } from 'src/sqlFormatter';
import MariaDbFormatter from 'src/languages/mariadb.formatter';
import behavesLikeMariaDbFormatter from './behavesLikeMariaDbFormatter';

import supportsOperators from './features/operators';
import supportsReturning from './features/returning';

describe('MariaDbFormatter', () => {
  const language = 'mariadb';
  const format: FormatFn = (query, cfg = {}) => originalFormat(query, { ...cfg, language });

  behavesLikeMariaDbFormatter(format);

  supportsOperators(format, MariaDbFormatter.operators, ['AND', 'OR', 'XOR']);
  supportsReturning(format);
});
