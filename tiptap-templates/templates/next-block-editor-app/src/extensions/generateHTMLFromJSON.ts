import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Image from '@tiptap/extension-image'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import {Document} from "@/extensions/Document";
import {Column, Columns} from "@/extensions/MultiColumn";
import {
  BlockquoteFigure,
  CharacterCount,
  CodeBlock,
  Color,
  Details,
  DetailsContent,
  DetailsSummary, Dropcursor,
  Emoji,
  emojiSuggestion,
  Figcaption,
  FileHandler,
  Focus,
  FontFamily,
  FontSize,
  Highlight,
  HorizontalRule,
  ImageBlock,
  ImageUpload,
  Link,
  Placeholder,
  Selection,
  ShowModal,
  SlashCommand,
  Strike,
  Subscript,
  Superscript,
  Table,
  TableCell,
  TableHeader,
  TableOfContents,
  TableRow,
  TaskItem,
  TaskList,
  TextAlign,
  TextStyle,
  TrailingNode,
  Typography,
  UniqueID
} from "@/extensions/index";
import {isChangeOrigin} from "@tiptap/extension-collaboration";
import {TableOfContentsNode} from "@/extensions/TableOfContentsNode";

export default function generateHTMLFromJSON(json: any): string {
  if (!json || !Array.isArray(json)) {
    console.warn('Invalid JSON structure for TipTap content.')
    return ''
  }

  return generateHTML(json, [

    Document,
    Columns,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Column,
    Selection,
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
    HorizontalRule,
    UniqueID.configure({
      types: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'table'],
      filterTransaction: transaction => !isChangeOrigin(transaction),
    }),
    StarterKit.configure({
      document: false,
      dropcursor: false,
      heading: false,
      horizontalRule: false,
      blockquote: false,
      history: false,
      codeBlock: false,
    }),
    Details.configure({
      persist: true,
      HTMLAttributes: {
        class: 'details',
      },
    }),
    Strike,
    DetailsContent,
    DetailsSummary,
    CodeBlock,
    TextStyle,
    FontSize,
    FontFamily,
    ShowModal,
    Color,
    TrailingNode,
    Link.configure({
      openOnClick: true,
    }),
    Highlight.configure({ multicolor: true }),
    Underline,
    CharacterCount.configure({ limit: null }),
    TableOfContents,
    TableOfContentsNode,

    ImageBlock,

    Emoji.configure({
      enableEmoticons: true,
      suggestion: emojiSuggestion,
    }),
    TextAlign.extend({
      addKeyboardShortcuts() {
        return {}
      },
    }).configure({
      types: ['heading', 'paragraph'],
    }),
    Subscript,
    Superscript,
    Table,
    TableCell,
    TableHeader,
    TableRow,
    Typography,
    Placeholder.configure({
      includeChildren: true,
      showOnlyCurrent: false,
      placeholder: () => '',
    }),
    SlashCommand,
    Focus,
    Figcaption,
    BlockquoteFigure,
    Dropcursor.configure({
      width: 2,
      class: 'ProseMirror-dropcursor border-black',
    }),
    BulletList,
    OrderedList,
    ListItem,
    Paragraph,
    Text,
    Bold,
    Italic,

  ])
}
