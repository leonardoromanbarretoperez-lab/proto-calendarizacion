import { readFileSync, writeFileSync } from "fs";

const pickerRaw  = readFileSync("./src/imports/01Picker/svg-tw5ju0y2zu.ts", "utf8");
const panelRaw   = readFileSync("./src/imports/01/svg-a9oovbkrq5.ts", "utf8");
const reactJs    = readFileSync("./react.js", "utf8");
const reactDomJs = readFileSync("./react-dom.js", "utf8");
const jsxContent = readFileSync("./jsx-content.txt", "utf8");

// Load Babel from the downloaded file to compile JSX in Node
const babelCode = readFileSync("./babel.js", "utf8");
const m = { exports: {} };
(new Function("module", "exports", babelCode))(m, m.exports);
const Babel = m.exports;

function parseTs(raw) {
  const obj = {};
  const re = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(raw)) !== null) obj[m[1]] = m[2];
  return obj;
}

const pickerSvg = parseTs(pickerRaw);
const panelSvg  = parseTs(panelRaw);
const pickerJson = JSON.stringify(pickerSvg);
const panelJson  = JSON.stringify(panelSvg);

console.log("Compilando JSX...");
const compiled = Babel.transform(jsxContent, {
  presets: [["react", { runtime: "classic" }]],
  filename: "app.jsx",
}).code;
console.log("JSX compilado (" + Math.round(compiled.length / 1024) + " KB)");

const css = `<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EDEDED;font-family:'Proxima Nova',system-ui,sans-serif}
@keyframes _spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
._spin{animation:_spin 0.8s linear infinite}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
input[type=number]{-moz-appearance:textfield}
</style>`;

const html = [
  `<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=1366"/>\n<title>Calendarización — Prototipo</title>`,
  css,
  `<script>`, reactJs, `</script>`,
  `<script>`, reactDomJs, `</script>`,
  `</head>\n<body>\n<div id="root"></div>`,
  `<script>\nconst pickerSvg = `, pickerJson, `;\nconst panelSvg = `, panelJson, `;\n</script>`,
  `<script>\n`, compiled, `\n</script>`,
  `\n</body>\n</html>`,
].join("");

writeFileSync("./prototipo.html", html, "utf8");
console.log("✅  prototipo.html generado (" + Math.round(Buffer.byteLength(html, "utf8") / 1024) + " KB)");
