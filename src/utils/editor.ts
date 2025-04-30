import draftToHtml from 'draftjs-to-html';
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';

/**
 * Convert editor content to HTML string
 */
export const convertEditorContentToHTML = (content: string): string => {
  try {
    const rawContent = JSON.parse(content);
    const html = draftToHtml(rawContent);
    return html;
  } catch (error) {
    // If content is not valid JSON, return it as plain text
    return content;
  }
};

/**
 * Convert HTML string to EditorState
 */
export const convertHTMLToEditorState = (html: string): EditorState => {
  try {
    const blocksFromHtml = htmlToDraft(html);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    return EditorState.createWithContent(contentState);
  } catch (error) {
    // If there's an error, return empty editor state
    return EditorState.createEmpty();
  }
};

/**
 * Create EditorState from raw stored content
 */
export const createEditorStateFromRaw = (rawContent: any): EditorState => {
  if (!rawContent) return EditorState.createEmpty();
  
  try {
    const contentState = ContentState.createFromText(rawContent);
    return EditorState.createWithContent(contentState);
  } catch (error) {
    return EditorState.createEmpty();
  }
}; 