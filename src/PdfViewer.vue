<template>
  <div class="pdf">
    <div class="pdfPageNo">第{{ currentPage }}/{{ totalPage }}页
    </div>
    <div class="pdfView">
      <slot name="pagePrev">
        <div class="pdfView__pagination"
             v-show="pdfFileSource"
             @click="prev"> <arrow-left /> </div>
      </slot>

      <div ref="refPdfContainer"
           class="pdfView__container"
           :style="viewerContainerStyle">
        <PdfCore id="pdf-canvas-core"
                 :config="pdfCoreConfig"
                 :currentPage="pageIndex"
                 :src="src"
                 @onTotalPage="getTotalPage"
                 @onFileLoaded="handleFileLoaded"
                 @onRenderComplete="handleRenderComplete" />
      </div>

      <slot name="pageNext">
        <div class="pdfView__pagination"
             v-show="pdfFileSource"
             @click="next"> <arrow-right /> </div>
      </slot>
    </div>

    <PdfSelector v-if="selector && isRenderComplete"
                 :pdfFileSource="pdfFileSource"
                 :previewSize="previewSize"
                 :step="step"
                 :totalPage="totalPage"
                 :currentPage="currentPage"
                 @pageTurn="pageTurn" />
  </div>
</template>
<script setup>
import { ref, provide } from "vue";
import { usePageTurn } from "./hooks";
import ArrowLeft from "./assets/ArrowLeft.vue";
import ArrowRight from "./assets/ArrowRight.vue";
import PdfCore from "./PdfCore.vue";
import PdfSelector from "./PdfSelector.vue";

const props = defineProps({
  src: {
    type: String,
    required: true,
    default: '' // pdf 文件路径（本地文件或远程文件）
  },
  width: {
    type: Number,
    default: 400, // 查看器宽度
  },
  height: {
    type: Number,
    default: 600, // 查看器高度
  },
  selector: {
    type: Boolean,
    default: false,  // 启用选择器
  },
  direction: {
    type: String,
    default: "horizontal", // 选择器排列方向
  },
  previewSize: {
    type: Number,
    default: 5, // 选择器预览页数
  },
  step: {
    type: String,
    default: 'total'
  }, // 选择器翻页模式，single-每次翻一页，total-每次翻 previewSize 页
  currentPage: {
    type: Number,
    default: 1, // 查看器当前页码
  },
});

// 查看器必要参数
const pdfCoreConfig = {
  width: props.width,
  height: props.height,
  selector: props.selector,
};

const viewerContainerStyle = ref({
  width: `${props.width}px`,
  height: `${props.height}px`,
  flexDirection: props.direction === "horizontal" ? "row" : "column",
});

const pdfFileSource = ref(null);
const handleFileLoaded = (file) => (pdfFileSource.value = file);

const isRenderComplete = ref(false);
const handleRenderComplete = (isComplete) =>
  (isRenderComplete.value = isComplete);

const totalPage = ref(0);
const getTotalPage = (num) => totalPage.value = num;

const { prev, next, to, refPdfContainer, currentPage, turnDirection } = usePageTurn({
  isRenderComplete,
  direction: props.direction,
  previewSize: null,
  step: props.step,
  currentPage: props.currentPage,
  totalPage
});

const pageIndex = ref(props.currentPage);
const pageTurn = (pageNo) => {
  pageIndex.value = pageNo;
  to.value(pageNo);
};

provide('turnDirection', turnDirection);
</script>

<style lang="less">
.row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.pdfPageNo {
  text-align: center;
  color: azure;
}

.pdfView {
  width: max-content;
  .row();
  margin: 0 auto;
  position: relative;

  .pdfCore__page {
    border: none;
  }

  &__container {
    min-height: 600px;
    overflow: hidden;
    margin: 15px;
  }

  &__page {
    flex-shrink: 0;
  }

  &__pagination {
    .center();
    min-width: 50px;
    min-height: 50px;
    cursor: pointer;

    &:first-child {

    }

    &:last-child {

    }
  }

  &__selector {
    height: 280px;
    .row();
  }
}
</style>
