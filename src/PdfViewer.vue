<template>
  <div class="pdfViewer">
    <div class="pdfViewer__selector"
      :style="{ width: '180px' }">
      <pdf-selector id="pdf-canvas-selector"
        :width="width"
        :height="height"
        :fileSource="fileSource"
        :page="page"
        :total="total"
        :loading="loading" />

      <div class="pdfViewer__selector-loading"
        v-if="loading">
        <span>文件加载中</span>
      </div>
    </div>

    <div class="pdfViewer__viewer"
      :style="{ width: width + 88 + 'px', minHeight: height + 50 + 'px' }">
      <div class="pdfViewer__pageNo">第{{ currentPage }}/{{ total }}页
      </div>

      <div class="pdfViewer__view">
        <pdf-core id="pdf-canvas-core"
          :width="width"
          :height="height"
          :fileSource="fileSource"
          :page="page"
          :total="total"
          :loading="loading" />

        <div class="pdfViewer__view-loading"
          :style="{ width: width + 'px', height: height + 'px' }"
          v-if="loading">
          <span>文件加载中</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, provide } from "vue";
import { usePdfSource } from './newHooks';
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
    required: false,
    default: 400, // 查看器宽度
  },
  height: {
    type: Number,
    required: false,
    default: 600, // 查看器高度
  },
  selector: {
    type: Boolean,
    required: false,
    default: false,  // 启用选择器
  },
  selectorPosition: {
    type: String,
    required: false,
    default: 'left' // pdf 选择器的位置
  },
  page: {
    type: Number,
    required: false,
    default: 1, // 查看器当前页码
  },
});

const currentPage = ref(props.page);
provide('updateCurPage', (num) => currentPage.value = num);

const { fileSource, total, loading } = usePdfSource(props.src);
</script>

<style lang="less">
.pdfViewer {
  display: flex;

  &__pageNo {
    height: 50px;
    line-height: 50px;
    text-align: center;
    color: azure;
    user-select: none;
  }

  &__viewer {
    position: relative;
  }

  &__view {
    position: relative;

    &-loading {
      position: absolute;
      left: 44px;
      top: 0;
      background: rgb(213, 213, 213);
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  &__selector {
    position: relative;

    &-loading {
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      background: rgb(213, 213, 213);
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
