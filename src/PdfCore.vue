<template>
  <div class="pdfCore__container" :style="{ minHeight: height + 'px' }">
    <div
      class="pdfCore__pagination"
      :class="{ 'pdfCore__pagination-disabled': currentPage === 1 }"
      @click="prev"
    >
      <arrow-left />
    </div>

    <div
      class="pdfCore__view"
      ref="refScrollContainer"
      :style="{ width: width + 'px' }"
    >
      <div class="pdfCore__pages">
        <canvas
          v-for="pageIndex in total"
          class="pdfCore__page"
          :id="`${id}-${pageIndex}`"
          :key="pageIndex"
          :width="width"
        ></canvas>
      </div>
    </div>

    <div
      class="pdfCore__pagination"
      :class="{ 'pdfCore__pagination-disabled': currentPage === total }"
      @click="next"
    >
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

const { renderPage } = usePdfRender({ ...props, fileSource });

// 首次绘制
watch(loading, () => {
  if (!loading.value && fileSource.value) {
    renderPage(1).then(renderPage(2));
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
    background-color: rgb(223, 223, 223);
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
}
</style>
