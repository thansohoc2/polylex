---
mode: "agent"
description: 'Phân tích yêu cầu/ticket, đối chiếu với tài liệu dự án và mã nguồn, tạo báo cáo phân tích có cấu trúc cho giai đoạn triển khai.'
---

# Prompt Phân Tích Ticket

## Mục đích
Nhận yêu cầu (từ context, file ticket, hoặc người dùng nhập trực tiếp), phân tích dựa trên tài liệu dự án và mã nguồn NestJS hiện tại, sau đó tạo ra bản phân tích toàn diện xác định những gì cần làm, các vấn đề tiềm ẩn, và các cân nhắc khi triển khai. Chưa triển khai bất cứ điều gì ngay bây giờ, chỉ tập trung vào phân tích.

## Đầu vào
- **Yêu cầu/Ticket**: Được truyền qua context hoặc người dùng cung cấp (tiếng Anh hoặc tiếng Việt)
- **Tài liệu dự án**: `README.md`, tài liệu nội bộ (nếu có)
- **Mã nguồn**: Triển khai hiện tại trong `src/` (NestJS + Sequelize + Postgres)
- **Cấu hình**: `package.json`, `tsconfig.json`, `nest-cli.json`, `prod.env`

## Quy trình phân tích

### Bước 1: Hiểu yêu cầu
1. Phân tích yêu cầu/ticket để trích xuất:
   - **Mục tiêu**: Kết quả mong muốn là gì?
   - **Phạm vi**: Những thành phần nào bị ảnh hưởng (API/Socket/Gateway/Email/DB)?
   - **Ràng buộc**: Có giới hạn, deadline, hoặc yêu cầu tương thích nào không?
   - **Tiêu chí chấp nhận**: Làm sao biết khi nào hoàn thành?

### Bước 2: Phân rã yêu cầu
1. Chia nhỏ yêu cầu lớn thành các yêu cầu con độc lập về mặt nghiệp vụ:
   - Mỗi yêu cầu con phải có **mục tiêu rõ ràng** và **có thể hoàn thành độc lập**
   - Xác định **thứ tự phụ thuộc** giữa các yêu cầu con (nếu có)
   - Mỗi yêu cầu con nên thuộc về **một luồng nghiệp vụ** hoặc **một module NestJS** cụ thể
2. Đánh mã định danh cho từng yêu cầu con (REQ-01, REQ-02, ...)
3. Xác định mối quan hệ giữa các yêu cầu con:
   - **Độc lập**: Có thể triển khai song song
   - **Tuần tự**: Phải hoàn thành yêu cầu A trước khi làm B
   - **Liên quan**: Chia sẻ component/data nhưng không phụ thuộc trực tiếp
4. Ước lượng độ phức tạp sơ bộ cho mỗi yêu cầu con (Nhỏ/Trung bình/Lớn)

> **Lưu ý**: Mức độ chi tiết của phân rã nên ở mức nghiệp vụ, không cần chi tiết đến mức implement code. Ví dụ: "Thêm API lấy danh sách thiết bị theo trạm" thay vì "Tạo method `getDeviceListByStation()` trong `DeviceService`".

### Bước 3: Ngữ cảnh nghiệp vụ
1. Đọc các tài liệu dự án liên quan (README, tài liệu nội bộ) để hiểu:
   - Luồng nghiệp vụ hiện tại liên quan đến yêu cầu
   - Các thực thể domain và quan hệ giữa chúng
   - Hành vi hiện có cần được bảo toàn
2. Xác định các quy tắc nghiệp vụ hoặc ràng buộc áp dụng

### Bước 4: Ngữ cảnh kỹ thuật
1. Tìm kiếm và đọc mã nguồn hiện tại để xác minh:
   - Triển khai hiện có của các tính năng liên quan
   - Cấu trúc module, controller, service, provider hiện có
   - DTO/Validator, Guards/Interceptors/Pipes áp dụng
   - Entities/Models Sequelize và quan hệ
   - Schema/Seed/Sync/Command liên quan (nếu có)
2. Xác định các điểm tích hợp:
   - REST API (`src/rest-api/`)
   - Socket.IO (`src/socket-io-api/`)
   - Gateway communication (`src/gateway-communication/`)
   - Email (`src/email/`)
   - Config (`src/common/services/app-config.service.ts`)

### Bước 5: Phân tích thay đổi
1. So sánh trạng thái hiện tại với trạng thái mong muốn
2. Xác định những gì cần thay đổi:
   - Code mới cần viết
   - Code hiện có cần sửa đổi
   - Thay đổi cấu hình
   - Thay đổi schema database/migration/seed
3. Liệt kê các phụ thuộc và thứ tự thực hiện

### Bước 6: Đánh giá rủi ro
Đánh giá từng khía cạnh về các vấn đề tiềm ẩn:

#### Rủi ro nghiệp vụ
- Yêu cầu có xung đột với quy tắc nghiệp vụ hiện có không?
- Có edge case nào không được đề cập trong yêu cầu?
- Thay đổi này có ảnh hưởng đến các luồng nghiệp vụ khác không?

#### Rủi ro kỹ thuật
- Có lo ngại về tương thích ngược không?
- Ảnh hưởng đến hiệu năng? (N+1 query, join nặng)
- Vấn đề đồng thời hoặc race condition?
- Ranh giới transaction (Sequelize/Postgres)?
- Validation/serialization có nhất quán?

#### Lỗi logic tiềm ẩn
- Xử lý trạng thái không nhất quán?
- Thiếu đường dẫn xử lý lỗi?
- Race condition?
- Xử lý giá trị null/undefined?

### Bước 7: Cân nhắc triển khai
1. **Ưu điểm** của cách tiếp cận đề xuất
2. **Nhược điểm** của cách tiếp cận đề xuất
3. **Các cách tiếp cận thay thế** (nếu có)
4. **Cách tiếp cận khuyến nghị** kèm lý do

---

## Định dạng đầu ra

Viết phân tích vào phần **PHÂN TÍCH TICKET** bên dưới sử dụng cấu trúc này:

```markdown
## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu
| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | (nếu có) |
| **Tiêu đề** | Tiêu đề ngắn gọn |
| **Mục tiêu** | Cần đạt được điều gì |
| **Phạm vi** | Các module bị ảnh hưởng (REST/Socket/Gateway/Email/DB) |
| **Độ ưu tiên** | Khẩn cấp/Cao/Trung bình/Thấp |

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | [Tên ngắn gọn] | [Mô tả mục tiêu nghiệp vụ] | REST/Socket/Gateway/Email/DB | Nhỏ/TB/Lớn |
| REQ-02 | [Tên ngắn gọn] | [Mô tả mục tiêu nghiệp vụ] | REST/Socket/Gateway/Email/DB | Nhỏ/TB/Lớn |
| ... | ... | ... | ... | ... |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──┬──> REQ-03 (tuần tự)
         │
REQ-02 ──┘    (độc lập với REQ-01)

REQ-03 ──> REQ-04 (tuần tự)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: [Tên yêu cầu]
- **Mục tiêu**: ...
- **Đầu vào**: ...
- **Đầu ra mong đợi**: ...
- **Tiêu chí hoàn thành**: ...
- **Phụ thuộc**: Không / REQ-xx

##### REQ-02: [Tên yêu cầu]
- **Mục tiêu**: ...
- **Đầu vào**: ...
- **Đầu ra mong đợi**: ...
- **Tiêu chí hoàn thành**: ...
- **Phụ thuộc**: Không / REQ-xx

### 3. Ngữ cảnh nghiệp vụ
- Các luồng nghiệp vụ liên quan
- Các thực thể domain liên quan
- Các quy tắc nghiệp vụ áp dụng
- Hành vi hiện có cần bảo toàn

### 4. Ngữ cảnh kỹ thuật
- Tóm tắt triển khai hiện tại
- Các file/module bị ảnh hưởng
- Các bảng database liên quan
- Các điểm tích hợp (REST/Socket/Gateway/Email)

### 5. Phân tích khoảng cách
| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| ... | ... | ... |

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] Rủi ro 1: Mô tả — Biện pháp giảm thiểu
- [ ] Rủi ro 2: Mô tả — Biện pháp giảm thiểu

#### 6.2 Rủi ro kỹ thuật
- [ ] Rủi ro 1: Mô tả — Biện pháp giảm thiểu
- [ ] Rủi ro 2: Mô tả — Biện pháp giảm thiểu

#### 6.3 Lỗi logic tiềm ẩn
- [ ] Lỗi 1: Mô tả — Cách phòng tránh
- [ ] Lỗi 2: Mô tả — Cách phòng tránh

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| ... | ... |

### 8. Khuyến nghị
- **Cách tiếp cận khuyến nghị**: ...
- **Các cách tiếp cận thay thế**: ...
- **Phụ thuộc**: ...
- **Ước tính công sức**: ...

### 9. Câu hỏi mở
- [ ] Câu hỏi 1
- [ ] Câu hỏi 2

## PHÂN TÍCH TICKET

<!-- Kết quả phân tích sẽ được viết ở đây -->
```

---

## Hướng dẫn thực hiện

### Cách sử dụng prompt này
1. **Đầu vào**: Đính kèm file ticket từ `ticket-docs/` hoặc nhập yêu cầu trực tiếp
2. **Thực hiện**: Agent sẽ phân tích theo 7 bước trên
3. **Đầu ra**: Agent sẽ **append phần PHÂN TÍCH TICKET vào cuối file ticket**
4. **Bước tiếp theo**: Chuyển sang `2_plan_ticket.prompt.md` để tạo PLAN TODO

### Quy tắc quan trọng
1. **Phân tích kỹ lưỡng**: Kiểm tra mọi khía cạnh — logic nghiệp vụ, triển khai kỹ thuật, edge case
2. **Cụ thể**: Tham chiếu chính xác đường dẫn file, tên hàm, tên bảng
3. **Có thể hành động**: Cung cấp các bước tiếp theo rõ ràng mà prompt downstream có thể thực thi
4. **Ưu tiên best practices NestJS**: Tham chiếu https://github.com/github/awesome-copilot/blob/main/instructions/nestjs.instructions.md
5. **Áp dụng chuẩn NestJS**: Controller mỏng, logic ở Service, validate bằng DTO/pipe
6. **Đánh dấu điều không chắc chắn**: Ghi rõ các giả định và câu hỏi mở
7. **Xem xét tích hợp**: REST/Socket/Gateway/Email/DB có thể liên quan
8. **Ngôn ngữ đầu ra**: Luôn viết phân tích bằng **tiếng Việt**
9. **Append vào ticket**: Phân tích được ghi trực tiếp vào cuối file ticket, không tạo file riêng

---

## Workflow tổng thể

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TICKET WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   Bước 1    │    │   Bước 2    │    │   Bước 3    │                     │
│  │  ANALYSIS   │───▶│    PLAN     │───▶│  IMPLEMENT  │                     │
│  │             │    │             │    │             │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│        │                  │                  │                              │
│        ▼                  ▼                  ▼                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Output:     │    │ Output:     │    │ Output:     │                     │
│  │ PHÂN TÍCH   │    │ KẾ HOẠCH    │    │ Code +      │                     │
│  │ TICKET      │    │ TRIỂN KHAI  │    │ Unit Tests  │                     │
│  │ + REQ-xx    │    │ + TODO list │    │ + [x] TODO  │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                             │
│  Tất cả output được APPEND vào cùng 1 file ticket                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prompts liên quan
- `2_plan_ticket.prompt.md` — Bước tiếp theo: Lập kế hoạch triển khai (tạo PLAN TODO)
- `3_implement_ticket.prompt.md` — Bước sau: Triển khai code theo plan