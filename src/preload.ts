// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
// import * as osn from 'obs-studio-node/module'; // Import thư viện OBS
// import {v4 as uuid} from 'uuid';
// import path from 'path';

// function fixPathWhenPackaged(p: string) {
//     return p.replace("app.asar", "app.asar.unpacked");
// }

// // Khởi tạo OBS Studio Node trong Main Process
// osn.NodeObs.IPC.host(`obs-studio-node-example-${uuid()}`);
// osn.NodeObs.SetWorkingDirectory(fixPathWhenPackaged(path.join(__dirname, 'node_modules', 'obs-studio-node')));

contextBridge.exposeInMainWorld('obsAPI', {
//   obs: () => ipcRenderer.invoke('obs'), // Expose OBS Studio Node API
});

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (channel: string, data: any) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel: string, callback: (event: any, data: any) => void) => {
        ipcRenderer.on(channel, callback);
    },
    getPathAppData: () => ipcRenderer.invoke('getPathAppData')
});
