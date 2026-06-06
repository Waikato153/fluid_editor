import ImageResize from 'tiptap-extension-resize-image'

export const Image = ImageResize.extend({
  // Override parseHTML to not conflict with ImageBlock
  // ImageBlock handles img[data-width], Image handles everything else
  parseHTML() {
    return [
      {
        tag: 'img[src]:not([data-width])',
      },
    ]
  },
})

export default Image
