/**
 * Global type declarations
 */

// CSS Modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// SCSS Modules
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Images
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

// Fonts
declare module '*.woff' {
  const value: string;
  export default value;
}

declare module '*.woff2' {
  const value: string;
  export default value;
}

declare module '*.ttf' {
  const value: string;
  export default value;
}
