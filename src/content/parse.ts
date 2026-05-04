import type { ContentNode } from "../schema/types.js";

const MENTION_PREFIX = "<@";
const MENTION_BRACED_OPEN = "{";
const MENTION_BRACED_CLOSE = "}>";
const MENTION_CLOSE = ">";
const STRONG_DELIMITER = "**";
const INLINE_CODE_DELIMITER = "`";
const EMPHASIS_DELIMITERS = new Set(["*"]);
const ESCAPABLE_CHARACTERS = new Set(["\\", "*", "_", "`", "<"]);
const TRAILING_URL_PUNCTUATION = new Set([".", ",", "!", "?", ";", ":"]);

export interface ParseContentIssue {
  code: "invalid_content_syntax" | "unsupported_content_syntax";
  message: string;
  offset: number;
}

export interface ParseContentResult {
  ok: boolean;
  nodes: ContentNode[];
  issues: ParseContentIssue[];
}

interface ParseState {
  input: string;
  issues: ParseContentIssue[];
}

interface SequenceResult {
  nodes: ContentNode[];
  index: number;
  closed: boolean;
}

interface ParsedNodeResult {
  node: ContentNode;
  index: number;
}

export function parseContent(input: string): ParseContentResult {
  const state: ParseState = {
    input,
    issues: [],
  };

  if (input.length === 0) {
    state.issues.push({
      code: "invalid_content_syntax",
      message: "content string must not be empty.",
      offset: 0,
    });

    return {
      ok: false,
      nodes: [],
      issues: state.issues,
    };
  }

  const result = parseSequence(state, 0);

  if (state.issues.length > 0) {
    return {
      ok: false,
      nodes: [],
      issues: state.issues,
    };
  }

  return {
    ok: true,
    nodes: compactContentNodes(result.nodes),
    issues: [],
  };
}

function parseSequence(
  state: ParseState,
  startIndex: number,
  terminator?: string,
): SequenceResult {
  const nodes: ContentNode[] = [];
  let textBuffer = "";
  let index = startIndex;

  const flushTextBuffer = (): void => {
    if (textBuffer.length === 0) {
      return;
    }

    nodes.push({
      type: "text",
      value: textBuffer,
    });
    textBuffer = "";
  };

  while (index < state.input.length) {
    if (terminator !== undefined && state.input.startsWith(terminator, index)) {
      flushTextBuffer();

      return {
        nodes: compactContentNodes(nodes),
        index: index + terminator.length,
        closed: true,
      };
    }

    const character = state.input[index]!;

    if (character === "\\") {
      const nextCharacter = state.input[index + 1];

      if (
        nextCharacter !== undefined &&
        ESCAPABLE_CHARACTERS.has(nextCharacter)
      ) {
        textBuffer += nextCharacter;
        index += 2;
        continue;
      }

      textBuffer += character;
      index += 1;
      continue;
    }

    if (character === "\r" || character === "\n") {
      flushTextBuffer();

      if (character === "\r" && state.input[index + 1] === "\n") {
        index += 1;
      }

      nodes.push({ type: "lineBreak" });
      index += 1;
      continue;
    }

    if (state.input.startsWith(MENTION_PREFIX, index)) {
      flushTextBuffer();

      const mentionNode = parseMentionNode(state, index);

      if (mentionNode === null) {
        return {
          nodes: compactContentNodes(nodes),
          index: state.input.length,
          closed: false,
        };
      }

      nodes.push(mentionNode.node);
      index = mentionNode.index;
      continue;
    }

    if (
      character === INLINE_CODE_DELIMITER &&
      canParseInlineCode(state.input, index)
    ) {
      flushTextBuffer();

      const inlineCodeNode = parseInlineCodeNode(state, index);

      if (inlineCodeNode === null) {
        return {
          nodes: compactContentNodes(nodes),
          index: state.input.length,
          closed: false,
        };
      }

      nodes.push(inlineCodeNode.node);
      index = inlineCodeNode.index;
      continue;
    }

    if (
      state.input.startsWith(STRONG_DELIMITER, index) &&
      canOpenDelimitedSpan(state.input, index, STRONG_DELIMITER)
    ) {
      flushTextBuffer();

      const strongNode = parseDelimitedNode(
        state,
        index,
        STRONG_DELIMITER,
        "strong",
      );

      if (strongNode === null) {
        return {
          nodes: compactContentNodes(nodes),
          index: state.input.length,
          closed: false,
        };
      }

      nodes.push(strongNode.node);
      index = strongNode.index;
      continue;
    }

    if (
      EMPHASIS_DELIMITERS.has(character) &&
      canOpenDelimitedSpan(state.input, index, character)
    ) {
      flushTextBuffer();

      const emphasisNode = parseDelimitedNode(
        state,
        index,
        character,
        "emphasis",
      );

      if (emphasisNode === null) {
        return {
          nodes: compactContentNodes(nodes),
          index: state.input.length,
          closed: false,
        };
      }

      nodes.push(emphasisNode.node);
      index = emphasisNode.index;
      continue;
    }

    const linkNode = parseLinkNode(state.input, index);

    if (linkNode !== null) {
      flushTextBuffer();
      nodes.push(linkNode.node);
      index = linkNode.index;
      continue;
    }

    textBuffer += character;
    index += 1;
  }

  flushTextBuffer();

  return {
    nodes: compactContentNodes(nodes),
    index,
    closed: false,
  };
}

function parseMentionNode(
  state: ParseState,
  startIndex: number,
): ParsedNodeResult | null {
  const valueStartIndex = startIndex + MENTION_PREFIX.length;
  const usesLegacyBraces =
    state.input[valueStartIndex] === MENTION_BRACED_OPEN;
  const rawValueStartIndex = usesLegacyBraces
    ? valueStartIndex + MENTION_BRACED_OPEN.length
    : valueStartIndex;
  const closeToken = usesLegacyBraces ? MENTION_BRACED_CLOSE : MENTION_CLOSE;
  const closeIndex = state.input.indexOf(closeToken, rawValueStartIndex);

  if (closeIndex === -1) {
    pushInvalidSyntaxIssue(
      state,
      startIndex,
      `Unclosed mention token starting at character ${startIndex + 1}.`,
    );
    return null;
  }

  const rawValue = state.input.slice(rawValueStartIndex, closeIndex).trim();

  if (rawValue.length === 0) {
    pushInvalidSyntaxIssue(
      state,
      startIndex,
      `Mention token must contain a non-empty name at character ${startIndex + 1}.`,
    );
    return null;
  }

  return {
    node: {
      type: "mention",
      value: rawValue.startsWith("@") ? rawValue : `@${rawValue}`,
    },
    index: closeIndex + closeToken.length,
  };
}

function parseInlineCodeNode(
  state: ParseState,
  startIndex: number,
): ParsedNodeResult | null {
  const closeIndex = state.input.indexOf(
    INLINE_CODE_DELIMITER,
    startIndex + INLINE_CODE_DELIMITER.length,
  );

  if (closeIndex === -1) {
    pushInvalidSyntaxIssue(
      state,
      startIndex,
      `Unclosed inline code marker at character ${startIndex + 1}.`,
    );
    return null;
  }

  return {
    node: {
      type: "inlineCode",
      value: state.input.slice(
        startIndex + INLINE_CODE_DELIMITER.length,
        closeIndex,
      ),
    },
    index: closeIndex + INLINE_CODE_DELIMITER.length,
  };
}

function parseDelimitedNode(
  state: ParseState,
  startIndex: number,
  delimiter: string,
  nodeType: "strong" | "emphasis",
): ParsedNodeResult | null {
  const initialIssueCount = state.issues.length;
  const innerSequence = parseSequence(
    state,
    startIndex + delimiter.length,
    delimiter,
  );

  if (!innerSequence.closed) {
    if (state.issues.length === initialIssueCount) {
      pushInvalidSyntaxIssue(
        state,
        startIndex,
        `Unclosed ${nodeType} marker "${delimiter}" at character ${startIndex + 1}.`,
      );
    }

    return null;
  }

  return {
    node:
      nodeType === "strong"
        ? {
            type: "strong",
            children: innerSequence.nodes,
          }
        : {
            type: "emphasis",
            children: innerSequence.nodes,
          },
    index: innerSequence.index,
  };
}

function canParseInlineCode(input: string, startIndex: number): boolean {
  return (
    input.indexOf(
      INLINE_CODE_DELIMITER,
      startIndex + INLINE_CODE_DELIMITER.length,
    ) !== -1
  );
}

function canOpenDelimitedSpan(
  input: string,
  startIndex: number,
  delimiter: string,
): boolean {
  const contentStartIndex = startIndex + delimiter.length;
  const firstContentCharacter = input[contentStartIndex];

  if (
    firstContentCharacter === undefined ||
    isWhitespace(firstContentCharacter)
  ) {
    return false;
  }

  const closeIndex = input.indexOf(delimiter, contentStartIndex);

  if (closeIndex === -1) {
    return false;
  }

  const lastContentCharacter = input[closeIndex - 1];

  return (
    lastContentCharacter !== undefined && !isWhitespace(lastContentCharacter)
  );
}

function parseLinkNode(
  input: string,
  startIndex: number,
): ParsedNodeResult | null {
  if (
    !input.startsWith("http://", startIndex) &&
    !input.startsWith("https://", startIndex)
  ) {
    return null;
  }

  const match = input.slice(startIndex).match(/^https?:\/\/[^\s<]+/u);

  if (match === null) {
    return null;
  }

  const matchedValue = trimTrailingUrlPunctuation(match[0]);

  if (matchedValue.length === 0) {
    return null;
  }

  return {
    node: {
      type: "link",
      href: matchedValue,
      label: matchedValue,
    },
    index: startIndex + matchedValue.length,
  };
}

function trimTrailingUrlPunctuation(value: string): string {
  let endIndex = value.length;

  while (endIndex > 0) {
    const trailingCharacter = value[endIndex - 1]!;

    if (!TRAILING_URL_PUNCTUATION.has(trailingCharacter)) {
      break;
    }

    endIndex -= 1;
  }

  return value.slice(0, endIndex);
}

function compactContentNodes(nodes: ContentNode[]): ContentNode[] {
  const compactedNodes: ContentNode[] = [];

  for (const node of nodes) {
    if (node.type === "text" && node.value.length === 0) {
      continue;
    }

    const previousNode = compactedNodes[compactedNodes.length - 1];

    if (node.type === "text" && previousNode?.type === "text") {
      previousNode.value += node.value;
      continue;
    }

    compactedNodes.push(node);
  }

  return compactedNodes;
}

function isWhitespace(character: string): boolean {
  return /\s/u.test(character);
}

function pushInvalidSyntaxIssue(
  state: ParseState,
  offset: number,
  message: string,
): void {
  state.issues.push({
    code: "invalid_content_syntax",
    message,
    offset,
  });
}
