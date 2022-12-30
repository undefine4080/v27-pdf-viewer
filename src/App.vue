<template>
  <div id="app">
    <pdf-viewer src="./demo.pdf" :selector="true"></pdf-viewer>
  </div>
</template>

<script setup>
import PdfViewer from './PdfViewer.vue';
</script>

<style lang="less">
#app {
  background-color: black;
}
</style>
