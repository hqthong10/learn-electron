import { useState, useEffect } from "react";
import i18n from "i18next";
import { useTranslation, initReactI18next } from "react-i18next";
// import { BrowserRouter, MemoryRouter } from "react-router-dom";

// import i18n_vi from "./i18n/vi";
// import i18n_en from "./i18n/en";
// import i18n_de from "./i18n/de";
import StudioPage from "./features/studio";
// import { useAuth } from './context/AuthContext';

// import MainWindow from './windows/main';
// import ChildWindow from './windows/child';

// i18n.use(initReactI18next).init({
//   resources: {
//     en: {
//       translation: i18n_en,
//     },
//     vi: {
//       translation: i18n_vi,
//     },
//     de: {
//       translation: i18n_de,
//     },
//   },
//   lng: "en", // if you're using a language detector, do not define the lng option
//   fallbackLng: "en",

//   interpolation: {
//     escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
//   },
// });


export default function App() {
  // const [isConnected, setIsConnected] = useState(socket.connected);
  // const [windowId, setWindowId] = useState('main');
  // const { user } = useUser();
  // const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // setWindowId(queryParams.get('windowId'));

    // function onConnect() {
    //   setIsConnected(true);
    // }

    // function onDisconnect() {
    //   setIsConnected(false);
    // }

    // socket.on("connect", onConnect);
    // socket.on("disconnect", onDisconnect);

    // if (user != null && !isConnected) {
    //   socket.connect();
    // }

    return () => {
      // socket.off("connect", onConnect);
      // socket.off("disconnect", onDisconnect);
    };
  }, []);


  return (
    // <MemoryRouter>
      <div className="main-layout">        
            <StudioPage />
      </div>
      
    // </MemoryRouter>
  );
}
