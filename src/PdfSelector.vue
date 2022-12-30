<template>
  <div class="pdfSelector">
    <div class="pdfSelector__pagination"
         @click="prev"><arrow-left /></div>
    <div class="pdfSelector__container"
         ref="refPdfContainer"
         :style="containerStyle">
      <PdfCore v-if="pdfFileSource"
               id="pdf-canvas-selector"
               :config="selectorConfig"
               :fileSource="pdfFileSource"
               :currentPage="currentPage"
               :pageTurn="pageTurn" />
    </div>
    <div class="pdfSelector__pagination"
         @click="next"><arrow-right /></div>
  </div>
</template>

<script setup>
import { ref, watch, watchEffect, inject, toRef } from "vue";
import PdfCore from "./PdfCore.vue";
import { usePageTurn } from "./hooks";
import ArrowLeft from "./assets/ArrowLeft.vue";
import ArrowDown from "./assets/ArrowDown.vue";
import ArrowRight from "./assets/ArrowRight.vue";
import ArrowTop from "./assets/ArrowTop.vue";

const props = defineProps({
  previewSize: {
    type: Number,
    default: 5,
  },
  pdfFileSource: Object,
  pageClick: Function,
  step: {
    type: String,
    default: "single",
  },
  currentPage: Number,
  totalPage: Number
});

const selectorConfig = {
  width: 150,
  direction: "horizontal",
};

const containerStyle = {
  width: `${props.previewSize * selectorConfig.width}px`,
};

const emit = defineEmits(["pageTurn"]);
const pageTurn = (pageNo) => emit("pageTurn", pageNo);

const isRenderComplete = ref(false);
const { prev, next, refPdfContainer } = usePageTurn({
  isRenderComplete,
  direction: selectorConfig.direction,
  previewSize: props.previewSize,
  step: props.step,
  currentPage: 1,
  totalPage: props.totalPage
});

const turnDirection = inject('turnDirection');
const currentPage = toRef(props, 'currentPage');
watch(currentPage, () => {
  const mod = props.currentPage % props.previewSize;

  if (turnDirection.value === 'next') {
    if (mod === 1) {
      next.value();
    }
  } else if (turnDirection.value === 'prev') {
    if (mod === 0) {
      prev.value();
    }
  }
});
</script>
<style lang="less">
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.pdfSelector {
  display: flex;
  justify-content: center;
  overflow: hidden;
  margin: 50px 0;

  &__pagination {
    min-width: 50px;
    min-height: 50px;
    cursor: pointer;

    &:first-child {
      .center();
    }

    &:last-child {
      .center();
    }
  }

  &__container {
    overflow: hidden;
    margin: 10px;

    .pdfCore__page {
      padding: 10px;
    }
  }
}
</style>
