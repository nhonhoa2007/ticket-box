# GHI CHÚ NGÀY 02: KIẾN TRÚC MODULAR, TSCONFIG, INTERCEPTOR & EXCEPTION FILTER

## 1. Bối cảnh & Đánh đổi kiến trúc

- **CommonJS vs ESM & Đường dẫn Import sạch:**
  - Chuẩn `NodeNext (ESM)` ép buộc ghi rõ phần mở rộng `.js` ngay cả khi viết file `.ts` (do Node.js cần đường dẫn chính xác khi chạy trên production).
  - Để code sạch và dùng được Path Alias (`@/*` trỏ tới `src/*`), cấu hình `CommonJS` kết hợp `"moduleResolution": "node"` và `"paths"` trong `tsconfig.json`.
  - **Sự cố TypeScript 6.0:** TS 6 cảnh báo deprecation với `baseUrl` và `node10`, xử lý triệt để bằng cách thêm `"ignoreDeprecations": "6.0"`, bỏ `resolvePackageJsonExports`, và chỉ giữ `"types": ["node"]` cho mã nguồn chạy của backend.

- **Singleton Pattern với PrismaService:**
  - Tuyệt đối không `new PrismaClient()` bừa bãi ở các Service để tránh cạn kiệt Connection Pool của PostgreSQL.
  - Kế thừa `PrismaClient`, tích hợp Lifecycle Hooks (`onModuleInit` để kết nối sớm, `onModuleDestroy` để giải phóng kết nối khi tắt server).
  - Bọc trong `PrismaModule` với decorator `@Global()` để toàn bộ ứng dụng dùng chung 1 instance duy nhất mà không cần import lặp lại ở từng module con.

---

## 2. Bản chất kỹ thuật ngầm

### A. Chuẩn hóa dữ liệu trả về với TransformInterceptor (RxJS)
- **Vấn đề:** Nếu không chuẩn hóa, mỗi API trả về một kiểu (object, array, message khác nhau), gây khó khăn cho Frontend (Next.js).
- **Cơ chế hoạt động:**
  - Đón dữ liệu sau khi Controller xử lý xong bằng toán tử `.pipe(map(...))` của RxJS.
  - Đóng gói mọi phản hồi thành công về một định dạng thống nhất:
    ```json
    {
      "statusCode": 200,
      "message": "Success",
      "data": { ... }
    }
    ```

### B. Bộ lọc lỗi toàn cục với AllExceptionsFilter
- **Vấn đề bảo mật:** Khi gặp lỗi hệ thống (bug logic, mất kết nối DB), NestJS có thể trả về lỗi 500 kèm Stack Trace chi tiết làm lộ cấu trúc thư mục và nguy cơ bảo mật.
- **Cơ chế xử lý:**
  - `@Catch()` không tham số: Đón lõng tất cả mọi lỗi phát sinh trong ứng dụng.
  - Phân luồng xử lý:
    1. **`HttpException` (Lỗi có chủ đích như 400, 401, 403, 404):** Bóc tách thông báo lỗi thân thiện để gửi về cho client sửa (ví dụ: mảng thông báo lỗi của `class-validator`).
    2. **`Error` / Lỗi lạ (Lỗi 500 crash bất ngờ):** Tuyệt đối giấu stack trace khỏi client, chỉ ghi log nội bộ qua `Logger.error()` trên terminal để lập trình viên gỡ lỗi.
  - Phản hồi lỗi chuẩn hóa:
    ```json
    {
      "statusCode": 400,
      "timestamp": "2026-09-26T15:30:00.000Z",
      "path": "/api/v1/auth/register",
      "error": "Bad Request",
      "message": "Email không đúng định dạng"
    }
    ```

### C. ArgumentsHost trong NestJS
- Là lớp trừu tượng (abstraction layer) giúp NestJS hỗ trợ đa nền tảng (HTTP, Microservices, WebSockets).
- `host.switchToHttp()` cho phép chuyển đổi ngữ cảnh để bóc tách đúng cặp đối tượng `Request` và `Response` của Express.
- Lưu ý cẩn trọng về kiểu dữ liệu:
  - `getRequest<Request>()`: Lấy request để đọc `path`, `body`, `headers`.
  - `getResponse<Response>()`: Lấy response để gọi `.status()` và `.json()`.

---

## 3. Cạm bẫy thực tế & Bài học (Troubleshooting)

1. **Lỗi `npm error ENOENT package.json`:**
   - Xảy ra khi chạy lệnh npm ở sai thư mục (đang đứng ở root `next-js-selfstudy` thay vì thư mục chứa app `backend-api`). Luôn kiểm tra dấu nhắc lệnh trước khi chạy lệnh build/start.
2. **Lỗi `Property 'status' does not exist on type 'Request'`:**
   - Xảy ra do khai báo nhầm Generic type: `ctx.getResponse<Request>()`. Đối tượng `Request` không có phương thức trả về dữ liệu. Luôn gán đúng `ctx.getResponse<Response>()`.
3. **Lỗi `Cannot find type definition file for 'vitest/globals'`:**
   - File cấu hình gốc của app không nên include types của test runner (`vitest/globals`) vào phạm vi build production của backend nếu thư mục build loại trừ test.
