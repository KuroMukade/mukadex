export enum TokenType {
    // Single-character tokens.
    LEFT_PAREN = "LEFT_PAREN",
    RIGHT_PAREN = "RIGHT_PAREN",
    LEFT_BRACE = "LEFT_BRACE",
    RIGHT_BRACE = "RIGHT_BRACE",
    COMMA = "COMMA",
    DOT = "DOT",
    MINUS = "MINUS",
    PLUS = "PLUS",
    SEMICOLON = "SEMICOLON",
    SLASH = "SLASH",
    STAR = "STAR",

    // One or two character tokens.
    BANG = "BANG",
    BANG_EQUAL = "BANG_EQUAL",
    EQUAL = "EQUAL",
    EQUAL_EQUAL = "EQUAL_EQUAL",
    GREATER = "GREATER",
    GREATER_EQUAL = "GREATER_EQUAL",
    LESS = "LESS",
    LESS_EQUAL = "LESS_EQUAL",

    // Literals.
    IDENTIFIER = "IDENTIFIER",
    STRING = "STRING",
    NUMBER = "NUMBER",

    // Keywords.
    AND = "AND",
    CLASS = "CLASS",
    ELSE = "ELSE",
    FUN = "FUN",
    FOR = "FOR",
    IF = "IF",
    NIL = "NIL",
    OR = "OR",
    PRINT = "PRINT",
    RETURN = "RETURN",
    SUPER = "SUPER",
    THIS = "THIS",
    FALSE = "FALSE",
    TRUE = "TRUE",
    VAR = "VAR",
    WHILE = "WHILE",
    EOF = "EOF",
};