import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
// @ts-ignore
import uviewPlus from 'uview-plus'
import uniPopup from '@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue'
// @ts-ignore
import Editor from "@tinymce/tinymce-vue";
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia.createPinia())
  app.use(uviewPlus)
  app.component('editor',Editor)
  app.component('uni-popup',uniPopup)
  return {
    app,
    Pinia
  }
}
