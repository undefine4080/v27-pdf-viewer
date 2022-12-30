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
               :pageGap="GAP"
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

// 预览页边距
const GAP = 6;

const props = defineProps({
  previewSize: {
    type: Number,
    default: 5, // 预览页数
  },
  pdfFileSource: Object, // pdf 文件流对象
  pageClick: Function, // 预览页单击事件
  step: {
    type: String,
    default: "total", // 翻页步长
  },
  currentPage: Number, // 当前选中页码
  totalPage: Number // pdf 文件总页数
});

const selectorConfig = {
  width: 150,
  direction: "horizontal",
};

const containerStyle = {
  width: `${props.previewSize * (selectorConfig.width + 2 * GAP + 2)}px`,
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
  totalPage: props.totalPage,
  gap: GAP
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
  }
}
</style>
