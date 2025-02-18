import { v4 as uuid } from 'uuid';
import path from 'path';
// import * as obs from '../../obs-api';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { fixPathWhenPackaged } from './utils';
const { ipcRenderer, screen } = window.require('electron');
import { byOS, OS, getOS } from './operating-systems';
const signals = new Subject();

export class OsnApi {
    private static instance: OsnApi;

    obs: any;
    scene: any;
    pathApp = '';
    nwr: any;
    displayId = 'display1';
    win: any;

    private constructor() {
        // NWR is used to handle display rendering via IOSurface on mac
        // this.win = remote.BrowserWindow.fromId(remote.getCurrentWindow().id);
        if (getOS() === OS.Mac) {
            this.nwr = window.require('node-window-rendering');
            // this.nwr = remote.require('node-window-rendering');
        }
    }

    static getInstance(): OsnApi {
        if (!OsnApi.instance) {
            OsnApi.instance = new OsnApi();
        }
        return OsnApi.instance;
      }



    initOSN = async () => {
        if (this.obs) return;

        await this.initOBS();

        // this.configureOBS();

        this.scene = await this.setupScene();
        await this.setupSources();
    };

    initOBS = async () => {
        this.pathApp = (await ipcRenderer.invoke('AppPath')) || '';
        this.obs = await import('../../obs-api');

        window['obs'] = this.obs;
        this.obs.IPC.host(`livecenter-${uuid()}`);

        // set path, where OBS Studio is located
        this.obs.NodeObs.SetWorkingDirectory(
            path.join(
                this.pathApp.replace('app.asar', 'app.asar.unpacked'),
                'node_modules',
                'obs-studio-node'
            )
        );

        // OBS Studio configs and logs
        const obsDataPath = fixPathWhenPackaged(path.join(this.pathApp, 'osn-data'));

        this.obs.NodeObs.OBS_content_setDayTheme(true);

        // Arguments: locale, path to directory where configuration and logs will be stored, your application version
        const initResult = this.obs.NodeObs.OBS_API_initAPI('en-US', obsDataPath, '1.0.0');
        console.log('initResult:', initResult);

        this.obs.NodeObs.OBS_service_connectOutputSignals((signalInfo: any) => {
            console.log('signalInfo', signalInfo)
            // signals.next(signalInfo);
        });

        this.obs.NodeObs.RegisterSourceCallback((objs: any[]) =>
            console.log('RegisterSourceCallback:', objs.map((obj) => obj.name)),
        );

        console.log(this.obs.NodeObs.GetPermissionsStatus())

        this.obs.NodeObs.RequestPermissions((permissions: any) => {
            // this.permissionsUpdated.next(permissions);
            console.log('permissions', permissions);
          });
    };

    configureOBS = () => {
        this.setSetting('Output', 'Mode', 'Advanced');
        const availableEncoders = this.getAvailableValues('Output', 'Recording', 'RecEncoder');
        this.setSetting('Output', 'RecEncoder', availableEncoders.slice(-1)[0] || 'x264');
        this.setSetting('Output', 'RecFilePath', path.join(this.pathApp, 'videos'));
        this.setSetting('Output', 'RecFormat', 'mp4');
        this.setSetting('Output', 'VBitrate', 10000); // 10 Mbps
        this.setSetting('Video', 'FPSCommon', 60);
    };

    isVirtualCamPluginInstalled = () => {
        return this.obs.NodeObs.OBS_service_isVirtualCamPluginInstalled();
    }
      
    installVirtualCamPlugin = () => {
        this.obs.NodeObs.OBS_service_installVirtualCamPlugin();
        return this.obs.NodeObs.OBS_service_isVirtualCamPluginInstalled();
    }
      
    uninstallVirtualCamPlugin = () => {
        this.obs.NodeObs.OBS_service_uninstallVirtualCamPlugin();
        return !this.obs.NodeObs.OBS_service_isVirtualCamPluginInstalled();
    }
      
    startVirtualCam = () => {
        this.obs.NodeObs.OBS_service_createVirtualWebcam("obs-studio-node-example-cam");
        this.obs.NodeObs.OBS_service_startVirtualWebcam();
    }
      
    stopVirtualCam = () => {
        this.obs.NodeObs.OBS_service_stopVirtualWebcam();
        this.obs.NodeObs.OBS_service_removeVirtualWebcam();
    }

    setSetting = (category: string, parameter: any, value: any) => {
        let oldValue;

        // Getting settings container
        const settings = this.obs.NodeObs.OBS_settings_getSettings(category).data;

        settings.forEach((subCategory: any) => {
            subCategory.parameters.forEach((param: any) => {
                if (param.name === parameter) {
                    oldValue = param.currentValue;
                    param.currentValue = value;
                }
            });
        });

        // Saving updated settings container
        if (value != oldValue) {
            this.obs.NodeObs.OBS_settings_saveSettings(category, settings);
        }
    };

    getAvailableValues = (category: any, subcategory: any, parameter: any) => {
        const categorySettings = this.obs.NodeObs.OBS_settings_getSettings(category).data;
        if (!categorySettings) {
            console.warn(`There is no category ${category} in OBS settings`);
            return [];
        }

        const subcategorySettings = categorySettings.find((sub: any) => sub.nameSubCategory === subcategory);
        if (!subcategorySettings) {
            console.warn(`There is no subcategory ${subcategory} for OBS settings category ${category}`);
            return [];
        }

        const parameterSettings = subcategorySettings.parameters.find((param: any) => param.name === parameter);
        if (!parameterSettings) {
            console.warn(`There is no parameter ${parameter} for OBS settings category ${category}.${subcategory}`);
            return [];
        }

        return parameterSettings.values.map((value: string) => Object.values(value)[0]);
    };

    setupScene = async () => {
        // const obsAvailableTypes = this.obs.InputFactory.types();
        const sources = this.obs.InputFactory.getPublicSources().map((source: any) => source.name);

        let scene;
        if(!sources.includes('scene_main')) {
            scene = this.obs.SceneFactory.create('scene_main');
        } else {
            try {
                scene = this.obs.SceneFactory.fromName('scene_main') || null;
            } catch (error) {
                //
            }
        }
        if (!scene) {
            console.error('Failed to create scene');
            return;
        }
        
        
        // const videoSource = this.obs.InputFactory.create('desktop_video', byOS({ [OS.Windows]: 'monitor_capture', [OS.Mac]: 'display_capture' }));
        const videoSource = this.obs.InputFactory.create('image_source', 'desktop_video', {});
        console.log('videoSource:', videoSource);

        // Update source settings:
        const { physicalWidth, physicalHeight, aspectRatio } = await this.displayInfo();
        const settings = videoSource.settings;
        settings['width'] = physicalWidth;
        settings['height'] = physicalHeight;
        videoSource.update(settings);
        videoSource.save();

        // Set output video size to 1920x1080
        const outputWidth = 1920;
        const outputHeight = Math.round(outputWidth / aspectRatio);
        this.setSetting('Video', 'Base', `${outputWidth}x${outputHeight}`);
        this.setSetting('Video', 'Output', `${outputWidth}x${outputHeight}`);
        const videoScaleFactor = physicalWidth / outputWidth;

        // A scene is necessary here to properly scale captured screen size to output video size
        // const scene = obs.SceneFactory.create('test-scene');
        const sceneItem = scene.add(videoSource);
        sceneItem.scale = { x: 1.0 / videoScaleFactor, y: 1.0 / videoScaleFactor };

        // If camera is available, make it 1/3 width of video and place it to right down corner of display
        const cameraSource = this.getCameraSource();
        console.log('cameraSource', cameraSource);

        if (cameraSource) {
            const cameraItem = scene.add(cameraSource);
            const cameraScaleFactor = 1.0 / ((3.0 * cameraSource.width) / outputWidth);
            cameraItem.scale = { x: cameraScaleFactor, y: cameraScaleFactor };
            cameraItem.position = {
                x: outputWidth - cameraSource.width * cameraScaleFactor - outputWidth / 10,
                y: outputHeight - cameraSource.height * cameraScaleFactor - outputHeight / 10,
            };
        }

        return scene;
    }

    getCameraSource = () => {
        console.log('Trying to set up web camera...');
        // Setup input without initializing any device just to get list of available ones
        const dummyInput = byOS({
            [OS.Windows]: () =>
                this.obs.InputFactory.create('dshow_input', 'video', {
                    audio_device_id: 'does_not_exist',
                    video_device_id: 'does_not_exist',
                }),
            [OS.Mac]: () =>
                this.obs.InputFactory.create('av_capture_input', 'video', {
                    device: 'does_not_exist',
                }),
        });

        console.log('dummyInput', dummyInput);

        const _cameraItems = dummyInput.properties.get(byOS({ [OS.Windows]: 'video_device_id', [OS.Mac]: 'device' })).details.items;
        const cameraItems = _cameraItems.filter((item: any) => item.name.length > 0)

        console.log('cameraItems', cameraItems);

        dummyInput.release();

        if (cameraItems.length === 0) {
            console.debug('No camera found!!');
            return null;
        }

        const deviceId = cameraItems[0].value;
        cameraItems[0].selected = true;
        console.log('cameraItems[0].name: ' + cameraItems[0].name);

        const obsCameraInput = byOS({
            [OS.Windows]: () =>
                this.obs.InputFactory.create('dshow_input', 'video', {
                    video_device_id: deviceId,
                }),
            [OS.Mac]: () =>
                this.obs.InputFactory.create('av_capture_input', 'video', {
                    device: deviceId,
                }),
        });

        console.log('obsCameraInput: ', obsCameraInput);

        // It's a hack to wait a bit until device become initialized (maximum for 1 second)
        // If you know proper way how to determine whether camera is working and how to subscribe for any events from it, create a pull request
        // See discussion at https://github.com/Envek/obs-studio-node-example/issues/10
        for (let i = 1; i <= 4; i++) {
            if (obsCameraInput.width === 0) {
                const waitMs = 100 * i;
                console.log(`Waiting for ${waitMs}ms until camera get initialized.`);
                this.busySleep(waitMs); // We can't use async/await here
            }
        }

        // if (obsCameraInput.width === 0) {
        //     console.debug(`Found camera "${cameraItems[0].name}" doesn't seem to work as its reported width is still zero.`);
        //     return null;
        // }

        // Way to update settings if needed:
        const settings = obsCameraInput.settings;
        console.debug('Camera settings:', obsCameraInput.settings);
        settings['width'] = 320;
        settings['height'] = 240;
        obsCameraInput.update(settings);
        obsCameraInput.save();

        return obsCameraInput;
    }

    displayInfo = async () => {
        // const { screen } = window.require('electron');
        const primaryDisplay = await ipcRenderer.invoke('primaryDisplay');
        const { width, height } = primaryDisplay.size;
        const { scaleFactor } = primaryDisplay;
        return {
            width,
            height,
            scaleFactor: scaleFactor,
            aspectRatio: width / height,
            physicalWidth: width * scaleFactor,
            physicalHeight: height * scaleFactor,
        };
    }

    getNextSignalInfo = () => {
        return new Promise((resolve, reject) => {
            signals.pipe(first()).subscribe(signalInfo => resolve(signalInfo));
            setTimeout(() => reject('Output signal timeout'), 30000);
        });
    }

    busySleep = (sleepDuration: number) => {
        const now = new Date().getTime();
        while (new Date().getTime() < now + sleepDuration) {
            /* do nothing */
        }
    }

    getAudioDevices = (type: any, subtype: any) => {
        const dummyDevice = this.obs.InputFactory.create(type, subtype, { device_id: 'does_not_exist' });
        const devices = dummyDevice.properties.get('device_id').details.items.map(({ name, value }: { name: any, value: any }) => {
            return { device_id: value, name };
        });
        dummyDevice.release();
        return devices;
    };

    setupSources = async () => {
        this.obs.Global.setOutputSource(1, this.scene);
        this.setSetting('Output', 'Track1Name', 'Mixed: all sources');
        let currentTrack = 2;

        this.getAudioDevices(byOS({ [OS.Windows]: 'wasapi_output_capture', [OS.Mac]: 'coreaudio_output_capture' }), 'desktop-audio').forEach((metadata: any) => {
            if (metadata.device_id === 'default') return;
            const source = this.obs.InputFactory.create(
                byOS({ [OS.Windows]: 'wasapi_output_capture', [OS.Mac]: 'coreaudio_output_capture' }),
                'desktop-audio',
                { device_id: metadata.device_id },
            );
            this.setSetting('Output', `Track${currentTrack}Name`, metadata.name);
            source.audioMixers = 1 | (1 << (currentTrack - 1)); // Bit mask to output to only tracks 1 and current track
            this.obs.Global.setOutputSource(currentTrack, source);
            currentTrack++;
        });


        this.getAudioDevices(byOS({ [OS.Windows]: 'wasapi_input_capture', [OS.Mac]: 'coreaudio_input_capture' }), 'mic-audio').forEach((metadata: any) => {
            if (metadata.device_id === 'default') return;
            const source = this.obs.InputFactory.create(byOS({ [OS.Windows]: 'wasapi_input_capture', [OS.Mac]: 'coreaudio_input_capture' }), 'mic-audio', {
                device_id: metadata.device_id,
            });
            this.setSetting('Output', `Track${currentTrack}Name`, metadata.name);
            source.audioMixers = 1 | (1 << (currentTrack - 1)); // Bit mask to output to only tracks 1 and current track
            this.obs.Global.setOutputSource(currentTrack, source);
            currentTrack++;
        });

        this.setSetting('Output', 'RecTracks', parseInt('1'.repeat(currentTrack - 1), 2)); // Bit mask of used tracks: 1111 to use first four (from available six)
    }

    setupPreview = async (bounds: any) => {
        console.log('-----setup preview-----');
        const winHandle = await ipcRenderer.invoke('getNativeWindowHandle');

        // this.obs.NodeObs.OBS_content_createSourcePreviewDisplay(
        //     winHandle,
        //     // remote.BrowserWindow.fromId(remote.getCurrentWindow().id).getNativeWindowHandle(),
        //     this.scene?.name || 'scene_main', // or use camera source Id here
        //     // this.displayId,
        //     // false,
        //     this.obs.IVideo
        // );

        this.obs.NodeObs.OBS_content_createDisplay(
            winHandle,
            this.displayId,
            // this.obs.ERenderingMode.OBS_MAIN_RENDERING
        );

        // this.obs.NodeObs.OBS_content_setShouldDrawUI(this.displayId, false);
        // this.obs.NodeObs.OBS_content_setPaddingSize(this.displayId, 0);
        // Match padding color with main window background color
        // this.obs.NodeObs.OBS_content_setPaddingColor(this.displayId, 255, 255, 255);
    
        //return await this.resizePreview(winHandle, bounds);
    }

    existingWindow = false
    initY = 0

    resizePreview = async (winHandle: any, bounds: any) => {
        // eslint-disable-next-line prefer-const
        let { aspectRatio, scaleFactor } = await this.displayInfo();

        if (getOS() === OS.Mac) {
            scaleFactor = 1
        }
        const displayWidth = Math.floor(bounds.width);
        const displayHeight = Math.round(displayWidth / aspectRatio);
        const displayX = Math.floor(bounds.x);
        const displayY = Math.floor(bounds.y);
        if (this.initY === 0) {
            this.initY = displayY
        }

        this.obs.NodeObs.OBS_content_resizeDisplay(this.displayId, displayWidth * scaleFactor, displayHeight * scaleFactor);

        if (getOS() === OS.Mac) {
            if (this.existingWindow) {
                this.nwr.destroyWindow(this.displayId);
                this.nwr.destroyIOSurface(this.displayId);
            }
            const surface = this.obs.NodeObs.OBS_content_createIOSurface(this.displayId)
            this.nwr.createWindow(
                this.displayId,
                winHandle,
            );
            this.nwr.connectIOSurface(this.displayId, surface);
            this.nwr.moveWindow(this.displayId, displayX * scaleFactor, (this.initY - displayY + this.initY) * scaleFactor)
            this.existingWindow = true
        } else {
            this.obs.NodeObs.OBS_content_moveDisplay(this.displayId, displayX * scaleFactor, displayY * scaleFactor);
        }

        // return { height: displayHeight }
    }

    start = async () => {
        let signalInfo: any;
      
        console.debug('Starting recording...');
        this.obs.NodeObs.OBS_service_startRecording();
      
        console.debug('Started?');
        signalInfo = await this.getNextSignalInfo();
      
        if (signalInfo.signal === 'Stop') {
          throw Error(signalInfo.error);
        }
      
        console.debug('Started signalInfo.type:', signalInfo.type, '(expected: "recording")');
        console.debug('Started signalInfo.signal:', signalInfo.signal, '(expected: "start")');
        console.debug('Started!');
    }
    
      
    stop = async () => {
        let signalInfo: any;
      
        console.debug('Stopping recording...');
        this.obs.NodeObs.OBS_service_stopRecording();
        console.debug('Stopped?');
      
        signalInfo = await this.getNextSignalInfo();
      
        console.debug('On stop signalInfo.type:', signalInfo.type, '(expected: "recording")');
        console.debug('On stop signalInfo.signal:', signalInfo.signal, '(expected: "stopping")');
      
        signalInfo = await this.getNextSignalInfo();
      
        console.debug('After stop signalInfo.type:', signalInfo.type, '(expected: "recording")');
        console.debug('After stop signalInfo.signal:', signalInfo.signal, '(expected: "stop")');
      
        console.debug('Stopped!');
    }
      
    shutdown = () => {
        try {
            this.obs.NodeObs.OBS_service_removeCallback();
            this.obs.NodeObs.IPC.disconnect();
        } catch(e) {
            throw Error('Exception when shutting down OBS process' + e);
        }
      
        console.debug('OBS shutdown successfully');
      
        return true;
    }
}
