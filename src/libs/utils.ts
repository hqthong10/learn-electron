import path from 'path';

export const fixPathWhenPackaged = (p: string) => {
  return p.replace("app.asar", "app.asar.unpacked");
}

// export function b64EncodeUnicode(str: string): string {
//   return btoa(
//     encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
//       return String.fromCharCode(parseInt("0x" + p1, 16));
//     })
//   );
// }

// export function b64DecodeUnicode(str: string) {
//   return decodeURIComponent(
//     Array.prototype.map
//       .call(atob(str), function (c: any) {
//         return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
//       })
//       .join("")
//   );
// }

// export function decodeString(str: string): string {
//   try {
//     return decodeURIComponent(str);
//   } catch (e: any) {
//     try {
//       return decodeURI(str);
//     } catch (error) {
//       return str;
//     }
//   }
// }

// export const objToArray = (obj: any) =>
//   Object.keys(obj).map((key) => ({ key, value: obj[key] }));

// export const configMapToOptions = (obj: any) =>
//   objToArray(obj).map(({ key, value }) => ({
//     dropId: value,
//     dropText: key,
//   }));

// export const configEnumToOptions = (enumValue: any) => {
//   const items = Object.values(enumValue);
//   const keys = items.filter((v) => typeof v === 'string') as string[];
//   const values = items.filter((v) => typeof v === 'number') as number[];
//   return keys.map((value, index) => ({
//     dropId: values[index],
//     dropText: value,
//   }));
// };


// export const isDebug = () => {
//   return process.env.NODE_ENV === 'development';
// };

// export const getResourcePath = (filePath = './') => {
//   let resourcePath;
//   if (isDebug()) {
//     resourcePath = path.resolve(
//       `${__dirname}`,
//       '../../../extraResources/',
//       filePath
//     );
//   } else {
//     resourcePath = path.resolve(
//       `${process.resourcesPath}/extraResources`,
//       filePath
//     );
//   }
//   return resourcePath;
// };

// export const getRandomInt = (min = 1, max = 99999) => {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// };
