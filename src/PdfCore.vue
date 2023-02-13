<template>
  <div class="pdfCore__container"
    :style="{ minHeight: height + 'px' }">
    <div class="pdfCore__pagination"
      :class="{ 'pdfCore__pagination-disabled': currentPage === 1 }"
      @click="prev">
      <arrow-left />
    </div>

    <div class="pdfCore__view"
      ref="refScrollContainer"
      :style="{ width: width + 'px' }">
      <div class="pdfCore__pages">
        <canvas v-for="pageIndex in total"
          class="pdfCore__page"
          :id="`${id}-${pageIndex}`"
          :key="pageIndex"
          :width="width"></canvas>
      </div>

      <div class="pdfCore__loading"
        :style="{ width: width + 'px', height: height + 'px' }"
        v-if="rendering">
        <span>加载中</span>
      </div>
    </div>

    <div class="pdfCore__pagination"
      :class="{ 'pdfCore__pagination-disabled': currentPage === total }"
      @click="next">
      <arrow-right />
    </div>
  </div>
</template>

<script setup>
import { inject, watch, ref, toRef, toRefs } from "vue";
import ArrowLeft from "./assets/ArrowLeft.vue";
import ArrowRight from "./assets/ArrowRight.vue";
import { usePdfRender, usePageSwitch, usePageScroll } from "./hooks";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: false,
    default: 300,
  },
  height: {
    type: Number,
    required: false,
  },
  fileSource: {
    required: true,
  },
  page: {
    type: Number,
    required: false,
    default: 1,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  loading: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const { fileSource, loading, total } = toRefs(props);
const rendering = ref(true);

const { renderPage } = usePdfRender({ ...props, fileSource });

// 首次绘制
watch(loading, () => {
  if (!loading.value && fileSource.value) {
    rendering.value = true;
    renderPage(1).then(() => {
      rendering.value = false;
      renderPage(2);
    });
  }
});

const currentPage = ref(props.page);
watch(props, () => {
  currentPage.value = props.page;
});

const { prev, next, page } = usePageSwitch(currentPage, total, renderPage);

const updateCurPage = inject("updateCurPage");
watch(page, () => updateCurPage(page.value));

const { refScrollContainer } = usePageScroll(currentPage, props.width);
</script>
<style lang="scss">
.pdfCore {
  &__container {
    display: flex;
    flex-flow: row nowrap;
    height: max-content;
    position: relative;
  }

  &__view {
    overflow: hidden;
    display: flex;
    align-items: center;
    background-color: white;
  }

  &__pages {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
  }

  &__pagination {
    padding: 0 10px;

    svg {
      position: relative;
      top: calc(50% - 10px);
      cursor: pointer;
    }

    &-disabled {
      cursor: not-allowed;
      filter: grayscale(0.5);

      svg {
        cursor: not-allowed;
        filter: grayscale(0.5);
      }
    }
  }

  &__loading {
    position: absolute;
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
