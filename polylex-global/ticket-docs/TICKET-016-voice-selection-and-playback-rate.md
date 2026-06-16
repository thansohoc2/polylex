# TICKET-016 — Playback Rate Setting

## Yêu cầu gốc (đã thu hẹp phạm vi)

> "Cho thêm setting tốc độ phát ở frontend và dùng setting này cho các phát âm."
> *(Phần chọn giọng đọc per-language đã loại bỏ do phức tạp — giữ nguyên Male/Female hiện tại.)*

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-016 |
| **Tiêu đề** | Cài đặt tốc độ phát âm (frontend-only) |
| **Mục tiêu** | Thêm preset selector tốc độ phát vào Voice Settings trong ProfilePage. Lưu localStorage, áp dụng cho cả MP3 playback (`Audio.playbackRate`) và Web Speech API (`utterance.rate`). Không thay đổi backend. |
| **Phạm vi** | Frontend only — không có migration, không có API mới |
| **Độ ưu tiên** | Trung bình |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Zustand store `useAudioSettingsStore` | Tạo store đọc/ghi `localStorage` cho `{ rate }` — singleton, không race condition | Frontend / Store | Nhỏ |
| REQ-02 | Speed selector trong ProfilePage | Thêm 4 preset buttons vào khối Voice Settings | Frontend / Page | Nhỏ |
| REQ-03 | Tham số hóa rate trong `audio.ts` | `playAudio()` và `speakText()` nhận thêm `rate?` param | Frontend / Utils | Nhỏ |
| REQ-04 | Callers đọc rate từ store | `FlashCard.tsx`, `WordDetailSheet.tsx`, `ReviewPage.tsx` đọc rate từ store và truyền vào audio utils | Frontend / Components | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 (store cần trước UI)
REQ-01 ──> REQ-03 (store định nghĩa rate type/default)
REQ-03 ──> REQ-04 (audio.ts cần cập nhật signature trước callers)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Zustand store `useAudioSettingsStore`

- **Mục tiêu**: Single source of truth cho rate, persist localStorage, không race condition so với hook thuần
- **File mới**: `apps/frontend/src/store/audio-settings.store.ts`
- **State**:
  ```ts
  interface AudioSettingsState {
    rate: number;          // default: 0.9, clamp [0.5, 1.5]
    setRate: (r: number) => void;
  }
  ```
- **Persist**: Zustand `persist` middleware, key `polylex_audio_settings`
- **Tiêu chí hoàn thành**: Thay đổi rate → ghi localStorage; reload trang → đọc lại đúng giá trị
- **Phụ thuộc**: Không

##### REQ-02: Speed selector UI trong ProfilePage

- **File**: `apps/frontend/src/pages/ProfilePage.tsx`
- **Vị trí**: Trong khối Voice Settings, ngay dưới dropdown Male/Female
- **Thiết kế**: 4 preset buttons nằm ngang:

  | Label | Rate |
  |-------|------|
  | 🐢 Chậm | 0.6 |
  | 🚶 Vừa | 0.85 |
  | ⚡ Bình thường | 1.0 |
  | 🚀 Nhanh | 1.25 |

- Button active được highlight (indigo border/background), các button khác mờ
- `onClick` → `setRate(value)` → lưu localStorage ngay, **không cần nút Save riêng**
- **Tiêu chí hoàn thành**: Bấm preset → rate highlight đúng button → lần phát âm kế tiếp dùng rate mới
- **Phụ thuộc**: REQ-01

##### REQ-03: Tham số hóa rate trong `audio.ts`

- **File**: `apps/frontend/src/utils/audio.ts`
- **Thay đổi**:
  ```ts
  // Trước:
  export function playAudio(term: string, lang: string, audioUrl?: string | null): void
  export function speakText(text: string, lang: string): void

  // Sau:
  export function playAudio(term: string, lang: string, audioUrl?: string | null, rate?: number): void
  export function speakText(text: string, lang: string, rate?: number): void
  ```
- MP3: `audio.playbackRate = rate ?? 1.0`
- Web Speech: `u.rate = rate ?? 0.9`
- **Tiêu chí hoàn thành**: TypeScript không báo lỗi; rate được áp dụng đúng cho cả hai loại audio
- **Phụ thuộc**: Không (song song với REQ-01)

##### REQ-04: Callers đọc rate từ store

- **Files**: `FlashCard.tsx`, `WordDetailSheet.tsx`, `ReviewPage.tsx`
- **Thay đổi mỗi file**:
  ```ts
  const rate = useAudioSettingsStore((s) => s.rate);
  // Truyền vào các lần gọi:
  playAudio(term, lang, audioUrl, rate)
  speakText(sentence, lang, rate)
  ```
- **Tiêu chí hoàn thành**: Cả 3 component đều dùng rate từ store thay vì hardcode
- **Phụ thuộc**: REQ-01, REQ-03

---

### 3. Ngữ cảnh nghiệp vụ

- **TICKET-015** (tiền đề trực tiếp): Đã implement `playAudio()` + `speakText()` với `rate = 0.9` hardcoded. Ticket này tham số hóa rate đó.
- **Quy tắc**: Rate chỉ ảnh hưởng playback tức thì — MP3 đã cache trên R2 không cần generate lại, chỉ cần set `Audio.playbackRate` trước `.play()`.
- **Không thay đổi**: Voice gender (MALE/FEMALE), backend TTS pipeline, Prisma schema.

---

### 4. Ngữ cảnh kỹ thuật

#### Các file bị ảnh hưởng

| File | Loại thay đổi |
|------|---------------|
| `apps/frontend/src/store/audio-settings.store.ts` | **Tạo mới** — Zustand store với persist |
| `apps/frontend/src/utils/audio.ts` | Thêm `rate?` param cho `playAudio()` và `speakText()` |
| `apps/frontend/src/pages/ProfilePage.tsx` | Thêm 4 preset speed buttons vào Voice Settings |
| `apps/frontend/src/components/review/FlashCard.tsx` | Đọc rate từ store, truyền vào audio utils |
| `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Đọc rate từ store, truyền vào audio utils |
| `apps/frontend/src/pages/ReviewPage.tsx` | Đọc rate từ store, truyền vào audio utils |

#### Không thay đổi

| File | Lý do |
|------|-------|
| Backend (tất cả) | Rate là frontend concern, không cần persist server-side |
| `apps/frontend/src/api/client.ts` | Không có API call mới |
| Prisma schema & migrations | Không có DB change |

#### Zustand pattern hiện có trong project

Store `auth.store.ts` đã dùng Zustand → `audio-settings.store.ts` follow cùng pattern, thêm `persist` middleware từ `zustand/middleware`.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `rate = 0.9` hardcoded trong `audio.ts` | Rate cấu hình được theo ý user | Tham số hóa + store |
| Không có UI speed setting | 4 preset buttons trong Voice Settings | Thêm UI vào ProfilePage |
| 3 component audio không biết rate | Đọc rate từ Zustand store | Thêm store selector vào 3 component |

---

### 6. Đánh giá rủi ro

- **`Audio.playbackRate` out-of-range**: Browser cho phép 0.0625–16 nhưng chất lượng giảm ngoài [0.5, 2.0]. Biện pháp: Clamp trong store `setRate`, các preset đều nằm trong [0.6, 1.25] → an toàn.
- **Zustand `persist` chưa được cài**: Cần kiểm tra `zustand/middleware` đã available trong `package.json` frontend. Biện pháp: Xác minh trước khi implement.
- **Rate từ localStorage bị invalid (NaN, chuỗi)**: Cần validate khi hydrate store, fallback về `0.9`.
- **`WordDetailSheet.tsx` gọi `speakText()` cho translation buttons**: Các button đó cũng nên dùng rate từ store để nhất quán.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Frontend-only — zero backend change, zero migration | Rate không sync cross-device (localStorage) |
| Hiệu lực ngay tức thì không cần reload | — |
| `MP3.playbackRate` áp dụng cho audio đã cache → không regenerate | — |
| Zustand singleton → không race condition | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Zustand `persist` store + 4 preset buttons là đủ và đơn giản. Không cần slider.
- **Thứ tự triển khai**:
  1. REQ-01 (store) + REQ-03 (audio.ts) — song song
  2. REQ-02 (ProfilePage UI) + REQ-04 (callers) — song song sau bước 1
- **Ước tính công sức**: ~1 giờ

---

### 9. Câu hỏi mở

- [x] Rate persist lên server? → **Không** (localStorage đủ)
- [x] Voice selector per-language? → **Không làm** (phức tạp do multi-language mismatch)
- [x] Speed preset mặc định là `0.9` (như hiện tại) hay đổi về `1.0` (Bình thường)? → **`1.0` (Bình thường)** — preset ⚡ active mặc định
