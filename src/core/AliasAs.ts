import type { AliasMode } from 'src/types';

import { isCommand, isToken, type Token, TokenType } from './token';

export interface TokenStream {
  isWithinSelect(): boolean;
  getPreviousReservedToken(): Token;
  tokenLookBehind(n?: number): Token;
  tokenLookAhead(n?: number): Token;
}

/** Decides addition and removal of AS tokens */
export default class AliasAs {
  constructor(private aliasAs: AliasMode, private formatter: TokenStream) {}

  /** True when AS keyword should be added *before* current token */
  public shouldAddBefore(token: Token): boolean {
    return this.isMissingTableAlias(token) || this.isMissingSelectColumnAlias(token);
  }

  // if table alias is missing and should be added
  private isMissingTableAlias(token: Token): boolean {
    return (
      this.aliasAs === 'always' && token.type === TokenType.IDENT && this.lookBehind().value === ')'
    );
  }

  // if select column alias is missing and should be added
  private isMissingSelectColumnAlias(token: Token): boolean {
    const prevToken = this.lookBehind();
    const nextToken = this.lookAhead();
    return (
      (this.aliasAs === 'always' || this.aliasAs === 'select') &&
      this.formatter.isWithinSelect() &&
      token.type === TokenType.IDENT &&
      (isToken.END(prevToken) ||
        ((prevToken.type === TokenType.IDENT || prevToken.type === TokenType.NUMBER) &&
          (nextToken.value === ',' || isCommand(nextToken))))
    );
  }

  /** True when AS keyword should be added *after* current token */
  public shouldAddAfter(): boolean {
    return this.isEdgeCaseCTE() || this.isEdgeCaseCreateTable() || this.isMissingTypeCastAs();
  }

  // checks for CAST(«expression» [AS] type)
  private isMissingTypeCastAs(): boolean {
    return (
      this.aliasAs === 'never' &&
      this.formatter.isWithinSelect() &&
      isToken.CAST(this.formatter.getPreviousReservedToken()) &&
      isToken.AS(this.lookAhead()) &&
      (this.lookAhead(2).type === TokenType.IDENT ||
        this.lookAhead(2).type === TokenType.RESERVED_KEYWORD) &&
      this.lookAhead(3).value === ')'
    );
  }

  // checks for WITH `table` [AS] (
  private isEdgeCaseCTE(): boolean {
    const nextToken = this.lookAhead();
    return (
      this.aliasAs === 'never' &&
      isToken.WITH(this.lookBehind()) &&
      (nextToken.value === '(' || (isToken.AS(nextToken) && this.lookAhead(2).value === '('))
    );
  }

  // checks for CREATE TABLE `table` [AS] WITH (
  private isEdgeCaseCreateTable(): boolean {
    const prevToken = this.lookBehind();
    const nextToken = this.lookAhead();
    return (
      this.aliasAs === 'never' &&
      (isToken.TABLE(prevToken) || prevToken.value.endsWith('TABLE')) &&
      (isToken.WITH(nextToken) || (isToken.AS(nextToken) && isToken.WITH(this.lookAhead(2))))
    );
  }

  /* True when the current AS token should be discarded */
  public shouldRemove(): boolean {
    return this.aliasAs === 'never' || (this.aliasAs === 'select' && this.isRemovableNonSelectAs());
  }

  private isRemovableNonSelectAs(): boolean {
    return (
      this.lookBehind().value === ')' && // ) [AS] alias but not SELECT (a) [AS] alpha
      !this.formatter.isWithinSelect() &&
      this.lookAhead().value !== '(' // skip WITH foo [AS] ( ...
    );
  }

  private lookBehind(n?: number): Token {
    return this.formatter.tokenLookBehind(n);
  }

  private lookAhead(n?: number): Token {
    return this.formatter.tokenLookAhead(n);
  }
}
