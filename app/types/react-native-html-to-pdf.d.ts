declare module 'react-native-html-to-pdf' {
  interface RNHTMLtoPDFOptions {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    padding?: number;
  }

  interface RNHTMLtoPDFResponse {
    filePath: string;
    base64?: string;
  }

  export function convert(options: RNHTMLtoPDFOptions): Promise<RNHTMLtoPDFResponse>;
  
  const RNHTMLtoPDF: {
    convert: typeof convert;
  };
  
  export default RNHTMLtoPDF;
}
