# GHI CHÚ NGÀY 03: AUTHENTICATION, JWT, GUARDS & PHÂN QUYỀN RBAC

## 1. Bối cảnh & Đánh đổi kiến trúc

- **JWT-based (Stateless) vs Session-based (Stateful):**
  - Trong kiến trúc hiện đại kết hợp giữa **NestJS (Backend API)** và **Next.js (Frontend / SSR)**, JWT là lựa chọn vượt trội vì tính chất *Stateless*:
    - Server không cần lưu trữ session vào RAM hoặc Redis; mỗi server chỉ cần chung `JWT_SECRET` là có thể giải mã và xác thực request ngay lập tức, cực kỳ dễ scale ngang (Horizontal Scaling).
    - Next.js phía Server-Side Rendering (SSR) dễ dàng đính kèm token vào Header `Authorization: Bearer <token>` khi gọi API backend.
- **Phân biệt rành mạch Authentication (Xác thực) vs Authorization (Phân quyền):**
  - **Authentication (401 Unauthorized):** Trả lời câu hỏi *"Bạn là ai?"*. `JwtAuthGuard` đảm nhiệm kiểm tra chữ ký token và hạn dùng. Nếu không có token hoặc token sai $\rightarrow$ chặn ngay ngoài cửa.
  - **Authorization (403 Forbidden):** Trả lời câu hỏi *"Bạn có quyền làm việc này không?"*. Sau khi đã biết danh tính, `RolesGuard` kiểm tra xem vai trò (`user.role`) có đủ thẩm quyền thực hiện thao tác hay không.
- **Custom Decorator `@CurrentUser()` vs `@Req() req: Request`:**
  - Inject trực tiếp `@Req()` của Express khiến mã nguồn bị gắn chặt (tightly-coupled) với nền tảng HTTP bên dưới, khó unit test và dễ lỗi runtime khi đọc `req.user`.
  - Bọc qua `createParamDecorator` tạo ra cú pháp sạch sẽ, hỗ trợ Type-Safe (`IUserPayload`) và dễ dàng bóc tách từng thuộc tính (ví dụ: `@CurrentUser('email')`).

---

## 2. Bản chất kỹ thuật ngầm & Luồng xử lý

### A. Vòng đời mã OTP (Kích hoạt & Gửi lại mã)
- **Công thức sinh mã OTP 6 chữ số ngẫu nhiên:**
  ```typescript
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  ```
  *(Khoảng giá trị luôn nằm trong $[100000, 999999]$, đảm bảo không bao giờ bị tụt xuống 5 chữ số làm vi phạm `@Length(6, 6)`).*
- **Nguyên tắc Idempotency & Replay Attack Prevention:**
  - Khi người dùng kích hoạt tài khoản thành công qua API `verify-code`, hệ thống **bắt buộc xoá trắng** `codeId: null` và `codeExpired: null`.
  - Việc này đảm bảo một mã OTP chỉ có giá trị sử dụng đúng 1 lần (Single-use token), kẻ xấu không thể nghe lén và dùng lại mã cũ.

### B. Cơ chế hoạt động của Passport & JWT
1. **Cấu hình `JwtModule.registerAsync`:** Sử dụng Factory Function inject `ConfigService` để nạp `JWT_SECRET` từ `.env` sau khi module config đã sẵn sàng.
2. **Payload tối giản:** Chỉ đóng gói các thông tin an toàn:
   ```typescript
   const payload = { sub: user.id, email: user.email, role: user.role };
   ```
   *(Tuyệt đối không đưa mật khẩu, mã OTP hay dữ liệu nhạy cảm vào payload JWT vì client có thể giải mã base64 để đọc nội dung).*
3. **Request Lifecycle của `JwtStrategy`:**
   - Passport tự động bóc tách chuỗi token từ header `Authorization: Bearer <token>`.
   - Dùng secret key để kiểm tra chữ ký số và thời hạn hết hạn (`ignoreExpiration: false`).
   - Hàm `validate(payload)` chạy khi token hợp lệ, giá trị trả về được NestJS tự động gán vào thuộc tính `request.user`.

### C. Cơ chế Metadata & Reflector trong RBAC
```
[Client Request] 
      ↓
[JwtAuthGuard] (Bóc tách token -> gán user vào req.user)
      ↓
[RolesGuard] (Reflector đọc metadata từ @Roles('ADMIN') -> so khớp user.role)
      ↓ (Khớp: đi tiếp | Không khớp: ném 403 Forbidden)
[Controller Action]
```
- `@SetMetadata(ROLES_KEY, roles)`: Gắn nhãn yêu cầu quyền hạn lên từng method hoặc class.
- `Reflector.getAllAndOverride()`: Quét metadata, ưu tiên nhãn gắn ở cấp độ method trước, nếu không có mới tìm ở cấp độ controller class.

---

## 3. Cạm bẫy thực tế & Bài học (Troubleshooting)

1. **Lỗi `TypeError: pchstr must contain a $ as first char` ở Argon2:**
   - **Nguyên nhân:** Hàm `argon2.verify(hash, plain)` yêu cầu tham số thứ nhất phải là chuỗi hash lấy từ database (luôn bắt đầu bằng ký tự `$`), tham số thứ hai là mật khẩu dạng raw text người dùng nhập vào. Truyền ngược thứ tự sẽ gây lỗi vỡ định dạng PHC.
   - **Bài học:** Luôn kiểm tra kỹ thứ tự tham số: `await argon2.verify(user.password, loginDto.password)`.

2. **Lỗi Decorator trả về `undefined` khi không truyền tham số:**
   - **Nguyên nhân:** Viết nhầm toán tử 3 ngôi `return data ? user?.[data] : data`. Khi gọi `@CurrentUser()` (không truyền tham số), `data` là `undefined` nên kết quả trả về `undefined` thay vì trả về cả object `user`.
   - **Bài học:** Sửa thành `return data ? user?.[data] : user`.

3. **Lỗ hổng Guard cho phép vượt quyền do thiếu logic so khớp:**
   - **Nguyên nhân:** Trong `RolesGuard`, chỉ kiểm tra `if (!user || !user.role)` rồi ngay lập tức `return true;`. Lúc này bất kỳ ai có role (kể cả `USER`) đều được đi qua vì điều kiện phủ định bị sai.
   - **Bài học:** Bắt buộc phải có bước kiểm tra:
     ```typescript
     const hasRole = requiredRoles.includes(user.role);
     if (!hasRole) throw new ForbiddenException('...');
     ```

4. **Lỗi lệch Case giữa Database Enum và Code Decorator:**
   - **Nguyên nhân:** Trong Prisma schema định nghĩa `enum Role { USER, ADMIN }` (viết hoa). Khi so sánh chuỗi, `'ADMIN' === 'admin'` sẽ trả về `false`.
   - **Bài học:** Luôn giữ tính đồng nhất về định dạng ký tự giữa Entity database và Metadata Decorator.

5. **Thứ tự định tuyến (Routing Order) trong NestJS / Express:**
   - **Nguyên nhân:** Đặt `@Get(':id')` phía trên `@Get()` khiến Express có thể coi đường dẫn tĩnh là một tham số động `:id`.
   - **Bài học:** Luôn khai báo các route tĩnh hoặc route gốc (`@Get()`, `@Get('profile')`) **trước** các route chứa param động (`@Get(':id')`).

---

## 4. Bảng tổng hợp API Module Auth đã hoàn thiện

| Method | Endpoint | Quyền hạn (Guard) | Mục đích | HTTP Status |
| :--- | :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản mới & sinh OTP 10p | `201 Created` |
| `POST` | `/api/v1/auth/verify-code` | Public | Xác thực OTP & kích hoạt tài khoản | `200 OK` |
| `POST` | `/api/v1/auth/resend-code` | Public | Cấp lại OTP mới cho tài khoản chưa active | `200 OK` |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập & sinh JWT Access Token | `200 OK` |
| `GET` | `/api/v1/auth/profile` | `JwtAuthGuard` | Lấy thông tin tài khoản hiện tại | `200 OK` |
| `GET` | `/api/v1/users` | `JwtAuthGuard`, `RolesGuard` (`ADMIN`) | Quản trị viên xem danh sách toàn bộ user | `200 OK` |
