<template>
  <div id="app">
    <hw-pdf-viewer src="./test.pdf"
      :width="500"
      :height="800"
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
