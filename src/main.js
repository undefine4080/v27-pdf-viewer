import Vue from 'vue'
import App from './App.vue'
import PdfViewer from '../dist/hw-pdf-viewer.common';

Vue.config.productionTip = false

import '../dist/hw-pdf-viewer.css'

// 注册组件库
Vue.use(PdfViewer);

new Vue({
  render: h => h(App),
}).$mount('#app')
