import { capitalize, kebabToCamel, snakeToCamel } from "pastable/server";

export const asComponentSchema = (name: string) => `#/components/schemas/${name}`;

export function normalizeString(text: string) {
  const prefixed = prefixStringStartingWithNumberIfNeeded(text);
  return prefixed
    .normalize("NFKD") // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, "_") // Replace spaces with _
    .replace(/-+/g, "_") // Replace - with _
    .replace(/[^\w\-]+/g, "_") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export const wrapWithQuotesIfNeeded = (str: string) => {
  if (/^\w+$/.test(str)) {
    return str;
  }

  return `"${str}"`;
};

const prefixStringStartingWithNumberIfNeeded = (str: string) => {
  const firstAsNumber = Number(str[0]);
  if (typeof firstAsNumber === "number" && !Number.isNaN(firstAsNumber)) {
    return "_" + str;
  }

  return str;
};

const pathParamWithBracketsRegex = /({\w+})/g;
const wordPrecededByNonWordCharacter = /[^\w\-]+/g;

export const pathParamToVariableName = (name: string) => {
  // Replace all underscores with # to preserve them when doing snakeToCamel
  const preserveUnderscore = name.replaceAll("_", "#");
  return snakeToCamel(preserveUnderscore.replaceAll("-", "_")).replaceAll("#", "_");
};

const matcherRegex = /{(\b\w+(?:-\w+)*\b)}/g;
export const replaceHyphenatedPath = (path: string) => {
  const matches = path.match(matcherRegex);
  if (matches === null) {
    return path.replaceAll(matcherRegex, ":$1");
  }

  matches.forEach((match) => {
    const replacement = pathParamToVariableName(match.replaceAll(matcherRegex, ":$1"));
    path = path.replaceAll(match, replacement);
  });
  return path;
};

/** @example turns `/media-objects/{id}` into `MediaObjectsId` */
export const pathToVariableName = (path: string) =>
  capitalize(kebabToCamel(path).replaceAll("/", "")) // /media-objects/{id} -> MediaObjects{id}
    .replace(pathParamWithBracketsRegex, (group) => capitalize(group.slice(1, -1))) // {id} -> Id
    .replace(wordPrecededByNonWordCharacter, "_"); // "/robots.txt" -> "/robots_txt"

export const escapeControlCharacters = (str: string): string => {
  return str
    .replace(/\t/g, "\\t") // U+0009
    .replace(/\n/g, "\\n") // U+000A
    .replace(/\r/g, "\\r") // U+000D
    .replace(/([\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF])/g, (_m, p1) => {
      const dec: number = p1.codePointAt();
      const hex: string = dec.toString(16);
      if (dec <= 0xff) return `\\x${`00${hex}`.slice(-2)}`;
      return `\\u${`0000${hex}`.slice(-4)}`;
    })
    .replace(/\//g, "\\/");
};
