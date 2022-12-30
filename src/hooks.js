import { nextTick, ref, onMounted, watch, watchEffect, isRef } from "vue";
import * as PdfJs from "pdfjs-dist/legacy/build/pdf.js";

const workerSrc = require("pdfjs-dist/build/pdf.worker.entry");

function _throttle(fn, wait = 200) {
  let last, timer, now;
  return function () {
    now = Date.now();
    if (last && now - last < wait) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = now;
        fn.call(this, ...arguments);
      }, wait);
    } else {
      last = now;
      fn.call(this, ...arguments);
    }
  };
}

function usePDF(options) {
  const {
    id,
    width,
    height,
    fileSource,
    fileLoaded,
    renderComplete,
    setTotalPage
  } = options;

  const pdfDoc = ref();
  const pdfScale = ref(1.0);
  const loaded = ref();
  const totalPages = ref(0);
  const alreadyRenderPages = ref(0);
  const fileLoadingProcess = ref(0);
  const pageRenderProcess = ref(0);

  const readSource = (source) => {
    // 保存 pdf 文件流
    pdfDoc.value = source;
    // 提交文件流到外部
    fileLoaded(source);
    fileLoadingProcess.value = 100;

    // 获取pdf文件的总页数
    totalPages.value = pdfDoc.value.numPages;
    setTotalPage(totalPages.value);

    nextTick(() => {
      // 绘制主窗口
      renderPage().then(() => {
        renderRestPage();
      });

      loaded.value = true;
    });
  };

  const loadFromSource = (source) => {
    readSource(source);
  };

  const loadFromSrc = (src) => {
    loaded.value = null;

    // 设定pdfjs的 workerSrc 参数
    PdfJs.GlobalWorkerOptions.workerSrc = workerSrc;
    const loadingTask = PdfJs.getDocument(src);

    // 加载 pdf 文件流
    loadingTask.promise
      .then(readSource)
      .catch(error => {
        loaded.value = false;
        throw error;
      });
  };

  const recordProcess = () => {
    alreadyRenderPages.value += 1;
    pageRenderProcess.value = (alreadyRenderPages.value / totalPages.value) * 100;
  };

  const renderPage = (pageNum = 1) => {
    return pdfDoc.value.getPage(pageNum).then((page) => {
      recordProcess();
      const context = createContext(page, pageNum);

      // 将pdf文件的内容渲染到canvas中
      page.render(context);

      if (pageNum > 1) {
        if (pageNum < totalPages.value) {
          const render = () => renderPage(pageNum + 1);
          window.requestAnimationFrame(render);
        } else {
          renderComplete(true);
        }
      }
    });
  };

  const renderRestPage = () => {
    renderPage(2);
  };

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

  const createContext = (page, pageNum) => {
    // 获取页面中的canvas元素
    const canvasId = id + pageNum;
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

  const main = (src) => {
    if (fileSource) {
      loadFromSource(fileSource);
    } else if (src) {
      loadFromSrc(src);
    }
  };

  watchEffect(() => {
    if (options.src.value) {
      // src 加载
      main(options.src.value);
    } else {
      // fileSource 加载
      main();
    }
  });

  return {
    totalPages,
    loaded,
    pageRenderProcess
  };
}

function usePageTurn(options) {
  const {
    isRenderComplete, // 渲染是否完成
    direction, // 预览排列方向
    previewSize, // 预览页数
    step = "single", // 翻页步长
    currentPage = 1, // 当前页码
    totalPage, // 总页数
    gap = 0, // 页边距
  } = options;

  const refPdfContainer = ref();
  const frame = ref();
  const prev = ref(() => { });
  const next = ref(() => { });
  const to = ref(() => { });

  const lastPageNo = ref(1);
  const curPageNo = ref(currentPage);

  // 翻页方向，prev-往前 next-往后 null-未设置
  const turnDirection = ref(null);

  onMounted(() => {
    const { clientWidth, clientHeight } = refPdfContainer.value;
    frame.value = direction === "horizontal" ? clientWidth : clientHeight;

    const offset = (step === "single" ? frame.value / (previewSize ?? 1) : frame.value) + gap;

    prev.value = _throttle(() => {
      if (curPageNo.value > 1) {
        refPdfContainer.value.scrollBy({ left: -offset, behavior: "smooth" });
        curPageNo.value = lastPageNo.value - 1;
        lastPageNo.value = curPageNo.value;
        turnDirection.value = 'prev';
      }
    }, 1000);

    next.value = _throttle(() => {
      const total = isRef(totalPage) ? totalPage.value : totalPage;
      if (curPageNo.value < total) {
        refPdfContainer.value.scrollBy({ left: offset, behavior: "smooth" });
        curPageNo.value = lastPageNo.value + 1;
        lastPageNo.value = curPageNo.value;
        turnDirection.value = 'next';
      }
    }, 1000);

    to.value = (pageIndex) => {
      turnDirection.value = null;
      // previewSize 不存在，说明是 PdfViewer
      if (!previewSize) {
        curPageNo.value = pageIndex;
        const step = pageIndex - lastPageNo.value;
        const config = { left: (frame.value + gap) * step };
        refPdfContainer.value.scrollBy(config);
        lastPageNo.value = curPageNo.value;
      }
    };
  });

  watch(isRenderComplete, () => {
    to.value(currentPage);
  });

  return { prev, next, to, refPdfContainer, currentPage: curPageNo, turnDirection };
}

export { usePDF, usePageTurn };
