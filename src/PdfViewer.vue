<template>
  <div class="pdf"
    :style="{ width: width + 88 + 'px', minHeight: height + 50 + 'px' }">
    <div class="pdfPageNo">第{{ currentPage }}/{{ total }}页
    </div>

    <div class="pdfView"
      v-if="!loading">
      <PdfCore id="pdf-canvas-core"
        :width="width"
        :height="height"
        :fileSource="fileSource"
        :page="page"
        :total="total" />
    </div>

    <div class="pdfView__loading"
      :style="{ width: width + 'px', height: height + 'px' }"
      v-else>
      <span>文件加载中</span>
    </div>
  </div>
</template>
<script setup>
import { ref, provide } from "vue";
import PdfCore from "./PdfCore.vue";
import { usePdfSource } from './newHooks';

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
  direction: {
    type: String,
    required: false,
    default: "horizontal", // 选择器排列方向
  },
  previewSize: {
    type: Number,
    required: false,
    default: 5, // 选择器预览页数
  },
  step: {
    type: String,
    required: false,
    default: 'total' // 选择器翻页模式，single-每次翻一页，total-每次翻 previewSize 页
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
.pdfPageNo {
  height: 50px;
  line-height: 50px;
  text-align: center;
  color: azure;
  user-select: none;
}

.pdf {
  position: relative;
}

.pdfView {
  &__loading {
    background: rgb(213, 213, 213);
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    left: 44px;
    top: 50px;
  }
}
</style>
