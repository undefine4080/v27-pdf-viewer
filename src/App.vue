<template>
  <div id="app">
    <hw-pdf-viewer src="./test.pdf"
      :selector="true"></hw-pdf-viewer>
  </div>
</template>

<script setup>
import hwPdfViewer from './PdfViewer.vue';
</script>

<style lang="less">
#app {
  background-color: black;
}
</style>
