<template>
  <div class="pdfCore"
       :style="{ alignItems: isRendered ? 'center' : 'flex-start' }">
    <div class="pdfCore__loading"
         :style="{ width: width + 'px', height: height + 'px' }"
         v-if="loaded !== true">
      <div v-if="loaded === false">文件载入失败...请刷新页面</div>

      <div v-if="loaded === null">文件加载中...</div>
    </div>

    <canvas v-for="pageIndex in totalPages"
            :id="id + pageIndex"
            :key="pageIndex"
            :class="canvasClassList(pageIndex)"
            @click="handleViewClick(pageIndex)"></canvas>
  </div>
</template>

<script setup>
import { defineProps, toRefs, ref } from "vue";
import { usePDF } from "./hooks";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
  fileSource: Object,
  currentPage: Number,
  pageTurn: Function,
  src: String,
  modelValue: Number
});

const emit = defineEmits(["onFileLoaded", "onRenderComplete", 'update:modelValue', 'onTotalPage']);

const fileLoaded = (fileSource) => {
  emit("onFileLoaded", fileSource);
};

const isRendered = ref(false);
const renderComplete = (isComplete) => {
  emit("onRenderComplete", isComplete);
  isRendered.value = isComplete;
};

const { fileSource, currentPage, config, id, src } = toRefs(props);
const { width, height } = config.value;

const setTotalPage = (value) => emit('onTotalPage', value);

const { loaded, totalPages } = usePDF({
  id: id.value,
  width,
  height,
  src,
  fileSource: fileSource.value,
  currentPage,
  fileLoaded,
  renderComplete,
  setTotalPage
});

const pageIndex = ref(1);
const handleViewClick = (pageNo) => {
  pageIndex.value = pageNo;
  props.pageTurn(pageNo);
};

const canvasClassList = (pageIndex) => {
  let classList;
  if (props.currentPage === pageIndex) {
    classList = "pdfCore__page pdfCore__page-selected";
  } else {
    classList = "pdfCore__page";
  }
  return classList;
};

</script>
<style lang="less">
.pdfCore {
  display: flex;
  flex-wrap: nowrap;
  width: max-content;

  &__page {
    &-selected {
      border: 2px solid blue;
      border-radius: 2px;
    }
  }

  &__loading {
    position: absolute;
    z-index: 100;
    left: 15;
    top: 15;
    color: black;
    background-color: rgb(163, 163, 163);
  }
}
</style>
