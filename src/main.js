import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

// import hwPdfViewer from "hw-pdf-viewer";
// import "hw-pdf-viewer/dist/hw-pdf-viewer.css";

// 注册组件库
// Vue.use(hwPdfViewer);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
