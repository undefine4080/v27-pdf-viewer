import { ref, watch, onMounted, onBeforeUnmount, computed, toRefs, isRef } from "vue";
import * as PdfJs from "pdfjs-dist/legacy/build/pdf.js";
import { _debounce } from "./util";
const workerSrc = require("pdfjs-dist/build/pdf.worker.entry");

function useScaling(enable, callback) {
  const maxScaleFactor = 2.5;
  const minScaleFactor = 1.0;

  const scaleFactor = ref(1.0);
  const refScaleContainer = ref();
  const maxScale = ref(false);
  const minScale = ref(false);
  const refTips = ref();

  const showTips = () => {
    refTips.value.style.visibility = 'visible';
    setTimeout(() => {
      refTips.value.style.visibility = 'hidden';
    }, 3000);
  };

  const scaling = (event) => {
    const { deltaY } = event;
    const wheelValue = deltaY > 0 ? 0.1 : -0.1;

    if (scaleFactor.value >= maxScaleFactor) {
      maxScale.value = true;
    }

    if (scaleFactor.value <= minScaleFactor) {
      minScale.value = true;
    }

    if (maxScale.value && wheelValue < 0) {
      scaleFactor.value += wheelValue;
      maxScale.value = minScale.value = false;
    } else if (minScale.value && wheelValue > 0) {
      scaleFactor.value += wheelValue;
      maxScale.value = minScale.value = false;
    } else if (!maxScale.value && !minScale.value) {
      scaleFactor.value += wheelValue;
    }

    if (maxScale.value || minScale.value) {
      showTips();
    }
  };

  const scaleCanvas = () => {
    refScaleContainer.value.style.transform = `scale(${scaleFactor.value})`;

    const { clientWidth, clientHeight } = refScaleContainer.value;

    const newWidth = Math.floor(clientWidth * scaleFactor.value);
    const newHeight = Math.floor(clientHeight * scaleFactor.value);

    // setTimeout(() => {
    //   callback(newWidth, newHeight);
    // }, 300);
  };

  const resetCanvas = () => {
    refScaleContainer.value.style.transform = 'scale(1)';
    scaleFactor.value = 1.0;
    minScale.value = false;
    maxScale.value = false;
  };

  onMounted(() => {
    refScaleContainer.value.addEventListener('wheel', scaling);
  });

  onBeforeUnmount(() => {
    refScaleContainer.value.removeEventListener('wheel', scaling);
  });

  watch(enable, () => {
    if (enable.value) {
      setTimeout(showTips, 1000);
    } else {
      resetCanvas();
    }
  });

  watch(scaleFactor, scaleCanvas);

  return {
    refScaleContainer,
    scaleFactor,
    minScale,
    maxScale,
    refTips,
    resetCanvas,
  };
}

function usePdfSource(src) {
  const fileSource = ref();
  // 源文件加载状态 true-加载中 false-加载完成 undefined-加载失败 null-路径不存在
  const loading = ref(true);
  const total = ref(0);

  const readSource = (source) => {
    fileSource.value = source;
    total.value = fileSource.value.numPages;
    loading.value = false;
  };

  const fetchFileSource = () => {
    loading.value = true;

    // 设定pdfjs的 workerSrc 参数
    PdfJs.GlobalWorkerOptions.workerSrc = workerSrc;

    // 加载 pdf 文件流
    const fileSrc = isRef(src) ? src.value : src;
    if (fileSrc) {
      const loadingTask = PdfJs.getDocument(fileSrc);
      loadingTask.promise.then(readSource).catch((error) => {
        loading.value = undefined;
        throw error;
      });
    } else {
      loading.value = null;
      console.error('src requires a string but received nothing');
    }
  };

  watch(
    src,
    () => {
      fetchFileSource();
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
  let { id, width, height, fileSource } = options;

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

  // 懒渲染页面
  const lazyRenderPage = (pageNum = 1, state) => {
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

  // 重渲染当前页面
  const reRenderPage = (width, height, pageNum) => {
    width = width;
    height = height;

    const source = isRef(fileSource) ? fileSource.value : fileSource;

    return source.getPage(pageNum).then((page) => {
      const context = createContext(page, pageNum);
      window.requestAnimationFrame(() => page.render(context));
    });
  };

  // 渲染指定页面
  const renderPage = (pageNum) => {
    const source = isRef(fileSource) ? fileSource.value : fileSource;

    return source.getPage(pageNum).then((page) => {
      const context = createContext(page, pageNum);
      window.requestAnimationFrame(() => page.render(context));
    });
  };

  return {
    lazyRenderPage,
    reRenderPage,
    renderPage
  };
}

function usePageSwitch(initialPage, total, callback) {
  const page = ref(initialPage.value);
  const rendering = ref(false);
  const alreadyRenderedPages = ref(new Set([1, 2]));

  const render = pageNum => {
    alreadyRenderedPages.value.add(pageNum);
    setTimeout(() => {
      rendering.value = true;
      callback(pageNum).then(() => {
        rendering.value = false;
      });
    }, 500);
  };

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
      render(initialPage.value);
    }
  };

  const renderPage = () => {
    // 渲染当前页
    if (page.value > 1 && !alreadyRenderedPages.value.has(page.value)) {
      render(page.value);
    } else {
      // 渲染下一页
      if ((page.value + 1) <= total.value && !alreadyRenderedPages.value.has(page.value + 1)) {
        render(page.value + 1);
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
  useScaling
};
