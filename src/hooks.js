import { ref, watch, onMounted, onBeforeUnmount, toRefs, isRef } from "vue";
import * as PdfJs from "pdfjs-dist/legacy/build/pdf.js";

const workerSrc = require("pdfjs-dist/build/pdf.worker.entry");

import { _debounce } from "./util";

function usePdfSource(src) {
  const fileSource = ref(); // 文件流
  const loading = ref(); // 源文件加载状态
  const total = ref(0); // 总页数

  // 读取文件流
  const readSource = (source) => {
    // 保存 pdf 文件流
    fileSource.value = source;

    // 获取pdf文件的总页数
    total.value = fileSource.value.numPages;

    loading.value = false;
  };

  // 请求文件流
  const fetchFileSource = () => {
    loading.value = true;

    // 设定pdfjs的 workerSrc 参数
    PdfJs.GlobalWorkerOptions.workerSrc = workerSrc;
    const fileSrc = isRef(src) ? src.value : src;
    const loadingTask = PdfJs.getDocument(fileSrc);

    // 加载 pdf 文件流
    loadingTask.promise.then(readSource).catch((error) => {
      loading.value = false;
      throw error;
    });
  };

  watch(
    src,
    () => {
      if (src.value) {
        fetchFileSource();
      }
    },
    { immediate: true }
  );

  return {
    fileSource,
    total,
    loading,
  };
}

function usePdfRender(options) {
  const { id, width, height, fileSource } = options;

  const pdfScale = ref(1.0); // 初始缩放比
  const alreadyRenderedPages = ref(new Set());

  // 计算画布尺寸
  const calcCanvasSize = (page) => {
    // 原始视窗尺寸
    const initialViewport = page.getViewport({ scale: pdfScale.value });
    const { width: rawWidth, height: rawHeight } = initialViewport;

    // 应用视窗尺寸
    let applyWidth, applyHeight, applyRatio, applyViewport;

    // 计算主窗口应用尺寸
    if (width && !height) {
      applyWidth = width;
      applyRatio = width / rawWidth;
      applyHeight = rawHeight * applyRatio;
    } else if (height && !width) {
      applyHeight = height;
      applyRatio = height / rawHeight;
      applyWidth = rawWidth * applyRatio;
    } else if (width && height) {
      if (width > height) {
        applyHeight = height;
        applyRatio = height / rawHeight;
        applyWidth = rawWidth * applyRatio;
      } else if (width < height) {
        applyWidth = width;
        applyRatio = width / rawWidth;
        applyHeight = rawHeight * applyRatio;
      } else {
        applyWidth = width;
        applyHeight = height;
        applyRatio = width / rawWidth;
      }
    } else if (!width && !height) {
      applyRatio = pdfScale.value;
      [applyWidth, applyHeight] = [rawWidth, rawHeight];
    }

    // 应用视窗
    applyViewport = page.getViewport({ scale: pdfScale.value * applyRatio });

    return { applyWidth, applyHeight, applyViewport };
  };

  // 创建画布
  const createContext = (page, pageNum) => {
    // 获取页面中的canvas元素
    const canvasId = `${id}-${pageNum}`;
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const bsr =
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio ||
      1;
    const ratio = dpr / bsr;

    let { applyWidth, applyHeight, applyViewport } = calcCanvasSize(page);

    [canvas.width, canvas.height] = [applyWidth * ratio, applyHeight * ratio];

    canvas.style.width = `${applyWidth}px`;
    canvas.style.height = `${applyHeight}px`;

    // 设置当pdf文件处于缩小或放大状态时，可以拖动
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const context = {
      canvasContext: ctx,
      viewport: applyViewport,
    };

    return context;
  };

  // 绘制页面
  const renderPage = (pageNum = 1, state) => {
    if (alreadyRenderedPages.value.has(pageNum)) return;

    const source = isRef(fileSource) ? fileSource.value : fileSource;
    if (!source) return;

    isRef(state) && (state.value = true);
    return source.getPage(pageNum).then((page) => {
      const context = createContext(page, pageNum);

      // 将pdf文件的内容渲染到canvas中
      window.requestAnimationFrame(() => page.render(context));

      // 记录已渲染过的页
      alreadyRenderedPages.value.add(pageNum);
      isRef(state) && (state.value = false);
    });
  };

  return {
    renderPage,
  };
}

function usePageSwitch(initialPage, total, callback) {
  const page = ref(initialPage.value);
  const rendering = ref(false);

  const prev = _debounce(() => {
    if (!rendering.value) {
      page.value > 1 && (page.value -= 1);
    }
  }, 500);

  const next = _debounce(() => {
    if (!rendering.value) {
      page.value < total.value && (page.value += 1);
    }
  }, 500);

  const to = () => {
    page.value = initialPage.value;

    if (!alreadyRenderedPages.value.has(initialPage.value)) {
      alreadyRenderedPages.value.add(initialPage.value);
      rendering.value = true;
      callback(initialPage.value).then(() => {
        rendering.value = false;
      });
    }
  };

  const alreadyRenderedPages = ref(new Set([1, 2]));

  const renderPage = () => {
    // 渲染当前页
    if (page.value > 1 && !alreadyRenderedPages.value.has(page.value)) {
      alreadyRenderedPages.value.add(page.value);
      rendering.value = true;
      callback(page.value).then(() => {
        rendering.value = false;
      });
    } else {
      // 渲染下一页
      if (!alreadyRenderedPages.value.has(page.value + 1)) {
        alreadyRenderedPages.value.add(page.value + 1);
        rendering.value = true;
        callback(page.value + 1).then(() => {
          rendering.value = false;
        });
      }
    }
  };

  // 前后翻页
  watch(page, renderPage);
  // 指定跳转
  watch(initialPage, to);

  return {
    prev,
    next,
    page,
    rendering,
    alreadyRenderedPages,
  };
}

function usePageScroll(page, scrollDistance) {
  const refScrollContainer = ref();

  watch(page, () => {
    const scrollConfig = {
      left: scrollDistance * (page.value - 1),
    };

    refScrollContainer.value.scrollTo(scrollConfig);
  });

  return {
    refScrollContainer,
  };
}

function useLazyLoad(scrollContainer, targetContainer, callback) {
  const observer = ref();

  onMounted(() => {
    const config = {
      root: scrollContainer.value,
      threshold: 0.2,
    };

    observer.value = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry.intersectionRatio >= config.threshold) {
        callback();
      }
    }, config);

    observer.value.observe(targetContainer.value);
  });

  onBeforeUnmount(() => {
    observer.value.disconnect();
  });
}

function useInViewport(scrollContainer, targetContainer) {
  const isInViewport = ref(false);
  const observer = ref();

  onMounted(() => {
    const config = {
      root: scrollContainer.value,
      threshold: 0,
    };

    observer.value = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry.intersectionRatio > config.threshold) {
        isInViewport.value = true;
      } else {
        isInViewport.value = false;
      }
    }, config);

    observer.value.observe(targetContainer.value);
  });

  onBeforeUnmount(() => {
    observer.value.disconnect();
  });

  return {
    isInViewport,
  };
}

export {
  usePdfSource,
  usePdfRender,
  usePageSwitch,
  usePageScroll,
  useLazyLoad,
  useInViewport,
};
