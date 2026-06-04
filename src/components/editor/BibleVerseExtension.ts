import { Node } from "@tiptap/core";

export const BibleVerseExtension = Node.create({
  name: "bibleVerse",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      reference: { default: "" },
      text: { default: "" },
      translation: { default: "NKJV" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-bible-verse]",
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return {
            reference: el.getAttribute("data-reference") ?? "",
            text: el.querySelector("[data-verse-text]")?.textContent ?? "",
            translation: el.getAttribute("data-translation") ?? "NKJV",
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      "div",
      {
        "data-bible-verse": "true",
        "data-reference": node.attrs.reference as string,
        "data-translation": node.attrs.translation as string,
        class: "bible-verse-block",
      },
      [
        "p",
        { "data-verse-text": "", class: "verse-text" },
        node.attrs.text as string,
      ],
      [
        "span",
        { class: "verse-ref" },
        `— ${node.attrs.reference} (${node.attrs.translation})`,
      ],
    ];
  },
});
