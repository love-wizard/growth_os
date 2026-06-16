#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const appid = "wx9dc1684e86d64553";
const rootDir = path.resolve(__dirname, "..");
const projectPath = path.join(rootDir, "miniprogram");
const defaultKeyPath = path.join(
  process.env.HOME || "",
  ".config",
  "growthos",
  "wechat-miniprogram-upload.key"
);

const version = process.argv[2];
const desc = process.argv.slice(3).join(" ");
const privateKeyPath =
  process.env.WECHAT_MINIPROGRAM_PRIVATE_KEY_PATH || defaultKeyPath;
const robot = Number(process.env.WECHAT_MINIPROGRAM_CI_ROBOT || "1");

if (!version || !desc) {
  console.error(
    "Usage: npm run mp:upload -- <version> <description>\n" +
      "Example: npm run mp:upload -- 2026.06.15-photo-cache-fix \"修复成长档案照片展示\""
  );
  process.exit(1);
}

if (!fs.existsSync(privateKeyPath)) {
  console.error(
    `Missing private key: ${privateKeyPath}\n` +
      "Set WECHAT_MINIPROGRAM_PRIVATE_KEY_PATH or place the key at the default path."
  );
  process.exit(1);
}

let ci;
try {
  ci = require("miniprogram-ci");
} catch (error) {
  console.error(
    "Missing dependency miniprogram-ci. Run:\n" +
      "npm install --save-dev miniprogram-ci --registry=https://registry.npmmirror.com"
  );
  process.exit(1);
}

const project = new ci.Project({
  appid,
  type: "miniProgram",
  projectPath,
  privateKeyPath,
  ignores: ["node_modules/**/*", ".git/**/*"]
});

async function main() {
  await ci.upload({
    project,
    version,
    desc,
    robot,
    setting: {
      es6: true,
      minify: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true,
      uploadWithSourceMap: true
    },
    onProgressUpdate: console.log
  });

  console.log(`Uploaded mini program ${appid} development version ${version} with robot ${robot}`);
  console.log("Set robot 1's development version as the experience version in WeChat MP once if needed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
