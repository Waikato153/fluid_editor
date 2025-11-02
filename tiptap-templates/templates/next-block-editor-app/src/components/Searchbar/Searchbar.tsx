import { cn } from '@/lib/utils'
import React, { memo, useCallback, useState, useEffect,useRef} from 'react'
import { Editor } from '@tiptap/react'
import Button from '@mui/material/Button';
import {ButtonGroup} from "@mui/material";
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";


export const Searchbar = memo(
  ({ editor, isOpen }: {
    editor: Editor
     isOpen?: boolean;
     // onClose: () => void;
  }
  ) => {

    const { showMessage } = useSnackbar();

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [replaceTerm, setReplaceTerm] = useState<string>("");

    const replaceS = () => { // you can probably use `useCallback` hook)
      if (!searchTerm || !editor.getText()) {
        return
      }
      editor.commands.setSearchTerm(searchTerm);
      editor.commands.setReplaceTerm(replaceTerm);
      editor.commands.replace();
    };

    const replaceAll = () => { // you can probably use `useCallback` hook)
      if (!searchTerm || !editor.getText()) {
        return
      }
      editor.commands.setSearchTerm(searchTerm);
      editor.commands.setReplaceTerm(replaceTerm);
      editor.commands.replaceAll();
      
      showMessage('Replace All: Successfully replaced ' + searchResults.total + ' records.', 'success');
      clear();
    };

    const handleSearchChange =  (e: React.ChangeEvent<HTMLInputElement>) => {
      editor.commands.resetIndex();

      setSearchTerm(e.target.value)
      editor.commands.setSearchTerm(e.target.value);
      const { results, resultIndex } = editor.storage.searchAndReplace;

      setSearchResults({
        current: resultIndex + 1, // 1-based index
        total: results.length,
      });

      goToSelection();
    }

    const next = () => {
      if (!searchTerm || !editor.getText()) {
        return
      }

      editor.commands.nextSearchResult();
      goToSelection();


    };

    const previous = () => {
      if (!searchTerm || !editor.getText()) {
        return
      }
      editor.commands.previousSearchResult();
      goToSelection();
    };


    const [searchResults, setSearchResults] = useState({
      current: 0,
      total: 0,
    });

    const goToSelection = () => {
      const { results, resultIndex } = editor.storage.searchAndReplace;

      setSearchResults({
        current: resultIndex + 1, // 1-based index
        total: results.length,
      });

      // @ts-ignore
      //let position: Range = { from: 0, to: 0 };

      //if (results.length) {
       let position = results[resultIndex];

      //}

      if (!position) return;

      // @ts-ignore
      editor.commands.setTextSelection(position);

      const { node } = editor.view.domAtPos(
        editor.state.selection.anchor
      );
      node instanceof HTMLElement &&
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const clear = () => {

      setSearchResults({
        current: 0,
        total: 0,
      });

      if (!searchTerm || !editor.getText()) {
        return
      }
      setSearchTerm('')
      setReplaceTerm('')
      editor.commands.setSearchTerm('');
      editor.commands.resetIndex();
      //goToSelection();
    };

    const closeHander = () => {
      setSearchTerm('')
      setReplaceTerm('')
      editor.commands.setSearchTerm('');
      editor.commands.resetIndex();
      setSearchResults({
        current: 0,
        total: 0,
      });
    }


    // Function to close the Searchbar when isOpen is false
    const closeHanderO = () => {
      if (!isOpen) {
        console.log(isOpen)
        closeHander();
        // Example: reset search terms, hide the drawer, etc.
      } else {

      }
    };
    const inputRef = useRef<HTMLInputElement>(null);
    // Use useEffect to run closeHander when isOpen changes
    useEffect(() => {
      if (!isOpen) {
        closeHanderO();  // Close handler when isOpen becomes false
      } else {
        inputRef.current?.focus();
      }
    }, [isOpen]);


    return (
      <div>
          {/*<button*/}
          {/*  onClick={closeHander}*/}
          {/*  className="absolute top-4 right-4 text-white text-2xl font-bold rounded-full focus:outline-none hover:text-gray-300"*/}
          {/*  aria-label="Close"*/}
          {/*>*/}
          {/*  ✖*/}
          {/*</button>*/}
          <form className="p-6 max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col ">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-black">
                  Search
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="search"
                  name="search"
                  className="mt-1 block w-full bg-white text-gray-800 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder=""
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="flex-1 pt-2.5">
                <label htmlFor="replace" className="block text-sm font-medium text-black">
                  Replace
                </label>
                <input
                  type="text"
                  id="replace"
                  name="replace"
                  className="mt-1 block w-full bg-white text-gray-800 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder=""
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                />
              </div>
              {/*<div className="flex items-center">*/}
              {/*  <input*/}
              {/*    type="checkbox"*/}
              {/*    id="case-sensitive"*/}
              {/*    name="case-sensitive"*/}
              {/*    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"*/}
              {/*  />*/}
              {/*  <label htmlFor="case-sensitive" className="ml-2 block text-sm text-gray-300">*/}
              {/*    Case sensitive*/}
              {/*  </label>*/}
              {/*</div>*/}
            </div>
            <div className="flex bg-white ">
              <ButtonGroup variant="outlined" aria-label="Basic button group">
                <Button  onClick={clear}>Clear</Button>
                <Button  onClick={previous}>Previous</Button>
                <Button  onClick={next}>Next</Button>
                <Button  onClick={replaceS}>Replace</Button>
                <Button  onClick={replaceAll}>Replace All</Button>
              </ButtonGroup>
            </div>
            <p className="text-sm text-gray-400">
              {searchResults.total
                ? `Results: ${searchResults.current} / ${searchResults.total}`
                : ''}
            </p>
          </form>
        </div>
    )
  },
)

Searchbar.displayName = 'TableOfContentSearchpanel'
