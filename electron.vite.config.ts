import yaml from '@modyfi/vite-plugin-yaml'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite'
import { resolve } from 'path'
import vueDevTools from 'vite-plugin-vue-devtools'

const minify = process.env.NODE_ENV === 'production'

// 在解析 League Client 的标签时，需要考虑到这些自创的元素
// 作为参考，列在下面，同时供模板使用
// 暂未实装
const LC_CUSTOM_TAGS = new Set([
  'mainText',
  'stats',
  'active',
  'passive',
  'attention',
  'rarityMythic',
  'rarityLegendary',
  'rarityGeneric',
  'keywordStealth', // 隐形
  'scaleArmor',
  'scaleMR',
  'scaleAD',
  'scaleAP',
  'feSteal', // 物理吸血
  'flavorText', // 小字彩蛋
  'rules',
  'status',
  'speed',
  'shield',
  'heang', // 似乎是和治疗相关的，回复生命值
  'scaleMana',
  'scalemana', // 不知道为什么有小写的，虽然在 HTML 中都会看作小写
  'magicDamage',
  'trueDamage',
  'physicalDamage',
  'ornnBonus',
  'buffedStat',
  'nerfedStat',
  'keywordMajor' // 关键词护卫
])

export default defineConfig({
  main: {
    // https://electron-vite.org/guide/typescript-decorator
    plugins: [swcPlugin(), yaml(), externalizeDepsPlugin()],
    build: {
      minify
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main')
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
        '@shared': resolve('src/shared'),
        '@renderer-shared': resolve('src/renderer-shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@main-window': resolve('src/renderer/src-main-window'),
        '@aux-window': resolve('src/renderer/src-aux-window'),
        '@shared': resolve('src/shared'),
        '@renderer-shared': resolve('src/renderer-shared')
      }
    },
    plugins: [
      swcPlugin(),
      yaml(),
      vue({
        template: { compilerOptions: { isCustomElement: (tag) => LC_CUSTOM_TAGS.has(tag) } }
      }),
      vueJsx({
        isCustomElement: (tag) => LC_CUSTOM_TAGS.has(tag)
      }),
      vueDevTools()
    ],
    build: {
      minify,
      rollupOptions: {
        input: {
          mainWindow: resolve(__dirname, 'src/renderer/main-window.html'),
          auxWindow: resolve(__dirname, 'src/renderer/aux-window.html')
        }
      }
    }
  }
})
