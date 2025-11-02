import { Attributes, Extension } from '@tiptap/core'
import '@tiptap/extension-text-style'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    showModal: {
      showModal: (eventName: string) => ReturnType
    }
  }
}
//'show-modal'   modal in slashCommand
export const ShowModal = Extension.create({
  name: 'showModal',
  addCommands() {
    return {
      showModal: (eventName: string) => () => {
        const event = new CustomEvent(eventName)
        window.dispatchEvent(event)
        return true
      },
    }
  },
})

export default ShowModal
