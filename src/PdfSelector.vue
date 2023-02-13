<template>
  <div class="pdfSelector"
    ref="refViewContainer">
    <div class="pdfSelector__view"
      ref="refScrollContainer"
      :style="{ width: PREVIEW_SIZE.width + 'px', height: height + 'px' }">
      <div class="pdfSelector__pages"
        :style="{ width: PREVIEW_SIZE.width + 'px' }">
        <pdf-page v-for="pageIndex in total"
          :key="pageIndex"
          :id="`${id}-${pageIndex}`"
          :page-index="pageIndex"
          :scroll-container="refViewContainer"
          :selected-page="currentPage"
          @click.native="selectPage(pageIndex)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, toRef, inject, watch, provide } from "vue";
import { usePdfRender } from "./hooks";
import PdfPage from "./PdfPage.vue";

const PREVIEW_SIZE = {
  width: 180,
  height: 250,
  padding: 30,
};

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  selectorPosition: {
    type: String,
    required: false,
    default: "left", // pdf 选择器的位置
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
  width: {
    type: Number,
    required: false,
    default: 150,
  },
  height: {
    type: Number,
    required: false,
    default: 220,
  },
  loading: {
    type: Boolean,
    required: true,
    default: true,
  },
});

const refViewContainer = ref();
const refScrollContainer = ref();

let direction = "vertical";
if (props.selectorPosition === "left" || props.selectorPosition === "right") {
  direction = "vertical";
} else if (
  props.selectorPosition === "top" ||
  props.selectorPosition === "bottom"
) {
  direction = "horizontal";
} else {
  console.warn(
    "the selectorPosition may not correct, it must include 'left','right','top','bottom' please check the value"
  );
}

const fileSource = toRef(props, "fileSource");
const { renderPage } = usePdfRender({
  id: props.id,
  height: PREVIEW_SIZE.height - PREVIEW_SIZE.padding,
  width: PREVIEW_SIZE.width - PREVIEW_SIZE.padding,
  fileSource,
});
provide("renderPage", renderPage);

const currentPage = ref(props.page);
const selectPage = (pageIndex) => {
  currentPage.value = pageIndex;
};
watch(props, () => (currentPage.value = props.page));

const updateCurPage = inject("updateCurPage");
watch(currentPage, () => updateCurPage(currentPage.value));

const scrollToSelectedPage = (pageIndex, frame) => {
  const scrollConfig = {
    top: frame * pageIndex - 2 * frame,
    behavior: "smooth",
  };
  refScrollContainer.value.scrollTo(scrollConfig);
};
provide("scrollToSelectedPage", scrollToSelectedPage);

</script>

<style lang="scss">
.pdfSelector {
  overflow: hidden;

  &__container {
    display: flex;
    flex-flow: row nowrap;
    height: max-content;
    position: relative;
  }

  &__view {
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    position: relative;

    &::-webkit-scrollbar {
      height: 3px;
      width: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: rgb(218, 218, 218);
    }

    &::-webkit-scrollbar-thumb {
      box-shadow: inset 0 0 6px rgb(65, 65, 65);
    }
  }

  &__pages {
    display: flex;
    flex-flow: column;
    align-items: center;
  }

  &__pagination {
    padding: 0 10px;

    svg {
      position: relative;
      left: calc(50% - 10px);
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
