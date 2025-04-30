declare module 'react-draft-wysiwyg' {
  import * as React from 'react';
  import { EditorState } from 'draft-js';
  
  export interface EditorProps {
    editorState?: EditorState;
    onEditorStateChange?: (editorState: EditorState) => void;
    wrapperClassName?: string;
    editorClassName?: string;
    toolbarClassName?: string;
    placeholder?: string;
    toolbar?: any;
    [key: string]: any;
  }
  
  export class Editor extends React.Component<EditorProps> {}
} 