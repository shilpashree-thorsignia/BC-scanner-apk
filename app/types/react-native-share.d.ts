declare module 'react-native-share' {
  export interface ShareOptions {
    title?: string;
    message?: string;
    url: string;
    type?: string;
    subject?: string;
    email?: string;
    recipient?: string;
    social?: string;
    filename?: string;
    saveToFiles?: boolean;
    failOnCancel?: boolean;
    showAppsToView?: boolean;
    excludedActivityTypes?: string[];
    activityItemSources?: any[];
  }

  export interface ShareResponse {
    success: boolean;
    message: string;
  }

  export function open(options: ShareOptions): Promise<ShareResponse>;
  
  const Share: {
    open: typeof open;
    Social: {
      FACEBOOK: string;
      TWITTER: string;
      WHATSAPP: string;
      INSTAGRAM: string;
      GOOGLEPLUS: string;
      EMAIL: string;
      PINTEREST: string;
    };
  };
  
  export default Share;
}
