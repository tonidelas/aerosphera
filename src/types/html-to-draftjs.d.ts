declare module 'html-to-draftjs' {
  import { ContentBlock, EntityMap } from 'draft-js';
  
  interface HtmlToDraftBlocks {
    contentBlocks: ContentBlock[];
    entityMap: EntityMap;
  }
  
  function htmlToDraft(html: string): HtmlToDraftBlocks;
  
  export default htmlToDraft;
} 