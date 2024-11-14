// electron.vite.config.ts
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig, externalizeDepsPlugin, swcPlugin } from "electron-vite";
import { resolve } from "path";
var __electron_vite_injected_dirname = "D:\\Projects\\league-akari";
var minify = process.env.NODE_ENV === "production";
var LC_CUSTOM_TAGS = /* @__PURE__ */ new Set([
  "mainText",
  "stats",
  "active",
  "passive",
  "attention",
  "rarityMythic",
  "rarityLegendary",
  "rarityGeneric",
  "keywordStealth",
  // 隐形
  "scaleArmor",
  "scaleMR",
  "scaleAD",
  "scaleAP",
  "feSteal",
  // 物理吸血
  "flavorText",
  // 小字彩蛋
  "rules",
  "status",
  "speed",
  "shield",
  "heang",
  // 似乎是和治疗相关的，回复生命值
  "scaleMana",
  "scalemana",
  // 不知道为什么有小写的，虽然在 HTML 中都会看作小写
  "magicDamage",
  "trueDamage",
  "physicalDamage",
  "ornnBonus",
  "buffedStat",
  "nerfedStat",
  "keywordMajor"
  // 关键词护卫
]);
var electron_vite_config_default = defineConfig({
  main: {
    // https://electron-vite.org/guide/typescript-decorator
    plugins: [swcPlugin(), externalizeDepsPlugin()],
    build: {
      minify
    },
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@main": resolve("src/main")
      }
    }
  },
  preload: {
    plugins: [swcPlugin(), externalizeDepsPlugin()],
    build: {
      minify
    },
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@renderer-shared": resolve("src/renderer-shared")
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        "@main-window": resolve("src/renderer/src-main-window"),
        "@aux-window": resolve("src/renderer/src-aux-window"),
        "@shared": resolve("src/shared"),
        "@renderer-shared": resolve("src/renderer-shared")
      }
    },
    plugins: [
      swcPlugin(),
      vue({
        template: { compilerOptions: { isCustomElement: (tag) => LC_CUSTOM_TAGS.has(tag) } }
      }),
      vueJsx({
        isCustomElement: (tag) => LC_CUSTOM_TAGS.has(tag)
      })
    ],
    build: {
      minify,
      rollupOptions: {
        input: {
          mainWindow: resolve(__electron_vite_injected_dirname, "src/renderer/main-window.html"),
          auxWindow: resolve(__electron_vite_injected_dirname, "src/renderer/aux-window.html")
        }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
