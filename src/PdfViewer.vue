<template>
  <div class="pdfViewer">
    <div class="pdfViewer__selector"
      :style="{ width: '180px' }"
      v-if="selector">
      <pdf-selector id="pdf-canvas-selector"
        :width="width"
        :height="height"
        :fileSource="fileSource"
        :page="currentPage"
        :total="total"
        :loading="loading" />
    </div>

    <div class="pdfViewer__viewer"
      :style="{ width: width + 136 + 'px', minHeight: height + 50 + 'px' }">
      <div class="pdfViewer__pageNo">第{{ currentPage }}/{{ total }}页</div>

      <div class="pdfViewer__view">
        <pdf-core id="pdf-canvas-core"
          :width="width"
          :height="height"
          :fileSource="fileSource"
          :page="currentPage"
          :total="total"
          :loading="loading" />
      </div>
    </div>

    <div class="pdfViewer__loading"
      v-if="loading === true">
      <span>文件加载中</span>
    </div>

    <div class="pdfViewer__loading"
      :class="{'pdfViewer__loading-error': loading === undefined}"
      v-if="loading === undefined">
      <span>文件加载失败，请刷新页面</span>
    </div>
  </div>
</template>
<script setup>
import { ref, provide, toRefs } from "vue";
import { usePdfSource } from "./hooks";
import PdfCore from "./PdfCore.vue";
import PdfSelector from "./PdfSelector.vue";

const props = defineProps({
  src: {
    type: String,
    required: true,
    default: "", // pdf 文件路径（本地文件或远程文件）
  },
  width: {
    type: Number,
    required: false,
    default: 400, // 查看器宽度
  },
  height: {
    type: Number,
    required: false, // 查看器高度
  },
  selector: {
    type: Boolean,
    required: false,
    default: false, // 启用选择器
  },
  selectorPosition: {
    type: String,
    required: false,
    default: "left", // pdf 选择器的位置
  },
  page: {
    type: Number,
    required: false,
    default: 1, // 查看器当前页码
  },
});

const currentPage = ref(props.page);
provide("updateCurPage", (num) => (currentPage.value = num));

const { src } = toRefs(props);
const { fileSource, total, loading } = usePdfSource(src);

</script>

<style lang="scss">
.pdfViewer {
  display: flex;
  align-items: center;
  padding: 30px;
  position: relative;

  &__pageNo {
    height: 50px;
    line-height: 50px;
    text-align: center;
    user-select: none;
  }

  &__loading {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background: rgb(224, 224, 224);
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      display: block;
      $size: 20px;
      color: rgb(96, 96, 96);
      font-size: 20px;

      &::before {
        content: "";
        display: block;
        width: $size;
        height: $size;
        border-radius: 50%;
        position: relative;
        left: calc(50% - 10px);
        top: -5px;
        border: 3px dashed rgb(180, 180, 180);
        animation: 2s linear 0s infinite running rotate;
      }
    }

    &-error {
      span {
        &::before {
          display: none;
        }
      }
    }
  }

  &__viewer {
    position: relative;
    margin-left: 150px;
  }

  &__view {
    position: relative;
  }

  &__selector {
    position: relative;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
