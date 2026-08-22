# TICKET-055: Nút phân tích từ + trang phân tích từ bằng AI

**Status:** Proposed  
**Priority:** P1 – Tăng giá trị học từ vựng  
**Platforms:** Frontend + Backend AI  
**Created:** 2026-08-22  
**Nhóm gốc:** Vocabulary learning / AI learning support

---

## Vấn đề

Hiện tại từ vựng ở màn hình chi tiết đã có các thông tin cơ bản như phát âm, nghĩa, ví dụ, và nút practice. Tuy nhiên, người học chưa có một hành động rõ ràng để đi sâu vào “học từ theo cách của giáo viên ngôn ngữ”: xem sắc thái nghĩa, cấu trúc ngữ pháp, cách dùng theo thì, giới từ, phrasal verbs, collocations.

Điều này làm giảm khả năng khai thác triệt để từng từ trong quá trình học, vì phần lớn user cần một “bản phân tích ngữ nghĩa và ngữ dụng” thay vì chỉ một nghĩa đơn lẻ và một ví dụ ngắn.

## Mục tiêu

Thêm 1 nút trong sheet chi tiết từ để mở một trang phân tích từ vựng riêng, nơi AI sinh ra nội dung học tập động theo cấu trúc logic của từng ngôn ngữ, ví dụ:

- sắc thái nghĩa của từ và ví dụ
- dạng động từ nếu có và ví dụ
- cách dùng với các thì và ví dụ
- cách dùng với giới từ và ví dụ
- phrasal verbs liên quan
- collocations phổ biến

Trang này phải giúp người học hiểu sâu hơn về từ đó, không chỉ “biết nghĩa” mà còn “biết dùng như thế nào”.

## Phạm vi

- Frontend: thêm nút trong [polylex-global/apps/frontend/src/components/vocab/WordDetailSheet.tsx](polylex-global/apps/frontend/src/components/vocab/WordDetailSheet.tsx)
- Frontend: tạo route/page mới cho “word analysis” hiện đang chưa có trong [polylex-global/apps/frontend/src/App.tsx](polylex-global/apps/frontend/src/App.tsx)
- Backend: bổ sung API AI hoặc mở rộng service AI hiện có trong [polylex-global/apps/backend/src/modules/ai/ai.service.ts](polylex-global/apps/backend/src/modules/ai/ai.service.ts) và controller tương ứng trong [polylex-global/apps/backend/src/modules/ai/ai.controller.ts](polylex-global/apps/backend/src/modules/ai/ai.controller.ts)
- Có thể cần thêm data model hoặc DTO cho lời gọi AI động, nhưng không phải là migration database phức tạp

## Acceptance Criteria

- [ ] Có nút “Analyze word” hoặc tương đương trong sheet chi tiết từ.
- [ ] Nút dẫn người dùng tới một trang phân tích từ mới, có thể là route riêng hoặc modal/section được render theo pattern hiện có.
- [ ] Trang phân tích hiển thị ít nhất 6 phần chính theo cấu trúc logic ngôn ngữ: sắc thái nghĩa, động từ, thì, giới từ, phrasal verbs, collocations.
- [ ] Nội dung được sinh động bằng AI theo từng từ đang xem, không dùng template cố định chung chung.
- [ ] Nếu AI không sẵn sàng/ lỗi quota/ lỗi response, UX phải fallback rõ ràng: trạng thái loading, empty state, hoặc lỗi mô tả rõ ràng thay vì crash UI.
- [ ] Người dùng có thể quay lại màn hình từ chi tiết hoặc tiếp tục review ngay sau khi xem xong.
- [ ] Typecheck / lint / build frontend không bị lỗi mới.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu
| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-055 |
| **Tiêu đề** | Thêm nút phân tích từ + trang phân tích từ bằng AI |
| **Mục tiêu** | Cho phép người học mở một màn hình AI-generated analysis cho từ đang xem, giúp hiểu sắc thái, dạng động từ, thì, giới từ, phrasal verbs và collocations |
| **Phạm vi** | Frontend (vocabulary sheet + new page/route), Backend AI (prompt generation + API), có thể cần tích hợp với service AI hiện có |
| **Độ ưu tiên** | Cao |

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Thêm nút phân tích từ từ sheet chi tiết | Chỉ thêm CTA hợp lý trong sheet đang có | Frontend | Nhỏ |
| REQ-02 | Tạo flow route/page phân tích từ | Hỗ trợ route/ màn hình mới cho dữ liệu từ vựng đang xem | Frontend | Trung bình |
| REQ-03 | Tạo prompt động dựa trên từ + ngôn ngữ | Sinh prompt AI theo logic cấu trúc ngôn ngữ của từ | Backend/AI | Trung bình |
| REQ-04 | Xử lý response AI và UI render | Validate, parse JSON, fallback, loading/error state | Frontend + Backend | Trung bình |
| REQ-05 | Tối ưu UX cho reuse/điều hướng | Quay lại, các edge case và trải nghiệm học tập | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```text
REQ-01 ──> REQ-02 ──> REQ-04
   │
   └──> REQ-03 ──┘

REQ-03 ──> REQ-04
REQ-04 ──> REQ-05
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Thêm nút phân tích từ từ sheet chi tiết
- **Mục tiêu**: Người dùng có thể bắt đầu flow phân tích ngay từ hộp chi tiết từ.
- **Đầu vào**: Từ hiện tại, ngôn ngữ mục tiêu, các metadata có sẵn như `term`, `language.code`, `partOfSpeech`, `cefrLevel`.
- **Đầu ra mong đợi**: Một CTA rõ ràng, dễ click, không làm vỡ layout hiện tại.
- **Tiêu chí hoàn thành**: Nút xuất hiện trên sheet và khi bấm sẽ đi đúng route hoặc mở màn hình phân tích.
- **Phụ thuộc**: Không

##### REQ-02: Tạo flow route/page phân tích từ
- **Mục tiêu**: Có một trải nghiệm riêng cho “analysis”, không chen vào review hay library page.
- **Đầu vào**: ID từ / dữ liệu từ / query param.
- **Đầu ra mong đợi**: Trang hiển thị section breakdown theo cấu trúc logic ngữ pháp và ngữ nghĩa.
- **Tiêu chí hoàn thành**: Route mới hoạt động, đi tới đúng từ đang chọn, không mất context.
- **Phụ thuộc**: REQ-01

##### REQ-03: Tạo prompt động dựa trên từ + ngôn ngữ
- **Mục tiêu**: Tạo prompt AI tương ứng với cấu trúc ngôn ngữ của từ đó để trả về nội dung có cấu trúc.
- **Đầu vào**: `term`, `sourceLanguageCode`, `targetLanguageCode` hoặc ngôn ngữ gốc người dùng, mức độ CEFR, và context về từ loại nếu có.
- **Đầu ra mong đợi**: Một JSON hoặc object có cấu trúc xác định: nuance, verb forms, tense usage, prepositions, phrasal verbs, collocations, examples.
- **Tiêu chí hoàn thành**: Prompt có thể tạo nội dung khác nhau theo từng từ và theo từng ngôn ngữ; không chỉ cố định 6 phần với câu mẫu lặp lại.
- **Phụ thuộc**: REQ-02

##### REQ-04: Xử lý response AI và UI render
- **Mục tiêu**: Hiển thị nội dung với cấu trúc rõ ràng và kiểm soát lỗi tốt.
- **Đầu vào**: JSON response từ AI hoặc string fallback.
- **Đầu ra mong đợi**: Layout thân thiện, có heading, bullet, ví dụ, dacă không có nội dung thì empty state.
- **Tiêu chí hoàn thành**: UI không crash nếu AI không trả về dữ liệu; loading và error state hoạt động.
- **Phụ thuộc**: REQ-03

##### REQ-05: Tối ưu UX cho reuse/điều hướng
- **Mục tiêu**: Người dùng có thể quay về mà không mất tiến độ học tập và không gặp friction.
- **Đầu vào**: Theo hành vi chu trình từ sheet ➜ analysis ➜ quay lại.
- **Đầu ra mong đợi**: Điều hướng mượt, không làm mất context, nút back rõ ràng.
- **Tiêu chí hoàn thành**: User có thể xem phân tích rồi quay lại continue learning.
- **Phụộc**: REQ-02, REQ-04

### 3. Ngữ cảnh nghiệp vụ
- Luồng học từ vựng hiện có đang có flow: user mở danh sách từ → chọn từ → xem sheet chi tiết → có thể practice bằng review. Đây là where best place to add “deep-dive analysis” without breaking the core learning loop.
- Domain entity hiện có liên quan: `VocabItem`, `WordRow`, `LanguageBadge`, `PhoneticDisplay`, `exampleSentence`, `translations`, `partOfSpeech`, `cefrLevel` trong frontend. Từ này được mô hình hóa như một đơn vị học từ trong bộ nhớ người dùng và có các thông tin bổ trợ như âm thanh và ví dụ.
- Quy tắc nghiệp vụ cần bảo toàn: không làm nghẽn flow review, không khiến người dùng mất context khi xem chi tiết từ, phải giữ tính “học từ cấu trúc thực tế” thay vì chỉ dictionary lookup cơ bản.
- Hành vi hiện có cần bảo toàn: `BottomSheet` đóng mở, `playAudio`, `speakText`, `navigate('/review')`, `LanguageBadge`, và các layout đã xây sẵn.

### 4. Ngữ cảnh kỹ thuật
- Frontend hiện tại đang dùng React + Vite + TypeScript + React Router, route chính ở [polylex-global/apps/frontend/src/App.tsx](polylex-global/apps/frontend/src/App.tsx). Thêm route mới là hợp lý theo pattern đang có.
- File hiện tại chi tiết từ nằm ở [polylex-global/apps/frontend/src/components/vocab/WordDetailSheet.tsx](polylex-global/apps/frontend/src/components/vocab/WordDetailSheet.tsx). Đây là điểm chèn CTA phù hợp nhất.
- Backend AI đang có service phù hợp trong [polylex-global/apps/backend/src/modules/ai/ai.service.ts](polylex-global/apps/backend/src/modules/ai/ai.service.ts) với các method `generateContextSentence`, `generateMemoryHint`, `enrichWord`. Hệ thống này đã có pattern prompt -> validation -> JSON response.
- Controller AI hiện có ở [polylex-global/apps/backend/src/modules/ai/ai.controller.ts](polylex-global/apps/backend/src/modules/ai/ai.controller.ts) nhưng chưa có endpoint cho “word analysis” chuyên biệt. Khả năng thực hiện tốt nhất là thêm một method như `generateWordAnalysis`.
- Dữ liệu đầu vào từ frontend có thể reuse `term`, `language.code`, `targetLanguage`, `translations`, `partOfSpeech` và `cefrLevel`; trong backend có thể tạo prompt được định hướng theo ngôn ngữ mục tiêu và ngôn ngữ gốc người dùng.
- Tích hợp chính: REST API (`ai` endpoints), UI flow front-end, không cần socket/gateway/email cho ticket này.

### 5. Phân tích khoảng cách
| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| User xem từ chi tiết nhưng không có “deep-dive” analysis | User có thể bấm CTA để xem phân tích từ dạng AI | Cần thêm nút + route + API AI |
| Chỉ có example sentence đơn giản | Có cấu trúc analysis đầy đủ: nuance, verb forms, tense, preposition, phrasal verbs, collocations | Cần prompt template động và schema response |
| Không có route chuyên biệt cho analysis | Có một page hoặc modal chuyên biệt lưu context từ đang học | Cần route + state management |
| AI service chủ yếu tạo sentence/mnemonic | AI cần tạo structured learning breakdown | Cần thêm endpoint/service chính thức |

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] Rủi ro 1: Người dùng thấy content AI không consistent với ngôn ngữ đang học — Biện pháp giảm thiểu: dùng `termLanguageCode`, `nativeLanguageCode`, `cefrLevel`, `partOfSpeech` trong prompt và yêu cầu model trả về đúng ngữ cảnh.
- [ ] Rủi ro 2: Nội dung AI quá dài hoặc quá chuyên môn đối với người mới — Biện pháp giảm thiểu: giới hạn số mục, cú pháp rõ ràng, ưu tiên ví dụ ngắn và dễ hiểu.
- [ ] Rủi ro 3: Một số từ không có dạng động từ / giới từ / phrasal verbs rõ ràng — Biện pháp giảm thiểu: model phải được yêu cầu trả về `null`/`not_applicable` thay vì bịa nội dung.

#### 6.2 Rủi ro kỹ thuật
- [ ] Rủi ro 1: Prompt quá dài hoặc không đủ ngữ cảnh -> AI trả về response sai định dạng — Biện pháp giảm thiểu: dùng zod schema validation và fallback JSON parser.
- [ ] Rủi ro 2: API AI đang bị quota exhausted -> UI cần fallback graceful degradation — Biện pháp giảm thiểu: `ServiceUnavailableException` trong backend, hiển thị message rõ ràng ở frontend.
- [ ] Rủi ro 3: Route mới hoặc truyền state không giữ context đúng khi refresh / navigate — Biện pháp giảm thiểu: truyền `term` data qua route param hoặc lưu trong state ổn định, có fallback khi không tìm thấy từ.

#### 6.3 Lỗi logic tiềm ẩn
- [ ] Lỗi 1: Không kiểm tra `term`/`language` null hoặc không có dữ liệu khi mở page analysis — Cách phòng tránh: guard ở page-level và fallback message.
- [ ] Lỗi 2: Prompt mỗi lần gọi lại trả về đáp án khác nhau khiến UX không ổn định — Cách phòng tránh: định nghĩa schema cố định và sử dụng `temperature` thấp, thêm `system` instructions rõ.
- [ ] Lỗi 3: Một số từ có nhiều nghĩa khác nhau; AI có thể chọn nghĩa sai nếu không dùng context từ mục tiêu — Cách phòng tránh: thêm context `partOfSpeech`, `cefrLevel`, `target language`, và ví dụ cụ thể trong prompt.

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tăng đáng kể giá trị học từ vựng so với sheet hiện tại | Yêu cầu thêm API AI và xử lý error/fallback |
| Tận dụng được hệ thống AI đã có sẵn từ backend | Prompt động dễ biến động và khó kiểm soát chất lượng output |
| Dễ tích hợp vào flow review và library hiện tại | Có thể làm tăng thời gian load/latency của màn hình từ |
| Giúp người học hiểu sâu hơn ngữ nghĩa và ngữ dụng thực tế | Có thể cần tối ưu tài nguyên và quota Gemini |

### 8. Khuyến nghị
- **Cách tiếp cận khuyến nghị**: Thêm 1 CTA “Analyze word” trong sheet chi tiết, rồi mở route page mới. Tại backend, thêm endpoint `POST /ai/word-analysis` với prompt động theo `term`, `languageCode`, `nativeLanguageCode`, `cefrLevel`, và `partOfSpeech` khi có. Response phải tuân schema đã định nghĩa (JSON object with sections and examples). Frontend render từng section theo layout card thống nhất.
- **Các cách tiếp cận thay thế**: (1) Render modal inline thay vì page riêng; (2) Không dùng AI, chỉ hiển thị dictionary-style grammar notes; (3) Đặt analysis vào quick-note hoặc review session. Tuy nhiên, các phương án này đều kém hơn về khả năng mở rộng và giá trị học tập.
- **Phụ thuộc**: Cần có service AI đã được bật `GEMINI_ENABLED=true`; nếu không, page phải hiển thị fallback hoặc disabled state.
- **Ước tính công sức**: 1–2 ngày cho frontend + 0.5–1 ngày cho backend + 0.5 ngày cho qa và polish (tổng khoảng 2–3 ngày cho một version v1).

### 9. Câu hỏi mở
- [ ] Có muốn dùng 1 page riêng hay 1 modal fullscreen trong flow hiện tại? Page riêng
- [ ] Có cần phân tích theo từng ngôn ngữ cụ thể, hay chỉ hiển thị cho tiếng Anh/tiếng Nhật/tiếng Hàn theo template tối thiểu? theo ngôn ngữ cụ thể 
- [ ] Mức độ chi tiết của output AI có nên giới hạn ở 5–6 section mà không cần đoạn dài quá 2–3 câu mỗi mục? theo cách dễ nhìn nhất
- [ ] Nếu AI lỗi, có cần hiển thị “Try again” nhưng không mất dữ liệu từ hiện tại không? có
- [ ] Có cần lưu lịch sử analysis cho mỗi từ không, hay chỉ render theo lần request và không cache? có lưu vào db để dùng lại nếu từ đó đã phân tích rồi

---

## Kết luận

Ticket này không chỉ là “thêm nút” đơn thuần; đây là một feature chất lượng học tập nâng cấp trải nghiệm từ vựng từ “lookup” sang “deep understanding”. Với việc tận dụng backend AI hiện có, phối hợp với route frontend và UI schema rõ ràng, feature này có khả năng mang lại giá trị thực tế cao ngay trong luồng học tập hiện tại của PolyLex.

Mức độ thay đổi là vừa phải, nằm trong phạm vi của app frontend + AI service hiện có, nhưng cần chú ý đến chất lượng prompt, kiểm tra schema response, và UX fallback khi AI không sẵn sàng.

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thêm một CTA phân tích từ trong sheet chi tiết và mở một flow mới để AI tạo bản phân tích cấu trúc theo từng ngôn ngữ, sau đó render nội dung có sẵn trong UI với loading/error/fallback rõ ràng.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Thêm nút “Analyze word” trong sheet chi tiết từ hiện có.
2. FR-02: Tạo route/page riêng cho màn hình phân tích từ, giữ context từ đang chọn.
3. FR-03: Tạo endpoint AI để sinh nội dung phân tích theo cấu trúc logic của từ: sắc thái, động từ, thì, giới từ, phrasal verbs, collocations.
4. FR-04: Frontend parse và render response AI theo section rõ ràng, có ví dụ và fallback khi dữ liệu rỗng.
5. FR-05: Người dùng có thể quay lại hoặc tiếp tục review ngay sau khi xem analysis.

#### Ràng buộc phi chức năng
1. NFR-01: Không phá vỡ flow học từ vựng hiện tại và không làm chậm loading của sheet quá mức.
2. NFR-02: Response AI phải có schema rõ ràng và fallback graceful nếu Gemini không sẵn sàng.
3. NFR-03: Mỗi section nên ngắn gọn, dễ đọc, có ví dụ thực tế, không quá dài hoặc quá chuyên môn.
4. NFR-04: Không lưu quá nhiều state không cần thiết; ưu tiên route param/state nhẹ và reuse pattern hiện có.

#### Phụ thuộc
- DEP-01: Backend AI hiện có ở `apps/backend/src/modules/ai/` phải được mở rộng thay vì xây hệ thống mới.
- DEP-02: Frontend route đang dùng `react-router-dom` và `App.tsx`; cần thêm route mới theo pattern đã có.
- DEP-03: Cần dữ liệu từ `VocabItem` và metadata như `term`, `language`, `partOfSpeech`, `cefrLevel`, `translations` để xây prompt đúng ngữ cảnh.

### Cách tiếp cận
> Triển khai theo 4 phase: (1) thêm CTA và route; (2) mở rộng AI backend với schema structured response; (3) xây page render + loading/error/fallback; (4) verify smoke test và build / type-check. Mỗi phase được tách thành task atomic để dễ rollback và verification.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `polylex-global/apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Thêm nút “Analyze word” và điều hướng tới route mới |
| Tạo mới | `polylex-global/apps/frontend/src/pages/WordAnalysisPage.tsx` | Trang phân tích từ với state, fetch, loading, empty/error UI |
| Sửa đổi | `polylex-global/apps/frontend/src/App.tsx` | Đăng ký route `/word-analysis/:term` hoặc tương đương |
| Sửa đổi | `polylex-global/apps/backend/src/modules/ai/ai.controller.ts` | Thêm endpoint `POST /ai/word-analysis` |
| Sửa đổi | `polylex-global/apps/backend/src/modules/ai/ai.service.ts` | Thêm method `generateWordAnalysis` + schema/validation |
| Tạo mới | `polylex-global/apps/frontend/src/types/word-analysis.ts` | Định nghĩa type cho response AI của feature |
| Unit test | `polylex-global/apps/backend/src/modules/ai/ai.service.spec.ts` | Test prompt/schema response khi response hợp lệ và invalid |
| Unit test | `polylex-global/apps/frontend/src/pages/WordAnalysisPage.test.tsx` | Test loading/error/empty-state và render section |

---

## PLAN TODO

### Phase 1: Frontend CTA + Route

#### REQ-01: Thêm nút phân tích từ trong sheet chi tiết

- [ ] **TODO-1.1.1**: Thêm nút “Analyze word” vào sheet chi tiết
  - **File**: `polylex-global/apps/frontend/src/components/vocab/WordDetailSheet.tsx`
  - **Context**: Đọc file hiện tại và pattern nút `Volume2`, `RotateCcw`, `navigate('/review')` để giữ layout tương đồng.
  - **Thay đổi**: Thêm button mới phía dưới phần translations hoặc phía trên button practice; `onClick` gọi `navigate('/word-analysis/${encodeURIComponent(item.term)}')` hoặc dùng state navigation pattern phù hợp.
  - **Verify**: Mở màn hình word detail và xác nhận button hiển thị, không làm vỡ layout mobile sheet.
  - **Kết quả**: User click vào CTA sẽ có hành động rõ ràng và không phá layout hiện có.

- [ ] **TODO-1.1.2**: Đăng ký route mới trong router
  - **File**: `polylex-global/apps/frontend/src/App.tsx`
  - **Context**: Đọc `Routes` hiện có và các route protected trong app.
  - **Thay đổi**: Thêm route protected cho `/word-analysis/:term` hoặc `/word-analysis` và import page mới.
  - **Verify**: Mở URL route và kiểm tra render page mới không lỗi route.
  - **Kết quả**: Flow từ sheet sang page analysis hoạt động đúng.

#### REQ-02: Tạo page analysis và giữ context từ

- [ ] **TODO-1.2.1**: Tạo page `WordAnalysisPage` cơ bản
  - **File**: `polylex-global/apps/frontend/src/pages/WordAnalysisPage.tsx`
  - **Context**: Đọc pattern page hiện có như `DashboardPage`, `LibraryPage`, `ReviewPage` để giữ layout và spacing nhất quán.
  - **Thay đổi**: Tạo page với layout header, title từ, state `isLoading`, `error`, `analysis`, và button “Back to word”. Lấy `term` từ `useParams()` hoặc query param.
  - **Verify**: Render page với term hợp lệ, không crash khi fresh mount.
  - **Kết quả**: Page mới có thể render và chờ dữ liệu AI.

- [ ] **TODO-1.2.2**: Tạo type/interface cho response AI
  - **File**: `polylex-global/apps/frontend/src/types/word-analysis.ts`
  - **Context**: Đọc model dữ liệu từ `WordRow` / `VocabItem` để khớp field tương ứng.
  - **Thay đổi**: Định nghĩa interface cho các section: `nuance`, `verbForms`, `tenseUsage`, `prepositions`, `phrasalVerbs`, `collocations`, và `examples`.
  - **Verify**: TypeScript compile không báo lỗi.
  - **Kết quả**: Frontend có contract rõ ràng cho response AI.

### Phase 2: Backend AI Contract

#### REQ-03: Mở rộng AI service với prompt động và schema

- [ ] **TODO-2.1.1**: Thêm DTO cho request word analysis
  - **File**: `polylex-global/apps/backend/src/modules/ai/ai.controller.ts`
  - **Context**: Đọc các DTO hiện có `ContextSentenceDto`, `AiHintDto` và pattern `@ApiProperty` / `@IsString`.
  - **Thay đổi**: Thêm class `WordAnalysisDto` với field `term`, `languageCode`, `nativeLanguageCode`, `cefrLevel`, `partOfSpeech?`.
  - **Verify**: Swagger/validation compile đúng, không báo lỗi TypeScript.
  - **Kết quả**: Endpoint nhận đúng payload đầu vào từ frontend.

- [ ] **TODO-2.1.2**: Thêm method `generateWordAnalysis` vào AI service
  - **File**: `polylex-global/apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc các method `generateContextSentence`, `generateMemoryHint`, `enrichWord` và phần `zod` schema hiện có.
  - **Thay đổi**: Viết method mới, build prompt theo cấu trúc: nuance, verb forms, tense, preposition, phrasal verbs, collocations, examples; return object đã zod-validate.
  - **Verify**: Unit test/compile cho service không lỗi; mock AI response thực tế phải parse đúng JSON.
  - **Kết quả**: AI backend tạo payload có cấu trúc chuẩn để frontend render.

- [ ] **TODO-2.1.3**: Thêm schema zod cho union/response AI analysis
  - **File**: `polylex-global/apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc phần schema hiện có ở đầu file (`GeneratedPathSchema`, `DialogueSchema`).
  - **Thay đổi**: Thêm `WordAnalysisSchema` và các sub-schema để validate response như `nuance`, `verbForms`, `tenseUsage`, `prepositions`, `phrasalVerbs`, `collocations`.
  - **Verify**: Chạy unit test cho schema parse thành công với output hợp lệ và reject output không hợp lệ.
  - **Kết quả**: Response AI không bị sai format và không gây crash UI.

- [ ] **TODO-2.1.4**: Thêm controller endpoint exposure
  - **File**: `polylex-global/apps/backend/src/modules/ai/ai.controller.ts`
  - **Context**: Đọc controller `AiController` hiện tại và pattern `@Post` endpoint.
  - **Thay đổi**: Thêm method `@Post('word-analysis')` gọi `this.svc.generateWordAnalysis(...)`.
  - **Verify**: Start app hoặc run backend tests, call endpoint bằng Swagger hoặc curl mock.
  - **Kết quả**: API mới sẵn sàng cho frontend gọi.

### Phase 3: Frontend data fetch + UI render

#### REQ-04: Xử lý response AI và render section

- [ ] **TODO-3.1.1**: Thêm hook/data-fetch cho page analysis
  - **File**: `polylex-global/apps/frontend/src/pages/WordAnalysisPage.tsx`
  - **Context**: Đọc các page hiện có và flux data từ `useAuthStore`, `api client`, hoặc pattern fetch tương tự trong app.
  - **Thay đổi**: Tạo `useEffect` gọi API `/ai/word-analysis` với `term`, `languageCode`, `nativeLanguageCode`, `cefrLevel`, `partOfSpeech`; lưu `analysis`, `isLoading`, `error`.
  - **Verify**: Khi request thành công, state update đúng; khi API lỗi, hiển thị error card thay vì crash.
  - **Kết quả**: Page mới có dữ liệu AI hoặc fallback rõ ràng.

- [ ] **TODO-3.1.2**: Render 6 section chính theo cấu trúc logic của từ
  - **File**: `polylex-global/apps/frontend/src/pages/WordAnalysisPage.tsx`
  - **Context**: Đọc layout hiện tại của `WordDetailSheet` và mẫu phông chữ/spacing để giữ style đồng nhất.
  - **Thay đổi**: Render cards cho `Nuance`, `Verb forms`, `Tenses`, `Prepositions`, `Phrasal verbs`, `Collocations`, mỗi card có heading + list + ví dụ.
  - **Verify**: Trên màn hình mock data, mỗi section hiển thị đúng content và không tràn layout.
  - **Kết quả**: Người dùng thấy một page học tập rõ ràng, có cấu trúc và dễ hiểu.

- [ ] **TODO-3.1.3**: Thêm loading, empty, và retry UX
  - **File**: `polylex-global/apps/frontend/src/pages/WordAnalysisPage.tsx`
  - **Context**: Chưa có pattern rõ ràng trong app; cần dùng `button` + `toast`/message style riêng.
  - **Thay đổi**: Thêm skeleton/loading state, empty state “No analysis available”, và button “Try again” khi fetch lỗi hoặc quota thiếu.
  - **Verify**: Simulate error response trong UI test; kiểm tra button xuất hiện và text rõ ràng.
  - **Kết quả**: UX không bị trắng màn hình và khách hàng hiểu nguyên nhân lỗi.

### Phase 4: Integration & Verification

#### REQ-05: Tối ưu UX điều hướng và validation cuối cùng

- [ ] **TODO-4.1.1**: Thêm button quay lại và tiếp tục review
  - **File**: `polylex-global/apps/frontend/src/pages/WordAnalysisPage.tsx`
  - **Context**: Đọc pattern navigation của `RotateCcw` và `navigate('/review')` trong `WordDetailSheet.tsx`.
  - **Thay đổi**: Thêm nút “Back to details” và “Practice now”, router như `navigate(-1)` hoặc `navigate('/review')` tùy flow.
  - **Verify**: Click vào button quay lại và mới route mở đúng UI.
  - **Kết quả**: User không bị mất context và có path tiếp tục học rõ ràng.

- [ ] **TODO-4.1.2**: Viết unit test cho AI schema validate
  - **File**: `polylex-global/apps/backend/src/modules/ai/ai.service.spec.ts`
  - **Context**: Đọc cách viết test hiện có trong backend (nếu có) và pattern mock Gemini response.
  - **Thay đổi**: Test thành công với response hợp lệ; test fail với response thiếu `collocations` hoặc `verbForms` bắt buộc.
  - **Verify**: `npm test --workspace=apps/backend` hoặc test filter nếu có.
  - **Kết quả**: Logic schema được xác minh.

- [ ] **TODO-4.1.3**: Viết UI test cho flow page analysis
  - **File**: `polylex-global/apps/frontend/src/pages/WordAnalysisPage.test.tsx`
  - **Context**: Đọc test setup của frontend app hiện có, nếu có; nếu chưa có, tạo file test đơn giản với React Testing Library.
  - **Thay đổi**: Test loading state, render đúng 6 section khi data mock, và error state khi request reject.
  - **Verify**: `npm run test:unit --workspace=apps/frontend` hoặc tương đương.
  - **Kết quả**: Feature UI được verify trước khi merge.

- [ ] **TODO-4.2**: Build và type-check toàn bộ thay đổi
  - **File**: `polylex-global/package.json` (không sửa thường xuyên, chỉ dùng lệnh)
  - **Context**: Xem scripts root hiện có (`test:web`, `lint`, `build`).
  - **Thay đổi**: Chạy `npm run type-check --workspace=apps/frontend` và `npm run build --workspace=apps/frontend` / backend build nếu có.
  - **Verify**: Không có error TypeScript / build error mới.
  - **Kết quả**: Ready for review và merge.

---

## Ghi chú triển khai
- [ ] Nên ưu tiên route page riêng thay vì modal nội bộ, vì functionality phức tạp và cần section dài, dễ đọc.
- [ ] Nếu AI quota bị hết, page phải hiển thị message rõ ràng và có nút retry, không làm crash UI.
- [ ] Mỗi section nên cân bằng giữa “ngắn gọn” và “thực dụng”; không render văn bản quá dài trên mobile.
- [ ] Prompt nên chỉ yêu cầu dữ liệu hữu ích chứ không cố gắng trả ra quá nhiều đoạn mô tả không cần thiết.

## Rủi ro cần theo dõi
- [ ] Risk-1: Gemini trả về JSON sai schema hoặc thiếu field — Biện pháp: zod validate + fallback + retry.
- [ ] Risk-2: Một số từ không có động từ / giới từ / phrasal verbs rõ ràng — Biện pháp: trả về `null`/`not_applicable` thay vì bịa dữ liệu.
- [ ] Risk-3: Layout page quá dài trên mobile — Biện pháp: group sections theo card, tối đa 1-2 ví dụ mỗi block.
- [ ] Risk-4: Quota AI hết hoặc API timeout — Biện pháp: catch `ServiceUnavailableException`, hiển thị message rõ và button retry.

---

