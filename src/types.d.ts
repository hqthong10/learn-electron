// export {};

export interface IElectronAPI {
    sendMessage: (channel: string, data: any) => void;
    onMessage: (channel: string, callback: (event: any, data: any) => void) => void;
    getPathAppData: () => Promise<string>;
    obs: any;
}

export declare global {
    interface Window {
      electronAPI: IElectronAPI;
      obs: any;
      myAPI: any;
      obsAPI: any;
    }
  }
