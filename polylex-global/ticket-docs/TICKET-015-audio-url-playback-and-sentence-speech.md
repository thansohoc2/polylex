# TICKET-015 — Audio URL Playback & Sentence Pronunciation

## Yêu cầu gốc

> "Thay thế phát âm từ vựng bằng audio từ `audio_url` từ ticket trước. Và trong mỗi từ có câu mô tả hãy thêm 1 button để cho phát âm câu đó bằng web speech api."

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-015 |
| **Tiêu đề** | Thay thế phát âm từ bằng audio MP3 (R2) + thêm button phát âm câu ví dụ |
| **Mục tiêu** | (1) Khi user bấm button phát âm từ vựng, ưu tiên phát file MP3 từ `audioUrl` (Cloudflare R2, do TICKET-014 tạo ra), fallback về Web Speech API nếu `audioUrl` là null. (2) Với mỗi từ có `exampleSentence`, hiển thị thêm một button để phát âm câu đó qua Web Speech API. |
| **Phạm vi** | Frontend only (React TSX) — không cần thay đổi backend |
| **Độ ưu tiên** | Cao (cải thiện trải nghiệm người dùng trực tiếp) |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Cập nhật kiểu `VocabItem` | Thêm `audioUrl?: string \| null` vào interface `VocabItem` trong `WordRow.tsx` để các component dùng chung type này nhận được field mới | Frontend / Type | Nhỏ |
| REQ-02 | Cập nhật kiểu `QueueItem` trong ReviewPage & FlashCard | Thêm `audioUrl?: string \| null` vào `vocabularyBase` trong type `QueueItem` (khai báo cục bộ trong `ReviewPage.tsx` và `FlashCard.tsx`) | Frontend / Type | Nhỏ |
| REQ-03 | Replace phát âm từ trong `FlashCard.tsx` | Thay logic của Volume2 button (back side) từ Web Speech API thuần sang: ưu tiên `new Audio(audioUrl).play()`, fallback về Web Speech API khi `audioUrl` null | Frontend / Component | Nhỏ |
| REQ-04 | Replace phát âm từ trong `WordDetailSheet.tsx` | Thay logic của Volume2 button ở phần Term header sang: ưu tiên MP3 từ `audioUrl`, fallback Web Speech API | Frontend / Component | Nhỏ |
| REQ-05 | Replace phát âm tự động trong `ReviewPage.tsx` | Cập nhật `handleReveal()` — đang dùng `SpeechSynthesisUtterance` — để ưu tiên `audioUrl` khi có | Frontend / Page | Nhỏ |
| REQ-06 | Thêm button phát âm câu ví dụ trong `FlashCard.tsx` | Thêm một Volume2 button nhỏ cạnh khối `exampleSentence` (back side). Button gọi Web Speech API với nội dung câu và `language.code`. Phải `e.stopPropagation()` vì card wrapper có `onClick={onFlip}` | Frontend / Component | Nhỏ |
| REQ-07 | Thêm button phát âm câu ví dụ trong `WordDetailSheet.tsx` | Thêm Volume2 button trong khối Example (indigo-bordered div). Tái dụng hàm `speak()` cục bộ dùng Web Speech API | Frontend / Component | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-04 (VocabItem dùng trong WordDetailSheet)
REQ-01 ──> REQ-07 (VocabItem dùng trong WordDetailSheet)

REQ-02 ──> REQ-03 (QueueItem dùng trong FlashCard)
REQ-02 ──> REQ-05 (QueueItem dùng trong ReviewPage)
REQ-02 ──> REQ-06 (QueueItem dùng trong FlashCard)

REQ-03, REQ-04, REQ-05 (độc lập với nhau sau khi type đã có audioUrl)
REQ-06, REQ-07 (độc lập với nhau)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Cập nhật `VocabItem` interface
- **Mục tiêu**: Bổ sung `audioUrl` vào type dùng chung để WordDetailSheet và VocabularyPage nhận và truyền field này
- **File**: `apps/frontend/src/components/vocab/WordRow.tsx`
- **Thay đổi**: Thêm `audioUrl?: string | null;` vào `VocabItem`
- **Tiêu chí hoàn thành**: TypeScript không báo lỗi khi truyền `audioUrl` qua `VocabItem`
- **Phụ thuộc**: Không

##### REQ-02: Cập nhật `QueueItem` trong ReviewPage & FlashCard
- **Mục tiêu**: Type cục bộ `QueueItem` ở cả hai file phản ánh field `audioUrl` từ API response
- **File**: `apps/frontend/src/pages/ReviewPage.tsx`, `apps/frontend/src/components/review/FlashCard.tsx`
- **Thay đổi**: Thêm `audioUrl?: string | null;` vào `vocabularyBase` bên trong `QueueItem`
- **Lưu ý**: Backend `review.service.ts` dùng `include: { vocabularyBase: ... }` — Prisma tự động trả về tất cả scalar fields bao gồm `audioUrl`. Không cần thay đổi backend.
- **Tiêu chí hoàn thành**: TypeScript compiler chấp nhận `item.vocabularyBase.audioUrl`
- **Phụ thuộc**: Không

##### REQ-03: Replace phát âm từ trong `FlashCard.tsx`
- **Mục tiêu**: Khi user bấm Volume2 button (góc phải trên, back side), phát MP3 nếu `audioUrl` có, fallback Web Speech
- **File**: `apps/frontend/src/components/review/FlashCard.tsx`
- **Thay đổi**: Tạo hàm `playAudio(term, lang, audioUrl?)` thay thế `speak()`:
  ```ts
  function playAudio(term: string, lang: string, audioUrl?: string | null) {
    if (audioUrl) {
      new Audio(audioUrl).play();
    } else {
      const u = new SpeechSynthesisUtterance(term);
      u.lang = lang;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }
  ```
- **Tiêu chí hoàn thành**: Button gọi đúng `playAudio(term, lang, audioUrl)`, phát MP3 khi có URL
- **Phụ thuộc**: REQ-02

##### REQ-04: Replace phát âm từ trong `WordDetailSheet.tsx`
- **Mục tiêu**: Volume2 button ở Term header ưu tiên MP3 từ `audioUrl`
- **File**: `apps/frontend/src/components/vocab/WordDetailSheet.tsx`
- **Thay đổi**: Cập nhật hàm `speak()` cục bộ hoặc tạo helper `playAudio()` tương tự REQ-03; cập nhật `onClick` của button từ header
- **Lưu ý**: Các button phát âm translation (Web Speech API) KHÔNG thay đổi — chúng không có `audioUrl`
- **Tiêu chí hoàn thành**: Button header dùng MP3, button translation vẫn dùng Web Speech API
- **Phụ thuộc**: REQ-01

##### REQ-05: Replace phát âm tự động trong `ReviewPage.tsx`
- **Mục tiêu**: `handleReveal()` tự phát âm từ khi lật thẻ — cập nhật để dùng `audioUrl` trước
- **File**: `apps/frontend/src/pages/ReviewPage.tsx`
- **Thay đổi**: Trong `handleReveal()`, thay `new SpeechSynthesisUtterance(...)` bằng cùng logic `playAudio()` với `currentItem.vocabularyBase.audioUrl`
- **Tiêu chí hoàn thành**: Lật thẻ phát MP3 khi `audioUrl` khác null
- **Phụ thuộc**: REQ-02

##### REQ-06: Thêm button phát âm câu ví dụ trong `FlashCard.tsx`
- **Mục tiêu**: Người dùng có thể nghe đọc `exampleSentence` trong khi review
- **File**: `apps/frontend/src/components/review/FlashCard.tsx`
- **Vị trí**: Cạnh (inline) hoặc góc phải của đoạn text `exampleSentence` ở back side
- **Thay đổi**:
  - Bổ sung `hàm speakSentence(sentence, lang)` dùng Web Speech API
  - Wrap `exampleSentence` trong `<div className="relative">` và thêm button Volume2 nhỏ
  - Button phải gọi `e.stopPropagation()` để không trigger `onFlip`
- **Tiêu chí hoàn thành**: Button hiển thị khi có `exampleSentence`; click phát âm câu; không lật thẻ
- **Phụ thuộc**: REQ-02 (để lấy `language.code`)

##### REQ-07: Thêm button phát âm câu ví dụ trong `WordDetailSheet.tsx`
- **Mục tiêu**: Người dùng có thể nghe đọc câu ví dụ từ detail sheet
- **File**: `apps/frontend/src/components/vocab/WordDetailSheet.tsx`
- **Vị trí**: Trong khối Example (indigo-bordered div), bên cạnh hoặc cuối đoạn text
- **Thay đổi**: Thêm một Volume2 button nhỏ trong div example, gọi `speak(item.exampleSentence, item.language.code)`
- **Tiêu chí hoàn thành**: Button hiển thị trong Example block; click phát âm câu qua Web Speech API
- **Phụ thuộc**: REQ-01

---

### 3. Ngữ cảnh nghiệp vụ

- **TICKET-014 (tiền đề)**: Đã implement Google Cloud TTS + Cloudflare R2. Khi một từ mới được thêm hoặc user chọn giọng đọc, hệ thống generate MP3 và lưu URL vào `vocabularyBase.audioUrl`. Nếu chưa generate, `audioUrl` là `null`.
- **Luồng review**: User vào `/review` → `ReviewPage` lấy queue từ `GET /review/queue` → render `FlashCard` → lật thẻ xem đáp án → bấm button phát âm → bấm Easy/Medium/Hard để tiếp tục.
- **Luồng vocabulary**: User vào `/vocabulary` → `VocabularyPage` liệt kê từ → bấm từ → `WordDetailSheet` mở bottom sheet → xem chi tiết, nghe phát âm.
- **Quy tắc nghiệp vụ**:
  - Phát âm từ: MP3 nếu có → Web Speech API nếu không
  - Phát âm câu: Web Speech API luôn luôn (không có caching cho câu)
  - Translation pronunciation buttons: Không thay đổi (vẫn Web Speech API)

---

### 4. Ngữ cảnh kỹ thuật

#### Các file bị ảnh hưởng

| File | Loại thay đổi |
|------|---------------|
| `apps/frontend/src/components/vocab/WordRow.tsx` | Thêm `audioUrl` vào `VocabItem` interface |
| `apps/frontend/src/components/review/FlashCard.tsx` | Thêm `audioUrl` vào `QueueItem`, replace `speak()`, thêm sentence button |
| `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Replace `speak()` cho term, thêm sentence button |
| `apps/frontend/src/pages/ReviewPage.tsx` | Thêm `audioUrl` vào `QueueItem`, update `handleReveal()` |

#### Không cần thay đổi

| File | Lý do |
|------|-------|
| `apps/backend/src/modules/review/review.service.ts` | `include: { vocabularyBase: {...} }` trả về tất cả scalar fields → `audioUrl` đã có trong response |
| `apps/frontend/src/pages/VocabularyPage.tsx` | Spread `uv.vocabularyBase` vào `VocabItem` — khi type được cập nhật, `audioUrl` tự động chảy qua |
| `apps/frontend/src/api/client.ts` | `vocabularyApi.getAudio(id)` (lazy generate) giữ nguyên như TICKET-014 |

#### Prisma schema xác nhận

```prisma
// VocabularyBase model
audioUrl         String?  @map("audio_url")  // scalar field → included by default
```

#### Cấu trúc `QueueItem.vocabularyBase` hiện tại (FlashCard.tsx)

```ts
vocabularyBase: {
  term: string;
  phonetic?: string;
  exampleSentence?: string;
  language: { code: string; name: string };
  translations: { translation: string; targetLanguage: { code: string; name: string } }[];
}
// ← thiếu audioUrl
```

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `VocabItem` không có `audioUrl` | `VocabItem` có `audioUrl?: string \| null` | Thêm field vào type |
| `QueueItem.vocabularyBase` không có `audioUrl` | `QueueItem.vocabularyBase` có `audioUrl?: string \| null` | Thêm field vào type (2 file) |
| Term pronunciation dùng Web Speech API 100% | Term pronunciation: MP3 ưu tiên, Web Speech API fallback | Cập nhật hàm `speak()` / `playAudio()` |
| Phát âm tự động `handleReveal()` dùng Web Speech API | `handleReveal()` dùng MP3 nếu `audioUrl` có | Cập nhật `handleReveal()` |
| Không có button phát âm `exampleSentence` | Button Volume2 hiện cạnh example sentence | Thêm button + handler |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ

- [x] **`audioUrl` là null cho nhiều từ cũ**: TICKET-014 chỉ generate khi user request, nhiều từ chưa có MP3 → fallback Web Speech API xử lý tốt. Biện pháp: Luôn kiểm tra `if (audioUrl)` trước khi `new Audio(audioUrl).play()`.
- [x] **Khác biệt user experience**: MP3 (Google TTS) có thể có âm lượng khác Web Speech API → không gây lỗi nhưng cần lưu ý. Biện pháp: Không cần xử lý đặc biệt.

#### 6.2 Rủi ro kỹ thuật

- [x] **`new Audio(url).play()` có thể bị browser block**: Autoplay policy của trình duyệt có thể block `.play()` nếu không có user gesture ngay trước đó. Trong trường hợp Volume2 button click → đây là user gesture → an toàn. Với `handleReveal()` auto-play: lật thẻ là user click → cũng an toàn.
- [x] **CORS từ Cloudflare R2**: URL trong `audioUrl` trỏ về R2 bucket. Nếu bucket chưa cấu hình CORS headers cho frontend domain, `Audio.play()` sẽ fail. Biện pháp: Wrap `play()` trong `try/catch` và fallback Web Speech API nếu lỗi.
- [x] **Duplicate type khai báo**: `QueueItem` được khai báo cục bộ ở cả `FlashCard.tsx` và `ReviewPage.tsx` — sync thủ công cần cẩn thận. Biện pháp: Cập nhật cả hai file trong cùng commit.
- [x] **`e.stopPropagation()` không gọi**: Card wrap có `onClick={onFlip}`, sentence button nằm trong card → bấm có thể trigger flip. Biện pháp: Tất cả audio button đều phải gọi `e.stopPropagation()`.

#### 6.3 Lỗi logic tiềm ẩn

- [x] **`audioUrl` là empty string `""`**: Cần check `if (audioUrl)` chứ không phải `if (audioUrl !== null)` để bỏ qua empty string.
- [x] **`handleReveal()` phát âm tự động trùng với user bấm button**: Khi thẻ lật, `handleReveal()` tự phát — nếu user bấm Volume2 ngay sau, có thể bị chồng âm. Biện pháp: `window.speechSynthesis.cancel()` trước khi speak (đã có trong `WordDetailSheet.speak()`), tương tự dừng Audio trước khi play mới.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Âm thanh TTS chất lượng cao (Google Cloud) thay thế Web Speech API browser | Phụ thuộc vào `audioUrl` đã được generate — từ mới chưa có TTS sẽ fallback |
| Trải nghiệm nhất quán giữa các thiết bị (browser khác nhau có giọng đọc Web Speech khác nhau) | Cần R2 CORS được cấu hình đúng |
| Sentence pronunciation button tăng khả năng học nghe | Tăng nhẹ bundle ảnh hưởng (không đáng kể — chỉ thêm `new Audio()`) |
| Chỉ thay đổi frontend — zero downtime backend | Duplicate type `QueueItem` ở 2 file cần sync thủ công |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Tạo helper function `playAudio(term, lang, audioUrl?)` trong `FlashCard.tsx` và tương tự trong `WordDetailSheet.tsx` (hoặc extract vào `utils/audio.ts` nếu muốn tái dụng). Wrap `Audio.play()` trong `try/catch` với fallback Web Speech.

- **Cách tiếp cận thay thế**: Extract `playAudio` thành custom hook `useAudioPlayer()` để tái dụng giữa FlashCard, WordDetailSheet, ReviewPage. Trade-off: overhead nhỏ nhưng DRY hơn.

- **Thứ tự triển khai đề xuất**:
  1. REQ-01 (type VocabItem) + REQ-02 (type QueueItem) — song song
  2. REQ-03, REQ-04, REQ-05 — song song (sau khi types xong)
  3. REQ-06, REQ-07 — song song

- **Ước tính công sức**: ~1–2 giờ (4 file, thay đổi nhỏ và cục bộ)

---

### 9. Câu hỏi mở

- [ ] R2 bucket đã cấu hình CORS cho domain frontend chưa? (nếu chưa, `Audio.play()` sẽ fail silently)
- [ ] Có muốn extract `playAudio` thành shared util (`src/utils/audio.ts`) để tránh duplicate code giữa các component không?
- [ ] Sentence button dùng icon gì? Volume2 (giống term button) hay icon khác (e.g., `MessageSquare`)? → Mặc định đề xuất dùng Volume2 với kích thước nhỏ hơn.
