"use client"
import React, { useState, useEffect } from "react";
import "./index.scss";
// eslint-disable-next-line import/no-unresolved
import { OsnApi } from "../../libs/osn";

export default function StudioPage() {
  let osnApi: any; // = OsnApi.getInstance();
  const allow = `
    autoplay;
    camera;
    microphone;
    fullscreen;
    picture-in-picture;
    display-capture;
    midi;
    geolocation;
    gyroscope;
    screen-wake-lock;
    unsafe-url;
    allow-scripts;
  `;
  const src = 'https://vdo.ninja/?push=aaa&transparent&webcam&screenshare&chroma&videodevice=1&audiodevice=1';


  useEffect(() => {
    // osnApi.initOSN().then(() => {
      
    // });

    // const previewContainer = document.getElementById('preview');
    //   const { width, height, x, y } = previewContainer.getBoundingClientRect();
    //   console.log(width, height, x, y);
    //   osnApi.setupPreview({ width, height, x, y })
    
  }, []);

  const init = async () => {
      osnApi = OsnApi.getInstance();
      await osnApi.initOSN()
      console.log('Init Done');
  }

  const preview = async () => {
      const previewContainer = document.getElementById('preview');
      const { width, height, x, y } = previewContainer.getBoundingClientRect();
      await osnApi.setupPreview({ width, height, x, y })
  }

  return (
    <div className="studio-page">
        <div className="iframe-container">
          {/* <iframe src={src} width={880} height={520} allow={allow}></iframe> */}
        </div>
        <div id="preview" className="preview-container">
          Initializing...
        </div>
        <button onClick={init}> init</button>
        <button onClick={preview}> preview</button>

    </div>
  );
}
