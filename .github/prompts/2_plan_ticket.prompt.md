---
mode: "agent"
description: 'Tạo kế hoạch triển khai chi tiết từ ticket và phân tích, sau đó append TODO list vào cuối file ticket.'
---

# Prompt Lập Kế Hoạch Triển Khai

## Mục đích
Đọc file ticket (đã có phân tích từ bước 1), tạo kế hoạch triển khai chi tiết với TODO list có thể thực thi cho dự án NestJS + Sequelize + Postgres, sau đó append kế hoạch vào cuối file ticket. Kế hoạch này sẽ được sử dụng bởi agent downstream để thực hiện từng bước.

## Đầu vào
- **File Ticket**: File `.md` trong `ticket-docs/` chứa yêu cầu và phần **PHÂN TÍCH TICKET** từ bước 1
- **Tài liệu dự án**: `README.md` và tài liệu nội bộ (nếu có)
- **Mã nguồn hiện tại**: Trong `src/` (NestJS modules, controllers, services, entities)
- **Files đính kèm**: Các file được đính kèm qua "Add Context"

## Ràng buộc
- Tuân thủ tài liệu dự án và best practices NestJS
- Tham chiếu: https://github.com/github/awesome-copilot/blob/main/instructions/nestjs.instructions.md
- Controller mỏng, logic ở service, validate bằng DTO/pipe
- Tuân thủ coding standards trong `.github/instructions/`
- Nếu tài liệu có xung đột với ticket, **hỏi để làm rõ** trước khi tiếp tục
- Kế hoạch phải đủ chi tiết để agent khác có thể thực thi từng bước
- Mỗi TODO item phải có đường dẫn file cụ thể

## Nguyên tắc cốt lõi: PHÂN TÁCH THẬT NHỎ

> **Mục tiêu**: Mỗi TODO phải đủ nhỏ để downstream agent có thể thực hiện với **context tối thiểu**, **dễ verify**, **dễ test**, và **dễ rollback** nếu có lỗi.

### Tiêu chí cho một TODO "đủ nhỏ"

| Tiêu chí | Mô tả | Ví dụ tốt | Ví dụ xấu |
|----------|-------|-----------|-----------|
| **Single Responsibility** | Chỉ làm MỘT việc duy nhất | "Thêm field `priority` vào entity" | "Thêm field và update logic" |
| **Single File** | Chỉ thay đổi MỘT file (trừ test) | "Sửa `device.service.ts`" | "Sửa `service` và `controller`" |
| **Verifiable** | Verify ngay sau khi làm xong | "`npm test` pass" | "Hệ thống hoạt động tốt" |
| **Testable** | Test case cụ thể | "Unit test cho `DeviceService`" | "Test tổng thể" |
| **5-15 phút** | Ước lượng thời gian | "Thêm 1 method 20 dòng" | "Implement toàn bộ module" |
| **Minimal Context** | Đọc 1-2 file | "Đọc `device.entity.ts`" | "Cần hiểu toàn bộ hệ thống" |

### Cách phân tách một thay đổi lớn

```
❌ SAI: "Thêm tính năng ưu tiên gateway"

✅ ĐÚNG: Phân tách thành:
  TODO-1.1: Thêm field `priority` vào entity `GatewayDevice`
  TODO-1.2: Thêm migration/seed hoặc sync command để tạo cột `priority`
  TODO-1.3: Cập nhật DTO tạo mới + validation
  TODO-1.4: Cập nhật service xử lý sắp xếp theo `priority`
  TODO-1.5: Viết unit test cho logic sort
  TODO-1.6: Cập nhật REST API response mapping
  TODO-1.7: Viết e2e test cho endpoint liên quan
```

---

## Quy trình lập kế hoạch (theo thứ tự)

### Bước 1: Đọc và tóm tắt mục tiêu
1. Đọc kỹ file ticket được cung cấp
2. Xác định phần **PHÂN TÍCH TICKET** đã có từ bước 1
3. **Quan trọng**: Xác định danh sách **REQ-xx** từ phần "Phân rã yêu cầu"
4. Tóm tắt mục tiêu cốt lõi trong 1-2 câu
5. Xác nhận các tiêu chí chấp nhận

### Bước 2: Xác thực ngữ cảnh
1. Đọc `README.md` và tài liệu đính kèm qua context
2. Ghi nhận bất kỳ xung đột nào giữa tài liệu và ticket

### Bước 3: Phân tích mã nguồn hiện tại
1. Đọc mã nguồn liên quan đến khu vực của ticket:
   - **NestJS Modules**: `src/**/` (module, controller, service, provider)
   - **REST API**: `src/rest-api/`
   - **Socket.IO**: `src/socket-io-api/`
   - **Gateway communication**: `src/gateway-communication/`
   - **Email**: `src/email/`
   - **Database/Sequelize**: `src/database/entities/`, `src/database/services/`
2. Hiểu cấu trúc và pattern hiện có
3. Xác định các điểm mở rộng/sửa đổi

### Bước 4: Phân tích yêu cầu
1. Liệt kê **yêu cầu chức năng** (Functional Requirements)
2. Liệt kê **ràng buộc phi chức năng** (Non-functional Constraints)
3. Xác định **phụ thuộc** (Dependencies) giữa các thành phần
4. Xác định thứ tự triển khai tối ưu

### Bước 5: Lập kế hoạch triển khai
1. Phác thảo cách tiếp cận tổng thể
2. Xác định các file cần tạo mới
3. Xác định các file cần sửa đổi
4. Xác định các component/service/class mới cần tạo
5. Lập kế hoạch cho unit test

### Bước 6: Tạo TODO List chi tiết
1. **Phân tách từng yêu cầu con** (từ phần Phân rã yêu cầu) thành các atomic tasks
2. Áp dụng nguyên tắc **PHÂN TÁCH THẬT NHỎ**
3. Tạo checklist với thứ tự thực hiện rõ ràng
4. Mỗi TODO item phải bao gồm:
   - **File**: Đường dẫn file cụ thể (chỉ 1 file)
   - **Thay đổi**: Mô tả chi tiết, cụ thể từng thay đổi
   - **Context**: Các file cần đọc để hiểu (tối đa 2-3 file)
   - **Verify**: Cách kiểm tra ngay sau khi hoàn thành
   - **Kết quả**: Kết quả mong đợi
5. Nhóm các TODO theo:
   - **Phase**: Data → Logic → Interface → Integration
   - **REQ**: Theo mã yêu cầu con từ phân tích

### Bước 6.1: Mẫu phân tách theo layer

```
Layer 1 - Data/Schema:
  - TODO: Thêm field vào Sequelize entity
  - TODO: Thêm migration/seed hoặc sync command

Layer 2 - Core Logic:
  - TODO: Thêm/sửa method trong service
  - TODO: Unit test cho service

Layer 3 - Interface/API:
  - TODO: Thêm/sửa REST/Socket endpoint
  - TODO: Thêm/sửa DTO + validation
  - TODO: Unit/e2e test cho API

Layer 4 - Integration:
  - TODO: Cập nhật integration point (gateway/email)
  - TODO: Integration test
```

### Bước 7: Append kế hoạch vào file ticket
1. Thêm phần **## KẾ HOẠCH TRIỂN KHAI** vào cuối file ticket
2. Sử dụng định dạng checkbox `[ ]` cho mỗi TODO
3. Đảm bảo agent downstream có thể đánh dấu `[x]` khi hoàn thành

---

## Định dạng đầu ra

Append phần sau vào **cuối file ticket**:

```markdown
---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> [Mục tiêu cốt lõi trong 1-2 câu]

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: ...
2. FR-02: ...

#### Ràng buộc phi chức năng
1. NFR-01: ...
2. NFR-02: ...

#### Phụ thuộc
- DEP-01: ...
- DEP-02: ...

### Cách tiếp cận
> [Mô tả ngắn gọn cách tiếp cận triển khai]

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `src/.../new-file.ts` | Mô tả |
| Sửa đổi | `src/.../existing-file.ts` | Mô tả |
| Unit test | `test/.../*.spec.ts` | Mô tả |

---

## PLAN TODO

### Phase 1: [Data Layer]

#### REQ-01: [Tên yêu cầu con từ phân tích]

- [ ] **TODO-1.1.1**: [Tiêu đề ngắn gọn - 1 hành động duy nhất]
  - **File**: `đường/dẫn/file/cụ/thể.ts` (chỉ 1 file)
  - **Context**: Đọc `file1.ts`, `file2.ts` để hiểu cấu trúc
  - **Thay đổi**:
    - Mô tả cụ thể dòng/block cần thêm/sửa
    - Ví dụ: "Thêm field `priority: number` vào entity `GatewayDevice`"
  - **Verify**: `npm test` / `npm run build`
  - **Kết quả**: Mô tả trạng thái sau khi hoàn thành

- [ ] **TODO-1.1.2**: [Tiêu đề ngắn gọn]
  - **File**: `đường/dẫn/file/cụ/thể.ts`
  - **Context**: Đọc `file.ts` để hiểu interface
  - **Thay đổi**: Mô tả cụ thể
  - **Verify**: Cách verify
  - **Kết quả**: Kết quả mong đợi

- [ ] **TODO-1.1.3**: Unit test cho TODO-1.1.1 và TODO-1.1.2
  - **File**: `test/.../*.spec.ts`
  - **Context**: Đọc implementation vừa tạo
  - **Thay đổi**: Viết test case cho [tên method/logic]
  - **Verify**: `npm test` pass
  - **Kết quả**: Test coverage cho logic mới

#### REQ-02: [Tên yêu cầu con]

- [ ] **TODO-1.2.1**: ...

### Phase 2: [Logic Layer]

- [ ] **TODO-2.1.1**: [Tiêu đề]
  - **File**: ...
  - **Context**: ...
  - **Thay đổi**: ...
  - **Verify**: ...
  - **Kết quả**: ...

### Phase 3: [Interface Layer]

- [ ] **TODO-3.1.1**: ...

### Phase 4: Integration & Verification

- [ ] **TODO-4.1**: Build toàn bộ project
  - **Thay đổi**: Chạy `npm run build`
  - **Verify**: Build thành công, không error mới
  - **Kết quả**: Artifact được tạo

- [ ] **TODO-4.2**: Chạy toàn bộ unit tests
  - **Thay đổi**: Chạy `npm test`
  - **Verify**: Tất cả test pass
  - **Kết quả**: Test report xanh

- [ ] **TODO-4.3**: Smoke test thủ công
  - **Thay đổi**: Kiểm tra flow chính
  - **Verify**: Flow hoạt động đúng
  - **Kết quả**: Ready for review

---

## Ghi chú triển khai
- [Ghi chú 1]
- [Ghi chú 2]

## Rủi ro cần theo dõi
- [ ] Risk-1: [Mô tả] — Biện pháp: [...]
- [ ] Risk-2: [Mô tả] — Biện pháp: [...]
```

---

## Hướng dẫn chi tiết

### Quy tắc cho TODO items (QUAN TRỌNG)

#### Nguyên tắc Atomic Task
1. **Single File Rule**: Mỗi TODO chỉ thay đổi **1 file** (ngoại trừ file test đi kèm)
2. **Single Action Rule**: Mỗi TODO chỉ thực hiện **1 hành động logic**
3. **5-15 Minute Rule**: Mỗi TODO ước lượng 5-15 phút thực hiện
4. **Immediate Verify Rule**: Có thể verify ngay sau khi làm xong (run test/build)
5. **Minimal Context Rule**: Agent chỉ cần đọc 1-3 file để hiểu và thực hiện

#### Cấu trúc bắt buộc cho mỗi TODO
```markdown
- [ ] **TODO-X.Y.Z**: [Động từ] + [Đối tượng cụ thể]
  - **File**: [1 đường dẫn file duy nhất]
  - **Context**: [1-3 file cần đọc để hiểu]
  - **Thay đổi**: [Chi tiết cụ thể, có thể copy-paste]
  - **Verify**: [Lệnh hoặc cách kiểm tra ngay]
  - **Kết quả**: [Trạng thái sau khi hoàn thành]
```

#### Đánh số TODO
- Format: `TODO-{Phase}.{REQ}.{Sequence}`
- Ví dụ: `TODO-1.2.3` = Phase 1, REQ-02, bước thứ 3

#### Anti-patterns (TRÁNH)
| ❌ Xấu | ✅ Tốt |
|--------|--------|
| "Implement feature X" | "Thêm method `calculatePriority()` vào `device.service.ts`" |
| "Update database" | "Thêm column `priority INT DEFAULT 0` vào bảng `device`" |
| "Fix bug" | "Sửa điều kiện if trong `handleUpdate()`" |
| "Add tests" | "Thêm test case `shouldSortByPriority()`" |
| "Refactor code" | "Extract method `validateInput()` từ `process()`" |
| Thay đổi 3 files | Tách thành 3 TODO riêng biệt |

### Quy tắc theo công nghệ

#### Cho code NestJS/TypeScript
- Tham chiếu `.github/instructions/NestJS.instructions.md`
- Controller mỏng, logic ở Service, validate bằng DTO/Pipe
- Dùng DI chuẩn của NestJS, không tạo instance thủ công
- DTO + validation cho input/output; map entity sang response rõ ràng
- Dùng `async/await`, tránh callback/then chaining
- Unit test với Jest (`*.spec.ts`)

#### Cho Sequelize/Postgres
- Entity trong `src/database/entities/`
- Ưu tiên transaction cho update nhiều bảng
- Tránh N+1 query, dùng include/associations hợp lý

### Checklist trước khi hoàn thành
- [ ] Đã đọc kỹ phần PHÂN TÍCH TICKET và PHÂN RÃ YÊU CẦU từ bước 1
- [ ] Đã xác thực với tài liệu dự án/README
- [ ] Đã kiểm tra mã nguồn hiện tại
- [ ] **Mỗi TODO chỉ thay đổi 1 file** (Single File Rule)
- [ ] **Mỗi TODO chỉ làm 1 việc** (Single Action Rule)
- [ ] **Mỗi TODO có Context rõ ràng** (1-3 file cần đọc)
- [ ] **Mỗi TODO có Verify cụ thể** (test/build command)
- [ ] Mọi TODO đều có đường dẫn file cụ thể
- [ ] Thứ tự TODO phản ánh đúng phụ thuộc (layer order)
- [ ] Mỗi TODO implementation có TODO test đi kèm ngay sau
- [ ] TODO được nhóm theo REQ từ phân rã yêu cầu
- [ ] Đã append kế hoạch vào cuối file ticket

---

## Hướng dẫn thực hiện

### Cách sử dụng prompt này
1. **Đầu vào**: File ticket đã có phần **PHÂN TÍCH TICKET** từ bước 1
2. **Thực hiện**: Agent sẽ tạo kế hoạch chi tiết với TODO list
3. **Đầu ra**: Agent sẽ **append phần KẾ HOẠCH TRIỂN KHAI và PLAN TODO vào cuối file ticket**
4. **Bước tiếp theo**: Chuyển sang `3_implement_ticket.prompt.md` để thực hiện code

### Liên kết với bước 1
- TODO phải được nhóm theo **REQ-xx** từ phần "Phân rã yêu cầu" của bước 1
- Mỗi REQ-xx sẽ được phân tách thành nhiều TODO atomic
- Thứ tự REQ-xx được giữ nguyên theo phân tích phụ thuộc từ bước 1

---

## Prompts liên quan
- `1_analysis_ticket.prompt.md` — Bước trước: Phân tích ticket (tạo PHÂN TÍCH TICKET + REQ-xx)
- `3_implement_ticket.prompt.md` — Bước tiếp theo: Triển khai code theo PLAN TODO
  - **File**: `CCCS App Svr/source/core/src/cccs_pa.c`
  - **Context**: Đọc `cccs_pa.h` để xem struct
  - **Thay đổi**: 
    ```c
    int cccs_pa_set_priority(pa_request_t *req, int level) {
        if (level < 0 || level > 10) return -1;
        req->priority_level = level;
        return 0;
    }
    ```
  - **Verify**: `make` compile thành công
  - **Kết quả**: Function mới được thêm

- [ ] **TODO-2.1.2**: Khai báo prototype trong header
  - **File**: `CCCS App Svr/source/core/include/cccs_pa.h`
  - **Context**: Đọc các prototype hiện có
  - **Thay đổi**: Thêm `int cccs_pa_set_priority(pa_request_t *req, int level);`
  - **Verify**: `make` compile thành công
  - **Kết quả**: Function accessible từ module khác

- [ ] **TODO-2.1.3**: Unit test cho set_priority()
  - **File**: `CCCS App Svr/unit_test/cccs_pa_unittest.c`
  - **Context**: Đọc implementation `cccs_pa_set_priority()`
  - **Thay đổi**: 
    - Test case: valid priority (0-10) → return 0
    - Test case: invalid priority (<0, >10) → return -1
    - Test case: NULL request → handle gracefully
  - **Verify**: `./gtest_main --gtest_filter=*priority*` pass
  - **Kết quả**: 3 test cases pass

- [ ] **TODO-2.1.4**: Sửa queue insert để sort theo priority
  - **File**: `CCCS App Svr/source/core/src/cccs_queue_mgr.c`
  - **Context**: Đọc function `queue_insert()` và struct `pa_request_t`
  - **Thay đổi**: Sửa logic insert để insert theo thứ tự priority DESC
  - **Verify**: Unit test mới pass
  - **Kết quả**: PA priority cao được xử lý trước

- [ ] **TODO-2.1.5**: Unit test cho priority sorting
  - **File**: `CCCS App Svr/unit_test/cccs_queue_mgr_unittest.c`
  - **Context**: Đọc `queue_insert()` đã sửa
  - **Thay đổi**: Test insert 3 PA với priority 1,3,2 → dequeue ra 3,2,1
  - **Verify**: Test pass
  - **Kết quả**: Sorting logic được verify
```

## Ví dụ TODO item tốt (chi tiết)

```markdown
- [ ] **TODO-1.3.2**: Thêm validation cho priority level
  - **File**: `CCCS App Svr/source/core/src/cccs_pa.c`
  - **Context**: 
    - Đọc `cccs_pa.h` để hiểu struct `pa_request_t`
    - Đọc `cccs_constants.h` để xem MAX_PRIORITY định nghĩa
  - **Thay đổi**: 
    - Thêm function `validate_priority_level(int level)`
    - Return 1 nếu level trong range [0, MAX_PRIORITY]
    - Return 0 và log warning nếu out of range
    - Gọi `tccs_loglib_write(LOG_WARN, ...)` khi invalid
  - **Verify**: 
    - `make` compile thành công
    - Chạy `./gtest_main --gtest_filter=*validate_priority*` pass
  - **Kết quả**: 
    - Function mới được thêm (~15 dòng code)
    - Invalid priority được log và reject
```

## Ví dụ TODO item xấu (tránh)

```markdown
- [ ] **TODO-1.3**: Implement priority handling
  - **Thay đổi**: Thêm code xử lý priority
  - **Kết quả**: Priority hoạt động
```

**Vấn đề:**
- ❌ Không có đường dẫn file cụ thể
- ❌ Không có context cần đọc
- ❌ Mô tả quá chung chung ("thêm code")
- ❌ Không có cách verify
- ❌ Có thể bao gồm nhiều file/nhiều thay đổi
- ❌ Agent không thể thực hiện mà không hỏi thêm