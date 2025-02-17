import React from "react";
import { createRoot } from "react-dom/client";
import App from './app';
import "./index.css";

import { OsnApi } from "./libs/osn";

document.addEventListener('DOMContentLoaded', async () => {
  // await (OsnApi.getInstance()).initOSN();

  const root = createRoot(document.getElementById("approot"));
  root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
  );
});


