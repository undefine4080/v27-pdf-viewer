<template>
  <div class="pdfPage__container">
    <canvas :id="id"
      ref="refCanvas"
      class="pdfPage"
      :class="{ pdfPage__selected: !loading && selectedPage === pageIndex }">
    </canvas>

    <div class="pdfPage__loading"
      v-if="loading">
      <span>加载中</span>
    </div>
  </div>
</template>

<script setup>
import { ref, toRef, inject, watch } from "vue";
import { useLazyLoad, useInViewport } from "./hooks";

const props = defineProps({
  id: {
    type: String,
  },
  pageIndex: {
    type: Number,
  },
  scrollContainer: {
    type: HTMLDivElement,
  },
  selectedPage: {
    type: Number,
  },
});

const refCanvas = ref();
const renderPage = inject("renderPage");
const scrollContainer = toRef(props, "scrollContainer");
const loading = ref(true);

const callback = () => {
  return renderPage(props.pageIndex, loading);
};

useLazyLoad(scrollContainer, refCanvas, callback);

// 自动定位滚动
const { isInViewport } = useInViewport(scrollContainer, refCanvas);
const scrollToSelectedPage = inject("scrollToSelectedPage");
watch(props, () => {
  if (props.selectedPage === props.pageIndex) {
    !isInViewport.value && scrollToSelectedPage(props.selectedPage, refCanvas.value.clientHeight);
  }
});
</script>
<style lang="scss">
.pdfPage {
  padding: 10px;

  &:hover {
    cursor: pointer;
  }

  &__container {
    position: relative;
    display: flex;
    background-color: #f0f0f0;
    justify-content: center;
  }

  &__selected {
    border: 2px red solid;
  }

  &__loading {
    width: 150px;
    height: 90%;
    position: absolute;
    top: 5%;
    background-color: #f8f8f8;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      display: block;
      $size: 20px;
      color: rgb(169, 169, 169);
      font-size: 14px;

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
