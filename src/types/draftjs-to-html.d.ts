declare module 'draftjs-to-html' {
  import { RawDraftContentState } from 'draft-js';
  
  function draftToHtml(
    rawContent: RawDraftContentState,
    hashConfig?: any,
    directional?: boolean,
    customEntityTransform?: (entity: any, text: string) => string
  ): string;
  
  export default draftToHtml;
} 