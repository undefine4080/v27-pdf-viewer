# hw-pdf-viewer

一个 PDF 查看器组件，可以在网页上显示本地或远程的 PDF 文件，特性如下：

+ PDF 查看以及前后翻页
+ PDF 文件预览以及页面选择功能
+ 显示当前页码以及总页数
+ 预览条位置支持修改
+ 页面旋转以及缩放可配置
+ 支持输入数字跳转到指定页码
+ 远程获取 PDF 时，支持显示下载进度百分比
+ 单页 PDF 支持全屏预览


## 技术栈

+ 基于 Mozila 的 `pdf.js` 实现 PDF 预览相关功能
+ 采用 Vue 2.7 Hooks 方式开发

## 测试

提供了完整的单元测试，测试覆盖率 98% 以上，所有测试用例请查看 `tests` 目录