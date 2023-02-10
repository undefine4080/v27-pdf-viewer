<template>
  <div class="pdfCore__container"
    :style="{ minHeight: height + 'px' }">
    <div class="pdfCore__pagination"
      :class="{ 'pdfCore__pagination-disabled': page === 1 || rendering }"
      @click="prev"> <arrow-left /> </div>

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
    </div>

    <div class="pdfCore__pagination"
      :class="{ 'pdfCore__pagination-disabled': page === total || rendering }"
      @click="next"> <arrow-right /> </div>
  </div>
</template>

<script setup>
import { inject, watch, watchEffect, toRef, nextTick } from "vue";
import ArrowLeft from "./assets/ArrowLeft.vue";
import ArrowRight from "./assets/ArrowRight.vue";
import { usePdfRender, usePageSwitch, usePageScroll } from './hooks';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: false,
    default: 300
  },
  height: {
    type: Number,
    required: false,
  },
  fileSource: {
    required: true
  },
  page: {
    type: Number,
    required: false,
    default: 1
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  loading: {
    type: Boolean,
    required: true,
    default: true
  }
});

const fileSource = toRef(props, 'fileSource');
const { renderPage } = usePdfRender({ ...props, fileSource });

// 首次绘制
const loading = toRef(props, 'loading');
watch(loading, () => {
  if (!loading.value) {
    nextTick(() => {
      renderPage(1).then(renderPage(2));
    });
  }
});

const { prev, next, page, rendering } = usePageSwitch(props, renderPage);

const updateCurPage = inject('updateCurPage');
watchEffect(() => updateCurPage(page));

const { refScrollContainer } = usePageScroll(page, props.width, props.height);

</script>
<style lang="less">
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
  }

  &__pages {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
  }

  &__page {
    background: darkgray;
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
