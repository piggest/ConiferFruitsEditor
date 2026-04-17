// CSSモジュールの型宣言
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
