# GHI CHÚ NGÀY 01: POSTGRESQL & PRISMA ORM TRONG NESTJS

## 1. Bối cảnh & Đánh đổi kiến trúc

- **PostgreSQL vs MongoDB:**
  - Hệ thống xác thực & phân quyền (Auth) đòi hỏi tính toàn vẹn dữ liệu tuyệt đối (ACID) và quan hệ chặt chẽ giữa User - Token - Role.
  - PostgreSQL ép buộc ràng buộc ở cấp độ Database Engine (`UNIQUE`, Foreign Key), ngăn chặn triệt để dữ liệu rác/trùng lặp.
- **UUID vs Auto-increment ID:**
  - Dùng UUID cho `User.id` để chống lộ quy mô hệ thống và lỗ hổng IDOR (kẻ xấu không thể đoán `id = 1, 2, 3...`).

## 2. Bản chất kỹ thuật ngầm

- **Prisma Migration:**
  - Không chỉ sửa database, nó sinh file `.sql` có timestamp trong `prisma/migrations/` để quản lý phiên bản (Version Control) cho schema giống Git.
  - Tự động trigger `prisma generate` để sinh types TypeScript vào `@prisma/client`.
- **NestJS Dependency Injection (DI) & Singleton:**
  - Không `new PrismaClient()` bừa bãi trong Controller/Service để tránh làm cạn kiệt Connection Pool của PostgreSQL.
  - Bọc trong `PrismaService` (implements `OnModuleInit`, `OnModuleDestroy`) và gắn decorator `@Global()` ở `PrismaModule` để toàn app dùng chung 1 instance duy nhất.

## 3. Cạm bẫy thực tế & Bài học (Troubleshooting)

- **Sự cố Prisma v8-RC và v6 Stable:**
  - Bản v8 (Release Candidate) đổi cú pháp CLI từ `migrate` sang `migration` và sinh file `prisma.config.ts`.
  - Khi hạ phiên bản (downgrade) về v6 Stable, file `prisma.config.ts` còn sót lại gây crash do không tương thích hàm `definePrismaConfig`.
  - **Bài học:** Khi downgrade package, luôn kiểm tra và dọn dẹp các file config/artifact do bản mới sinh ra.

## 4. Lệnh cốt lõi cần nhớ

- Chạy migration: `npx prisma migrate dev --name <migration_name>`
- Mở GUI xem DB nhanh: `npx prisma studio`
- Sinh Nest module/service sạch: `npx nest g mo <name>` / `npx nest g s <name> --no-spec`
