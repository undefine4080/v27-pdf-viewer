<template>
  <div id="app">
    <hw-pdf-viewer src="./file/test.pdf"
      :width="800"
      :height="1200"
      :selector="true"></hw-pdf-viewer>
  </div>
</template>

<script setup>
import hwPdfViewer from './PdfViewer.vue';
</script>

<style lang="scss">
#app {
  background-color: sandybrown;
}
</style>
