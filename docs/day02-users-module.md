# GHI CHÚ NGÀY 02 (PHẦN 2): MODULE USERS & NGUYÊN TẮC BẢO MẬT DỮ LIỆU TRẢ VỀ

## 1. Bối cảnh & Đánh đổi kiến trúc

- **Phân tách trách nhiệm giữa UsersModule và AuthModule:**
  - `UsersModule`: Chuyên trách việc truy vấn, quản lý thực thể (Entity) User trong cơ sở dữ liệu (tìm kiếm, cập nhật hồ sơ, phân quyền).
  - `AuthModule`: Chuyên trách logic nghiệp vụ liên quan đến phiên xác thực (đăng ký, kiểm tra mật khẩu, sinh JWT token, xác minh OTP).
  - Phân tách như vậy đảm bảo nguyên lý **Single Responsibility Principle (SRP)**. Khi Auth cần dữ liệu user, nó chỉ việc gọi `UsersService` chứ không tự viết lại logic truy vấn database.

- **Nguyên tắc Export Service:**
  - NestJS đóng gói các thành phần bên trong Module theo mặc định (Encapsulation).
  - Để `AuthModule` có thể sử dụng được `UsersService`, bắt buộc phải khai báo `exports: [UsersService]` trong `users.module.ts`.

---

## 2. Bản chất kỹ thuật ngầm

### A. Chống lộ lọt thông tin nhạy cảm với Prisma `select`
- Khi truy vấn `prisma.user.findUnique()`, nếu không chỉ định `select`, Prisma sẽ trả về toàn bộ các cột trong bảng `users` bao gồm: `password` (hash Argon2), `codeId` (mã OTP), `codeExpired`.
- **Rủi ro:** Dù password đã được hash, việc trả hash về Client vẫn mở ra nguy cơ bị kẻ xấu trích xuất để crack offline bằng Rainbow Table hoặc GPU clusters.
- **Giải pháp:** Sử dụng `select` tường minh để chỉ lấy đúng những trường cần hiển thị cho phía Client (`id`, `email`, `name`, `role`, `isActive`, `createdAt`).

### B. Cơ chế bắt lỗi 404 kết hợp AllExceptionsFilter
- Khi `findById(id)` trả về `null`, `UsersController` chủ động ném `throw new NotFoundException(...)`.
- `AllExceptionsFilter` đã dựng trước đó sẽ tự động bắt lấy exception này, format thành JSON chuẩn:
  ```json
  {
    "statusCode": 404,
    "timestamp": "2026-09-26T...",
    "path": "/api/v1/users/abc-123",
    "error": "Not Found",
    "message": "User does not exist"
  }
  ```

---

## 3. Lệnh kiểm thử API

- **Test tìm kiếm User không tồn tại (Kiểm tra lỗi 404 chuẩn):**
```bash
curl http://localhost:3000/api/v1/users/non-existent-uuid
```
