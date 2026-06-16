# TICKET-023: Cải thiện phiên âm và phát âm TTS đa ngôn ngữ

## Mô tả
Hệ thống TTS hiện tại chỉ hỗ trợ 7 ngôn ngữ (en, vi, ja, ko, zh, fr, de). Mọi ngôn ngữ khác (Tây Ban Nha, Bồ Đào Nha, Ý, Nga, Ả Rập, Hindi, Thái, v.v.) đều fallback về giọng `en-US`, khiến phát âm hoàn toàn sai. Ngoài ra, phần phiên âm do AI sinh ra chỉ dùng IPA chung, nhưng mỗi ngôn ngữ có hệ ký âm phù hợp riêng (Pinyin cho tiếng Trung, Furigana/Romaji cho tiếng Nhật, v.v.) giúp người học tiếp thu hiệu quả hơn nhiều.

## Tiêu chí chấp nhận
- Mọi từ ngữ đều được phát âm bằng giọng đúng ngôn ngữ nguồn (không fallback về tiếng Anh)
- Ít nhất 15 ngôn ngữ phổ biến được hỗ trợ TTS với giọng chất lượng cao (Neural2/Chirp3)
- Chinese TTS phân biệt được `zh` (Simplified/CN) vs `zh-TW` (Traditional/TW)
- Phiên âm AI trả về đúng hệ ký âm của từng ngôn ngữ (Pinyin cho tiếng Trung, Romaji+Kana cho tiếng Nhật, IPA cho Latin script)
- `VocabularyBase.phoneticRomaji` (field mới) lưu ký âm Latin bổ sung cho CJK languages
- Frontend hiển thị đúng loại phiên âm tương ứng ngôn ngữ

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-023 |
| **Tiêu đề** | Cải thiện phiên âm & phát âm TTS đa ngôn ngữ |
| **Mục tiêu** | TTS phát âm đúng giọng mọi ngôn ngữ học; phiên âm dùng hệ ký âm phù hợp từng ngôn ngữ (Pinyin, Romaji, IPA...) |
| **Phạm vi** | Backend (voice-map, TtsService, AiService) · DB (VocabularyBase) · Frontend (display phonetics) |
| **Độ ưu tiên** | Cao — ảnh hưởng trực tiếp đến chất lượng học cho mọi người dùng học ngôn ngữ ngoài tiếng Anh |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Mở rộng voice-map TTS | Thêm ≥15 ngôn ngữ vào `voice-map.constants.ts` với giọng Neural2/Wavenet + xử lý variant code (zh-TW, pt-BR) | Service / Config | Nhỏ |
| REQ-02 | Chuẩn hóa language code cho TTS | Normalize `langCode` khi lookup voice (zh→cmn-CN, zh-TW→cmn-TW, pt-BR vs pt-PT) + fallback log warning thay vì silent fallback về en | Service | Nhỏ |
| REQ-03 | SSML wrap cho TTS | Dùng `input: { ssml }` thay vì `input: { text }` với `<lang>` tag để đảm bảo phát âm đúng ngôn ngữ | Service | Nhỏ |
| REQ-04 | DB: field phoneticRomaji | Thêm `phoneticRomaji String?` vào `VocabularyBase` để lưu ký âm Latin (Pinyin/Romaji) bổ sung cho IPA | DB + Migration | Nhỏ |
| REQ-05 | AI: language-aware phonetics | Cải thiện prompt `enrichWord()` để trả về đúng hệ ký âm theo ngôn ngữ: Pinyin (zh), Romaji+Furigana (ja), IPA (các ngôn ngữ Latin), v.v. | AI Service | Trung bình |
| REQ-06 | Tách phonetic fields trong AI response | `enrichWord()` trả thêm `phoneticRomaji` (Pinyin / Romaji / null) bên cạnh `phonetic` (IPA) | AI Service | Nhỏ |
| REQ-07 | Frontend: hiển thị phonetics theo ngôn ngữ | Component phiên âm ưu tiên `phoneticRomaji` cho CJK, fallback `phonetic` cho phần còn lại; style riêng cho Pinyin tonal marks | Frontend | Trung bình |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 (cần có map đầy đủ trước khi normalize)
REQ-02 ──> REQ-03 (normalize xong mới biết languageCode chính xác để build SSML)

REQ-04 ──> REQ-06 (cần field DB trước khi AI populate)
REQ-05 ──> REQ-06 (cải thiện prompt là tiền đề của tách fields)
REQ-06 ──> REQ-07 (Frontend dùng data mới từ REQ-06)

REQ-01, REQ-02, REQ-03 ── độc lập với REQ-04, REQ-05, REQ-06
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Mở rộng voice-map TTS
- **Mục tiêu**: Mọi ngôn ngữ phổ biến đều có giọng đọc chất lượng cao, không còn fallback về `en-US`
- **Đầu vào**: Language code từ `Language.code` trong DB
- **Đầu ra mong đợi**: `getVoiceConfig('es', 'FEMALE')` trả `{ languageCode: 'es-ES', name: 'es-ES-Neural2-A', ... }` thay vì fallback về en
- **Ngôn ngữ cần thêm**: `es` (Tây Ban Nha), `pt` (Bồ Đào Nha BR), `it` (Ý), `ru` (Nga), `ar` (Ả Rập), `hi` (Hindi), `th` (Thái), `nl` (Hà Lan), `pl` (Ba Lan), `sv` (Thụy Điển), `tr` (Thổ Nhĩ Kỳ), `id` (Indonesia), `ms` (Malay), `uk` (Ukraine)
- **Tiêu chí hoàn thành**: Tất cả ngôn ngữ trên có entry trong `VOICE_MAP` với cả MALE/FEMALE, sử dụng Neural2 nếu Google hỗ trợ, fallback Wavenet nếu không
- **Phụ thuộc**: Không

##### REQ-02: Chuẩn hóa language code cho TTS
- **Mục tiêu**: Language code từ DB có thể có dạng `zh`, `zh-TW`, `pt-BR`, `pt-PT` — cần normalize đúng trước khi lookup
- **Đầu vào**: Raw `langCode` từ `VocabularyBase.language.code`
- **Đầu ra mong đợi**: `normalizeLangCode('zh-TW')` → lookup `zh-tw` → trả giọng `cmn-TW-Wavenet-A`; `normalizeLangCode('pt-BR')` → `pt-br` → giọng Brazilian Portuguese
- **Tiêu chí hoàn thành**: Hàm `getVoiceConfig` xử lý cả simple code (`zh`) lẫn full locale (`zh-TW`); khi không tìm thấy thì log warning với `langCode` cụ thể thay vì silent fallback
- **Phụ thuộc**: REQ-01

##### REQ-03: SSML wrap cho TTS input
- **Mục tiêu**: Tránh TTS đọc từ sai ngôn ngữ khi từ có hình thức trùng với từ English (ví dụ: "hai" trong tiếng Việt vs tiếng Anh)
- **Đầu vào**: `term`, `voice.languageCode`
- **Đầu ra mong đợi**: TTS nhận `<speak><lang xml:lang="vi-VN">hai</lang></speak>` thay vì `hai`
- **Tiêu chí hoàn thành**: `synthesize()` trong `TtsService` build SSML string với `<lang>` tag; không ảnh hưởng kết quả với các ngôn ngữ thuần Latin
- **Phụ thuộc**: REQ-02

##### REQ-04: DB field phoneticRomaji
- **Mục tiêu**: Lưu ký âm Latin (Pinyin, Romaji, Transliteration) tách biệt với IPA để frontend dùng phù hợp ngữ cảnh
- **Đầu vào**: AI sinh ra từ `enrichWord()` (REQ-06)
- **Đầu ra mong đợi**: `VocabularyBase.phoneticRomaji = "hǎo"` (Chinese), `"はな → hana"` (Japanese), `null` cho ngôn ngữ Latin
- **Tiêu chí hoàn thành**: Field `phoneticRomaji String? @map("phonetic_romaji")` xuất hiện trong schema; migration chạy thành công; Prisma Client regenerate
- **Phụ thuộc**: Không

##### REQ-05: AI language-aware phonetics prompt
- **Mục tiêu**: Prompt `enrichWord()` chỉ định hệ ký âm phù hợp từng ngôn ngữ thay vì yêu cầu IPA chung chung
- **Hệ ký âm theo ngôn ngữ**:
  - `zh`, `zh-TW`: Pinyin với dấu thanh (ā á ǎ à) cho `phonetic`; Hán tự phát âm cho `phoneticRomaji`
  - `ja`: IPA cho `phonetic`; Hiragana reading + Romaji cho `phoneticRomaji` (e.g. `はな → hana`)
  - `ko`: IPA cho `phonetic`; Revised Romanization cho `phoneticRomaji` (e.g. `han-guk`)
  - `ar`: IPA cho `phonetic`; ALA-LC transliteration cho `phoneticRomaji`
  - `hi`, `th`, `ru`, ngôn ngữ dùng non-Latin script: IPA cho `phonetic`; Romanization cho `phoneticRomaji`
  - `en`, `fr`, `de`, `es`, `it`, v.v. (Latin script): IPA cho `phonetic`; `phoneticRomaji = null`
- **Tiêu chí hoàn thành**: `EnrichedWordResult` interface thêm `phoneticRomaji: string | null`; AI prompt có instructions rõ ràng theo `sourceLanguageCode`
- **Phụ thuộc**: Không

##### REQ-06: Tách phonetic fields trong AI response + persist
- **Mục tiêu**: Lưu cả `phonetic` (IPA) và `phoneticRomaji` (Latinized) vào DB khi enrich từ
- **Đầu vào**: Output từ `enrichWord()` với `phoneticRomaji`
- **Đầu ra mong đợi**: `vocabularyBase.phonetic = "/hǎo/"`, `vocabularyBase.phoneticRomaji = "hǎo"` cho từ tiếng Trung "好"
- **Tiêu chí hoàn thành**: `CreateVocabularyDto` có `phoneticRomaji?`; `VocabularyService.create()` và `upsertBulk()` persist field mới; `BulkVocabItem` interface thêm `phoneticRomaji`
- **Phụ thuộc**: REQ-04, REQ-05

##### REQ-07: Frontend hiển thị phonetics theo ngôn ngữ
- **Mục tiêu**: Người học thấy ký âm thích hợp: Pinyin cho tiếng Trung, Kana/Romaji cho tiếng Nhật, IPA cho các ngôn ngữ khác
- **Logic hiển thị**: Nếu `phoneticRomaji` có giá trị → hiển thị `phoneticRomaji` chính, `phonetic` (IPA) phụ nhỏ hơn; nếu không có `phoneticRomaji` → chỉ hiển thị `phonetic`
- **Tiêu chí hoàn thành**: Component `PhoneticDisplay` (hoặc inline trong VocabularyCard) xử lý 2 field; Pinyin với dấu thanh hiển thị đúng font; type defs trong `shared-types` cập nhật
- **Phụ thuộc**: REQ-06

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng liên quan**: User học từ vựng trong lộ trình AI (TICKET-007) hoặc thêm từ thủ công → xem phiên âm + nghe phát âm → luyện tập. Nếu phiên âm sai hoặc phát âm từ TTS sai giọng ngôn ngữ, trải nghiệm học bị phá vỡ hoàn toàn.
- **Thực thể domain liên quan**:
  - `VocabularyBase` — `phonetic` (IPA), thêm `phoneticRomaji` (Pinyin/Romaji)
  - `Language` — `code` là key lookup trong `VOICE_MAP`
  - `User.ttsVoiceGender` — preference gender, không thay đổi
- **Quy tắc nghiệp vụ**:
  - Phát âm PHẢI đúng ngôn ngữ nguồn — không chấp nhận fallback về tiếng Anh
  - `phoneticRomaji` chỉ có ý nghĩa với non-Latin script languages; null với Latin script
  - `phonetic` (IPA) vẫn giữ làm field chính — `phoneticRomaji` là bổ sung
- **Hành vi cần bảo toàn**: `audioUrl` cache logic (TICKET-014) không thay đổi; chỉ cải thiện chất lượng input cho TTS synthesize

---

### 4. Ngữ cảnh kỹ thuật

**Vấn đề hiện tại xác nhận qua code:**

1. **`voice-map.constants.ts`** — chỉ 7 ngôn ngữ, `FALLBACK = VOICE_MAP['en']` silent fallback hoàn toàn sai cho mọi ngôn ngữ chưa map
2. **`getVoiceConfig(langCode, gender)`** — `langCode.toLowerCase()` không xử lý locale variants: `'zh-TW'.toLowerCase()` → `'zh-tw'` không khớp key `'zh'`
3. **`TtsService.synthesize()`** — `input: { text: term }` không có `<lang>` tag, TTS có thể đọc sai với từ đồng hình giữa các ngôn ngữ
4. **`ai.service.ts` `enrichWord()` prompt** — `"phonetic": IPA phonetic transcription string, or null if not applicable` — không chỉ định hệ ký âm theo ngôn ngữ; AI thường trả IPA sai chuẩn cho CJK
5. **`VocabularyBase`** — chỉ có `phonetic String?`, không có field riêng cho Romaji/Pinyin
6. **`upsertBulk()` trong `vocabulary.service.ts`** — `BulkVocabItem` interface không có `phoneticRomaji`; AI path generation (TICKET-007) cũng không populate field này
7. **`GeneratedPathVocab` trong `ai.service.ts`** — interface có `phonetic?` nhưng không có `phoneticRomaji?`; prompt `generateLearningPath()` cũng không yêu cầu Romaji

**Files sẽ bị ảnh hưởng:**

| File | Thay đổi |
|------|---------|
| `apps/backend/prisma/schema.prisma` | Thêm `phoneticRomaji String? @map("phonetic_romaji")` vào `VocabularyBase` |
| `apps/backend/src/modules/vocabulary/voice-map.constants.ts` | Mở rộng `VOICE_MAP` từ 7 → ≥15 ngôn ngữ; xử lý locale variants; cải thiện fallback |
| `apps/backend/src/modules/vocabulary/tts.service.ts` | Dùng SSML `<lang>` tag trong `synthesize()` |
| `apps/backend/src/modules/ai/ai.service.ts` | Cải thiện prompt `enrichWord()` + `generateLearningPath()` cho language-aware phonetics; thêm `phoneticRomaji` vào `EnrichedWordResult` và `GeneratedPathVocab` |
| `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | `upsertBulk()` persist `phoneticRomaji`; `create()` persist `phoneticRomaji` |
| `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts` | Thêm `phoneticRomaji?` vào `CreateVocabularyDto` |
| `apps/frontend/src/...` | Component PhoneticDisplay hoặc update VocabularyCard |
| `packages/shared-types/src/...` | Update type `VocabularyBase` thêm `phoneticRomaji` |

**Migration cần tạo**: thêm cột `phonetic_romaji VARCHAR` nullable vào bảng `vocabulary_base`.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| 7 ngôn ngữ trong VOICE_MAP, fallback `en-US` | ≥15 ngôn ngữ, fallback có log warning | Thiếu ~8 ngôn ngữ phổ biến trong VOICE_MAP |
| `zh` → `cmn-CN-Wavenet-C` (Wavenet, chất lượng thấp hơn) | `zh` → `cmn-CN-Neural2-B` (Neural2) + `zh-TW` → `cmn-TW-Wavenet-A` | Voice quality + TW variant chưa có |
| `getVoiceConfig('zh-TW', 'FEMALE')` → fallback `en-US` | → giọng Mandarin Traditional `cmn-TW-Wavenet-A` | Locale variant `'zh-tw'` không match key `'zh'` |
| `input: { text: term }` | `input: { ssml: '<speak><lang xml:lang="vi-VN">hai</lang></speak>' }` | TTS có thể phát âm sai với đồng hình từ |
| `enrichWord()` chỉ trả IPA chung | Trả IPA + Pinyin/Romaji tùy ngôn ngữ | Prompt không có language-awareness; `EnrichedWordResult` thiếu `phoneticRomaji` |
| `VocabularyBase` không có `phoneticRomaji` | Field `phoneticRomaji String?` trong schema | Cần migration mới |
| `BulkVocabItem` không có `phoneticRomaji` | Interface thêm `phoneticRomaji?` | upsertBulk không persist Romaji |
| Frontend hiển thị 1 field phonetic | Hiển thị Romaji/Pinyin ưu tiên + IPA phụ cho CJK | Frontend component cần cập nhật |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Từ vựng hiện có không có `phoneticRomaji`**: Hàng nghìn từ trong DB đã tồn tại sẽ không có Pinyin/Romaji — Biện pháp: migration chỉ thêm nullable field; có thể trigger re-enrich batch async cho các từ CJK hiện có nếu cần (optional, scope riêng)
- [ ] **User đang học ngôn ngữ không có trong voice map mới**: Nếu ngôn ngữ của họ vẫn không được thêm vào → Biện pháp: thêm logging rõ ràng; frontend ẩn nút play khi `audioUrl = null`

#### 6.2 Rủi ro kỹ thuật
- [ ] **Google TTS Neural2 availability**: Không phải ngôn ngữ nào cũng có Neural2 voice — Biện pháp: fallback xuống Wavenet vẫn đúng ngôn ngữ (tốt hơn nhiều so với en-US), ghi rõ trong comment voice map
- [ ] **SSML compatibility**: Một số ngôn ngữ RTL (Arabic, Hebrew) có thể cần thêm xử lý SSML đặc biệt — Biện pháp: test với ngôn ngữ RTL; fallback sang `input: { text }` nếu SSML fail
- [ ] **AI Pinyin accuracy**: Gemini có thể sinh Pinyin sai dấu thanh cho tiếng Trung — Biện pháp: dùng thêm `<phoneme>` tag trong SSML nếu cần; người dùng có thể báo lỗi (scope khác)
- [ ] **`cmn-CN` vs `zh-CN`**: Google TTS dùng `cmn-CN` (Mandarin) không phải `zh-CN` — Biện pháp: normalize map xử lý đúng, đã có trong REQ-01
- [ ] **SSML term escaping**: Nếu `term` chứa ký tự đặc biệt XML (`<`, `>`, `&`, `"`) → SSML invalid — Biện pháp: escape term trước khi inject vào SSML template

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **`'zh-TW'.toLowerCase()` = `'zh-tw'`** không match key `'zh'` hiện tại: `getVoiceConfig('zh-TW', ...)` fallback về en-US ngay bây giờ — Cách phòng tránh: normalize bằng cách split `-` lấy prefix hoặc dùng full locale map
- [ ] **`phoneticRomaji` null cho Latin script nhưng `phonetic` cũng null**: Frontend render trống — Cách phòng tránh: ẩn phần phiên âm khi cả 2 field đều null
- [ ] **Escaped HTML trong Pinyin**: Dấu thanh Pinyin (ā á ǎ à) là Unicode, không cần escape — nhưng cần test với tất cả tonal marks
- [ ] **`generateLearningPath()` prompt không sinh `phoneticRomaji`**: Từ được tạo từ AI path sẽ không có Romaji ngay — Cách phòng tránh: thêm `phoneticRomaji` vào format prompt `generateLearningPath()` cùng lúc với REQ-05

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Phát âm đúng ngôn ngữ cho mọi user — cải thiện core learning experience | Cần test manual TTS với từng ngôn ngữ mới thêm |
| SSML `<lang>` tag tránh đọc sai từ đồng hình đa ngôn ngữ | Thêm logic SSML build nhỏ trong `TtsService` |
| Pinyin/Romaji trực quan hơn IPA với người học CJK languages | AI có thể không luôn sinh Romaji chính xác 100% |
| Tách `phoneticRomaji` field: clean separation, dễ query riêng | Cần migration DB và update nhiều file |
| Không ảnh hưởng cache hiện có (TICKET-014) — chỉ thêm, không xóa | Từ cũ không có `phoneticRomaji` cần re-enrich riêng nếu muốn đầy đủ |
| Neural2 voices chất lượng cao hơn Wavenet hiện tại cho Chinese | Số lượng Neural2 voices Google TTS hạn chế cho một số ngôn ngữ |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Chia làm 2 nhóm độc lập có thể deploy riêng:
  - **Nhóm A (TTS fix — impact ngay)**: REQ-01 + REQ-02 + REQ-03 — sửa voice map, normalize, SSML. Không cần migration, không thay đổi frontend. Deploy được ngay.
  - **Nhóm B (Phonetics enhancement)**: REQ-04 + REQ-05 + REQ-06 + REQ-07 — DB field mới, AI prompt cải thiện, frontend display. Cần migration và cẩn thận hơn.
- **Thứ tự khuyến nghị**: Nhóm A trước vì fix bug phát âm sai nghiêm trọng hơn; Nhóm B sau vì là enhancement.
- **Phụ thuộc bên ngoài**:
  - Kiểm tra danh sách voice Google Cloud TTS tại: https://cloud.google.com/text-to-speech/docs/voices để xác nhận tên voice chính xác cho từng ngôn ngữ mới trước khi commit vào `voice-map.constants.ts`
  - Chirp3 HD voices (nếu org đã enable billing) chất lượng tốt nhất — có thể dùng thay Neural2
- **Ước tính công sức**: Nhóm A ~2-3h; Nhóm B ~4-5h; tổng ~6-8h

---

### 9. Câu hỏi mở

- [x] **Chirp3 vs Neural2**: ~~Dự án có đang dùng Google TTS trả phí hay free tier?~~ → **Free tier** — dùng Neural2/Wavenet, không dùng Chirp3 HD.
- [x] **Ngôn ngữ nào cần ưu tiên thêm trước?** → **Bồ Đào Nha (`pt`)** ưu tiên số 1. Sau đó thêm toàn bộ các ngôn ngữ thiếu trong 1 lần.
- [x] **Re-enrich batch**: → **Không cần** — chỉ áp dụng cho từ mới tạo từ đây về sau.
- [x] **`zh-TW` trong DB**: → **Đã xác nhận** — seed data có entry riêng `{ code: 'zh-TW', name: 'Chinese (Traditional)' }`. Bug hiện tại: `'zh-TW'.toLowerCase()` = `'zh-tw'` không match key `'zh'` trong VOICE_MAP → fallback về `en-US`. Cần thêm key `'zh-tw'` riêng vào VOICE_MAP với voice `cmn-TW-Wavenet-A/B`.

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Sửa bug TTS phát âm sai ngôn ngữ (Nhóm A — deploy ngay, không cần migration): mở rộng VOICE_MAP từ 7 → 29+ ngôn ngữ, fix locale normalization cho `zh-TW`, dùng SSML `<lang>` tag. Sau đó bổ sung phonetics đa ngôn ngữ (Nhóm B): thêm `phoneticRomaji` vào DB + AI + Frontend.

### Yêu cầu chức năng
1. FR-01: `getVoiceConfig('pt', 'FEMALE')` trả giọng `pt-PT-Wavenet-A` thay vì `en-US-Neural2-F`
2. FR-02: `getVoiceConfig('zh-TW', 'FEMALE')` trả giọng `cmn-TW-Wavenet-A` thay vì fallback `en-US`
3. FR-03: `getVoiceConfig('<unknown>', 'FEMALE')` log warning và fallback `en-US` — không silent
4. FR-04: `synthesize('hoa', 'vi', 'FEMALE')` gửi SSML `<speak><lang xml:lang="vi-VN">hoa</lang></speak>` — đúng ngôn ngữ
5. FR-05: `enrichWord('好', 'zh', 'vi')` trả `{ phonetic: 'hǎo', phoneticRomaji: 'hǎo', ... }`
6. FR-06: `enrichWord('花', 'ja', 'en')` trả `{ phonetic: '/hana/', phoneticRomaji: 'はな (hana)', ... }`
7. FR-07: `VocabularyBase.phoneticRomaji` được persist khi tạo từ mới (create + upsertBulk)
8. FR-08: Frontend hiển thị `phoneticRomaji` chính + `phonetic` phụ cho CJK; chỉ `phonetic` cho Latin script

### Ràng buộc phi chức năng
1. NFR-01: Free tier Google TTS — chỉ Neural2 và Wavenet (không dùng Chirp3 HD)
2. NFR-02: Nhóm A (REQ-01/02/03) không cần DB migration — deploy độc lập
3. NFR-03: Không re-enrich batch từ cũ — `phoneticRomaji` chỉ cho từ mới
4. NFR-04: SSML term phải được XML-escape để tránh injection vào `input.ssml`
5. NFR-05: `npx tsc --noEmit` xanh sau mỗi phase
6. NFR-06: Single File Rule — mỗi TODO chỉ thay đổi 1 file

### Phụ thuộc
- DEP-01: `voice-map.constants.ts` — cần mở rộng VOICE_MAP (REQ-01) trước khi sửa logic lookup (REQ-02)
- DEP-02: `getVoiceConfig` đã fix (REQ-02) trước khi add SSML (REQ-03) — cần `voice.languageCode` chính xác để build SSML
- DEP-03: `EnrichedWordResult` interface update (REQ-05) trước khi update zod schema (REQ-06)
- DEP-04: Prisma migration (REQ-04) trước khi service persist `phoneticRomaji` (REQ-06)
- DEP-05: `PhoneticDisplay` component tạo trước khi update từng component dùng nó (REQ-07)
- DEP-06: Backend `VocabularyService.upsertBulk` và `create` đang inject trực tiếp — không cần thay đổi DI

### Cách tiếp cận
> **Nhóm A trước** (3 TODOs, cùng 1 file groups, không cần DB): fix voice-map constants → fix getVoiceConfig normalizer → thêm SSML wrap. Có thể merge và deploy ngay. **Nhóm B sau**: migration nhỏ → AI prompt → service layer → frontend. Mỗi phase verify bằng `tsc --noEmit`.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa | `apps/backend/src/modules/vocabulary/voice-map.constants.ts` | Thêm 22+ ngôn ngữ vào VOICE_MAP + key `zh-tw`; fix lookup normalize; log warning |
| Sửa | `apps/backend/src/modules/vocabulary/tts.service.ts` | Thay `input: { text }` bằng `input: { ssml }` với `<lang>` tag + XML escape |
| Sửa | `apps/backend/prisma/schema.prisma` | Thêm `phoneticRomaji String? @map("phonetic_romaji")` vào `VocabularyBase` |
| Tạo | `apps/backend/prisma/migrations/.../migration.sql` | Auto-generated bởi Prisma |
| Sửa | `apps/backend/src/modules/ai/ai.service.ts` | Interface `EnrichedWordResult` + `GeneratedPathVocab` thêm `phoneticRomaji`; cải thiện prompts |
| Sửa | `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts` | `CreateVocabularyDto` + `BulkVocabItem` thêm `phoneticRomaji?` |
| Sửa | `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | `create()` + `upsertBulk()` persist `phoneticRomaji` |
| Tạo | `apps/frontend/src/components/ui/PhoneticDisplay.tsx` | Component CJK-aware: Romaji ưu tiên + IPA phụ |
| Sửa | `apps/frontend/src/components/vocab/WordRow.tsx` | Interface + dùng `PhoneticDisplay` |
| Sửa | `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Interface + dùng `PhoneticDisplay` |
| Sửa | `apps/frontend/src/components/review/FlashCard.tsx` | Interface + dùng `PhoneticDisplay` |
| Sửa | `apps/frontend/src/components/quick-note/QuickNoteCard.tsx` | Interface + dùng `PhoneticDisplay` |
| Sửa | `apps/frontend/src/components/roadmap/StageRow.tsx` | Interface + dùng `PhoneticDisplay` |

---

## PLAN TODO

### Phase 0: Nhóm A — TTS Fix (không cần migration)

#### REQ-01 + REQ-02: Mở rộng VOICE_MAP và fix lookup

- [ ] **TODO-0.1.1**: Mở rộng `VOICE_MAP`
  - **File**: `apps/backend/src/modules/vocabulary/voice-map.constants.ts`
  - **Context**: Đọc file hiện tại để hiểu format `VoiceConfig` và `VOICE_MAP`
  - **Thay đổi**:
    - Nâng cấp `zh` từ Wavenet → `cmn-CN-Neural2-B` (MALE), `cmn-CN-Neural2-A` (FEMALE)
    - Thêm key mới `'zh-tw'`: `{ MALE: { languageCode: 'cmn-TW', name: 'cmn-TW-Wavenet-B', ... }, FEMALE: { languageCode: 'cmn-TW', name: 'cmn-TW-Wavenet-A', ... } }`
    - Thêm theo thứ tự ưu tiên — Group Neural2 trước, Wavenet sau:
      ```
      pt  → pt-PT-Wavenet-D (MALE),  pt-PT-Wavenet-A (FEMALE)   [ưu tiên #1]
      es  → es-ES-Neural2-B (MALE),  es-ES-Neural2-A (FEMALE)
      it  → it-IT-Neural2-C (MALE),  it-IT-Neural2-A (FEMALE)
      hi  → hi-IN-Neural2-B (MALE),  hi-IN-Neural2-A (FEMALE)
      th  → th-TH-Neural2-C (MALE),  th-TH-Neural2-A (FEMALE)
      ru  → ru-RU-Wavenet-B (MALE),  ru-RU-Wavenet-A (FEMALE)
      ar  → ar-XA-Wavenet-B (MALE),  ar-XA-Wavenet-A (FEMALE)
      nl  → nl-NL-Wavenet-D (MALE),  nl-NL-Wavenet-A (FEMALE)
      pl  → pl-PL-Wavenet-B (MALE),  pl-PL-Wavenet-A (FEMALE)
      sv  → sv-SE-Wavenet-B (MALE),  sv-SE-Wavenet-A (FEMALE)
      tr  → tr-TR-Wavenet-B (MALE),  tr-TR-Wavenet-A (FEMALE)
      id  → id-ID-Wavenet-B (MALE),  id-ID-Wavenet-A (FEMALE)
      uk  → uk-UA-Wavenet-B (MALE),  uk-UA-Wavenet-A (FEMALE)
      bn  → bn-IN-Wavenet-B (MALE),  bn-IN-Wavenet-A (FEMALE)
      el  → el-GR-Wavenet-B (MALE),  el-GR-Wavenet-A (FEMALE)
      fi  → fi-FI-Wavenet-B (MALE),  fi-FI-Wavenet-A (FEMALE)
      cs  → cs-CZ-Wavenet-A (MALE),  cs-CZ-Wavenet-A (FEMALE)  [chỉ 1 giọng]
      da  → da-DK-Wavenet-C (MALE),  da-DK-Wavenet-A (FEMALE)
      no  → nb-NO-Wavenet-D (MALE),  nb-NO-Wavenet-A (FEMALE)
      hu  → hu-HU-Wavenet-B (MALE),  hu-HU-Wavenet-A (FEMALE)
      ro  → ro-RO-Wavenet-B (MALE),  ro-RO-Wavenet-A (FEMALE)
      ms  → ms-MY-Wavenet-B (MALE),  ms-MY-Wavenet-A (FEMALE)
      he  → he-IL-Wavenet-C (MALE),  he-IL-Wavenet-A (FEMALE)
      ```
    - Các code `fa` (Persian), `sw` (Swahili), `tl` (Filipino), `ur` (Urdu) hiện Google TTS chưa hỗ trợ ổn định — để comment `// TODO: add when Google TTS support available`
  - **Verify**: `npx tsc --noEmit` từ `apps/backend/` — compile sạch
  - **Kết quả**: VOICE_MAP chứa 29+ ngôn ngữ; `zh-tw` key tồn tại; `zh` dùng Neural2

  > ⚠️ **Quan trọng**: Xác nhận tên voice chính xác tại https://cloud.google.com/text-to-speech/docs/voices trước khi commit — tên voice `cmn-TW-Wavenet-B` và các Wavenet ít phổ biến cần verify. Nếu voice không tồn tại, TTS sẽ throw error runtime.

- [ ] **TODO-0.2.1**: Sửa hàm `getVoiceConfig()` — normalize locale code + warning fallback
  - **File**: `apps/backend/src/modules/vocabulary/voice-map.constants.ts`
  - **Context**: Đọc TODO-0.1.1 vừa hoàn thành để biết các key trong VOICE_MAP
  - **Thay đổi**:
    - Import hoặc tạo `logger` inline: `const logger = new (require('@nestjs/common').Logger)('VoiceMap');`
    - Sửa `getVoiceConfig`:
      ```typescript
      export function getVoiceConfig(langCode: string, gender: 'MALE' | 'FEMALE'): VoiceConfig {
        const normalized = langCode.toLowerCase(); // 'zh-TW' → 'zh-tw', 'en-US' → 'en-us'
        // Try exact match first (handles 'zh-tw'), then base code ('en' from 'en-us')
        const map = VOICE_MAP[normalized] ?? VOICE_MAP[normalized.split('-')[0]] ?? null;
        if (!map) {
          console.warn(`[VoiceMap] No TTS voice configured for language: "${langCode}" — falling back to en-US`);
          return FALLBACK[gender];
        }
        return map[gender];
      }
      ```
    - Giữ `const FALLBACK = VOICE_MAP['en'];` như cũ
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: `getVoiceConfig('zh-TW', 'FEMALE')` trả `cmn-TW-Wavenet-A`; `getVoiceConfig('xyz', 'MALE')` in warning thay vì silent fallback

#### REQ-03: SSML wrap

- [ ] **TODO-0.3.1**: Sửa `synthesize()` trong `TtsService` — dùng SSML `<lang>` tag + XML-escape term
  - **File**: `apps/backend/src/modules/vocabulary/tts.service.ts`
  - **Context**: Đọc `voice-map.constants.ts` để hiểu `VoiceConfig.languageCode`
  - **Thay đổi**:
    - Thêm hàm helper XML escape trước class (không export):
      ```typescript
      function xmlEscape(text: string): string {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      }
      ```
    - Trong `synthesize()`, thay block `input: { text: term }` bằng:
      ```typescript
      const ssml = `<speak><lang xml:lang="${voice.languageCode}">${xmlEscape(term)}</lang></speak>`;
      const [response] = await this.client.synthesizeSpeech({
        input: { ssml },
        voice: { ... }, // giữ nguyên
        audioConfig: { audioEncoding: 'MP3' as never },
      });
      ```
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: TTS nhận SSML với đúng `xml:lang`; từ đồng hình đa ngôn ngữ phát âm đúng

---

### Phase 1: DB Schema (Nhóm B bắt đầu)

#### REQ-04: field phoneticRomaji

- [ ] **TODO-1.4.1**: Thêm field `phoneticRomaji` vào model `VocabularyBase` trong Prisma schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc model `VocabularyBase` hiện tại để xác định vị trí thêm field
  - **Thay đổi**: Thêm sau field `phonetic`:
    ```prisma
    phonetic         String?  // IPA pronunciation
    phoneticRomaji   String?  @map("phonetic_romaji") // Pinyin (zh), Romaji (ja/ko), null for Latin scripts
    ```
  - **Verify**: `npx prisma validate` — schema hợp lệ
  - **Kết quả**: Schema chấp nhận field mới; sẵn sàng migrate

- [ ] **TODO-1.4.2**: Chạy Prisma migration để tạo cột `phonetic_romaji`
  - **File**: `apps/backend/prisma/migrations/` (auto-generated)
  - **Context**: Đọc `schema.prisma` vừa sửa ở TODO-1.4.1
  - **Thay đổi**: Từ `apps/backend/` chạy:
    ```bash
    npx prisma migrate dev --name add_phonetic_romaji_to_vocabulary_base
    ```
  - **Verify**: Migration file xuất hiện trong `migrations/`; `npx prisma generate` thành công
  - **Kết quả**: Cột `phonetic_romaji VARCHAR NULL` tồn tại trong DB; Prisma Client regenerate với `phoneticRomaji?: string | null`

---

### Phase 2: AI Service

#### REQ-05: Cải thiện prompt enrichWord()

- [ ] **TODO-2.5.1**: Thêm `phoneticRomaji` vào interface `EnrichedWordResult` trong `ai.service.ts`
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc interface `EnrichedWordResult` hiện tại (dòng ~36-42)
  - **Thay đổi**: Thêm field vào interface:
    ```typescript
    export interface EnrichedWordResult {
      phonetic: string | null;
      phoneticRomaji: string | null; // Pinyin for zh, Romaji for ja/ko, null for Latin scripts
      cefrLevel: string | null;
      partOfSpeech: string | null;
      translationText: string;
      exampleSentence: string | null;
    }
    ```
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: Interface có `phoneticRomaji`; TypeScript enforce caller phải handle field mới

- [ ] **TODO-2.5.2**: Cải thiện prompt trong `enrichWord()` cho language-aware phonetics
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc method `enrichWord()` hiện tại (dòng ~200-230 approx)
  - **Thay đổi**: Thay thế toàn bộ prompt string trong `enrichWord()`:
    ```typescript
    const phoneticInstructions = (() => {
      const lang = sourceLanguageCode.toLowerCase().split('-')[0];
      if (lang === 'zh') return `- "phonetic": Pinyin with tone marks (e.g. "nǐ hǎo")\n- "phoneticRomaji": same Pinyin (copy of phonetic)`;
      if (lang === 'ja') return `- "phonetic": IPA transcription\n- "phoneticRomaji": Hiragana/Katakana reading + Romaji (e.g. "はな (hana)")`;
      if (lang === 'ko') return `- "phonetic": IPA transcription\n- "phoneticRomaji": Revised Romanization (e.g. "han-guk")`;
      if (['ar', 'hi', 'ru', 'uk', 'bn', 'fa', 'ur', 'th', 'he'].includes(lang))
        return `- "phonetic": IPA transcription\n- "phoneticRomaji": Latin transliteration`;
      return `- "phonetic": IPA transcription (e.g. "/ˈæpəl/")\n- "phoneticRomaji": null (Latin script — no romanization needed)`;
    })();

    const prompt = `You are a professional linguist.
    Analyze the word/phrase and return a JSON object with exactly these keys:
    ${phoneticInstructions}
    - "cefrLevel": CEFR level (A1/A2/B1/B2/C1/C2), or null
    - "partOfSpeech": primary part of speech in English, or null
    - "translationText": translation into ${targetLanguageCode} — REQUIRED, never null
    - "exampleSentence": one natural example sentence in ${sourceLanguageCode}, or null

    Word: "${term}"
    Source language: ${sourceLanguageCode}
    Target language: ${targetLanguageCode}`;
    ```
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: Prompt yêu cầu đúng hệ ký âm theo ngôn ngữ; AI trả `phoneticRomaji` có giá trị cho CJK

#### REQ-06: Cập nhật generateLearningPath()

- [ ] **TODO-2.6.1**: Thêm `phoneticRomaji` vào interface `GeneratedPathVocab` + Zod schema
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc interface `GeneratedPathVocab` và `GeneratedPathVocabSchema` trong cùng file
  - **Thay đổi**:
    - Interface: thêm `phoneticRomaji?: string`
    - Zod schema: thêm `phoneticRomaji: z.string().optional()`
    ```typescript
    export interface GeneratedPathVocab {
      term: string;
      phonetic?: string;
      phoneticRomaji?: string;  // ← thêm
      cefrLevel?: string;
      partOfSpeech?: string;
      translation: string;
      exampleSentence?: string;
    }
    // ...
    const GeneratedPathVocabSchema = z.object({
      term: z.string(),
      phonetic: z.string().optional(),
      phoneticRomaji: z.string().optional(),  // ← thêm
      // ... rest unchanged
    });
    ```
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: `GeneratedPathVocab` type-safe với `phoneticRomaji`

- [ ] **TODO-2.6.2**: Cập nhật prompt `generateLearningPath()` để yêu cầu `phoneticRomaji`
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc method `generateLearningPath()` và đặc biệt phần JSON format instructions
  - **Thay đổi**: Trong prompt, thêm `phoneticRomaji` vào JSON example format:
    ```
    {{
      "term": "word",
      "phonetic": "IPA or Pinyin with tones",
      "phoneticRomaji": "Romaji/Pinyin/transliteration or null for Latin scripts",
      "cefrLevel": "A1",
      ...
    }}
    ```
    Thêm instruction trước format block:
    ```
    For "phoneticRomaji": use Pinyin (zh), Hiragana+Romaji (ja), Revised Romanization (ko), Latin transliteration (ar/hi/ru/th), null for Latin-script languages.
    ```
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: AI path generation trả `phoneticRomaji` cho từ CJK; null cho Latin script

---

### Phase 3: Backend Service Layer

#### REQ-06: Persist phoneticRomaji trong VocabularyService

- [ ] **TODO-3.6.1**: Thêm `phoneticRomaji?` vào `CreateVocabularyDto` và interface `BulkVocabItem`
  - **File**: `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts`
  - **Context**: Đọc `CreateVocabularyDto` và file `vocabulary.service.ts` để tìm `BulkVocabItem`
  - **Thay đổi**:
    - Trong `CreateVocabularyDto`: thêm sau field `phonetic`:
      ```typescript
      @ApiPropertyOptional({ example: 'hǎo', description: 'Pinyin/Romaji/transliteration for non-Latin scripts' })
      @IsOptional()
      @IsString()
      phoneticRomaji?: string;
      ```
    - `BulkVocabItem` interface nằm trong `vocabulary.service.ts` — **TODO riêng** (TODO-3.6.2)
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: DTO có `phoneticRomaji?`; validation đúng chuẩn

- [ ] **TODO-3.6.2**: Thêm `phoneticRomaji?` vào interface `BulkVocabItem` và update `create()` trong `VocabularyService`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: Đọc interface `BulkVocabItem` (dòng ~27) và method `create()` (dòng ~42-80)
  - **Thay đổi**:
    - Interface `BulkVocabItem`: thêm `phoneticRomaji?: string`
    - `create()`: thêm `phoneticRomaji: dto.phoneticRomaji ?? null` vào `data` object của `prisma.vocabularyBase.create`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: `create()` persist `phoneticRomaji`; `BulkVocabItem` type-safe

- [ ] **TODO-3.6.3**: Update `upsertBulk()` để persist `phoneticRomaji`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: Đọc method `upsertBulk()` (dòng ~240-310 approx) và Prisma schema `VocabularyBase`
  - **Thay đổi**:
    - Trong block `create`: thêm `phoneticRomaji: item.phoneticRomaji ?? null`
    - Trong block `update` (prisma update conditional): thêm `...(item.phoneticRomaji ? { phoneticRomaji: item.phoneticRomaji } : {})`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: Bulk upsert (từ AI path generation) persist `phoneticRomaji`

---

### Phase 4: Frontend

#### REQ-07: Component PhoneticDisplay + update 5 component hiển thị

- [ ] **TODO-4.7.1**: Tạo component `PhoneticDisplay` — CJK-aware phonetic display
  - **File**: `apps/frontend/src/components/ui/PhoneticDisplay.tsx` **(tạo mới)**
  - **Context**: Đọc `WordRow.tsx` và `WordDetailSheet.tsx` để hiểu pattern hiển thị phonetic hiện tại
  - **Thay đổi**: Tạo component:
    ```tsx
    interface PhoneticDisplayProps {
      phonetic?: string | null;
      phoneticRomaji?: string | null;
      size?: 'xs' | 'sm';
    }

    // Languages using non-Latin scripts that benefit from Romaji display
    const CJK_LIKE_LANGS = ['zh', 'zh-tw', 'ja', 'ko', 'ar', 'hi', 'ru', 'uk', 'th', 'bn', 'he', 'fa'];

    export function isCjkLike(langCode?: string): boolean {
      if (!langCode) return false;
      return CJK_LIKE_LANGS.includes(langCode.toLowerCase());
    }

    export default function PhoneticDisplay({ phonetic, phoneticRomaji, size = 'sm' }: PhoneticDisplayProps) {
      if (!phonetic && !phoneticRomaji) return null;
      const textSize = size === 'xs' ? 'text-xs' : 'text-sm';
      const subSize = 'text-xs';

      if (phoneticRomaji) {
        return (
          <span className="inline-flex items-baseline gap-1.5">
            <span className={`font-medium text-[#94A3B8] ${textSize}`}>{phoneticRomaji}</span>
            {phonetic && (
              <span className={`font-mono text-[#475569] ${subSize}`}>{phonetic}</span>
            )}
          </span>
        );
      }
      return <span className={`font-mono text-[#475569] ${textSize}`}>{phonetic}</span>;
    }
    ```
  - **Verify**: `npx tsc --noEmit` từ `apps/frontend/` — compile sạch
  - **Kết quả**: Component tái sử dụng được; Romaji hiển thị chính, IPA phụ nhỏ hơn

- [ ] **TODO-4.7.2**: Update `WordRow.tsx` — thêm `phoneticRomaji` vào `VocabItem` + dùng `PhoneticDisplay`
  - **File**: `apps/frontend/src/components/vocab/WordRow.tsx`
  - **Context**: Đọc `VocabItem` interface và render hiện tại của phonetic (dòng 7, 33-34)
  - **Thay đổi**:
    - `VocabItem` interface: thêm `phoneticRomaji?: string | null`
    - Import `PhoneticDisplay`
    - Thay `{item.phonetic && <span ...>{item.phonetic}</span>}` bằng:
      `<PhoneticDisplay phonetic={item.phonetic} phoneticRomaji={item.phoneticRomaji} size="xs" />`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: WordRow hiển thị Pinyin/Romaji khi có; IPA khi không có

- [ ] **TODO-4.7.3**: Update `WordDetailSheet.tsx` — thêm `phoneticRomaji` + dùng `PhoneticDisplay`
  - **File**: `apps/frontend/src/components/vocab/WordDetailSheet.tsx`
  - **Context**: Đọc `VocabItem` import từ `WordRow` (dòng 6) và dòng render phonetic (43-44)
  - **Thay đổi**: `VocabItem` interface đã update ở TODO-4.7.2 (cùng type); chỉ cần:
    - Import `PhoneticDisplay`
    - Thay `{item.phonetic && <span ...>{item.phonetic}</span>}` bằng `<PhoneticDisplay phonetic={item.phonetic} phoneticRomaji={item.phoneticRomaji} />`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: WordDetailSheet dùng PhoneticDisplay nhất quán với WordRow

- [ ] **TODO-4.7.4**: Update `FlashCard.tsx` — thêm `phoneticRomaji` vào nested type + dùng `PhoneticDisplay`
  - **File**: `apps/frontend/src/components/review/FlashCard.tsx`
  - **Context**: Đọc inline interface `QueueItem.vocabularyBase` (dòng 10-18) và render phonetic (99-100)
  - **Thay đổi**:
    - `vocabularyBase` object trong `QueueItem`: thêm `phoneticRomaji?: string | null`
    - Import `PhoneticDisplay`
    - Thay `{item.vocabularyBase.phonetic && <p ...>{item.vocabularyBase.phonetic}</p>}` bằng `<PhoneticDisplay phonetic={item.vocabularyBase.phonetic} phoneticRomaji={item.vocabularyBase.phoneticRomaji} />`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: Flashcard review hiển thị đúng ký âm theo ngôn ngữ

- [ ] **TODO-4.7.5**: Update `QuickNoteCard.tsx` — thêm `phoneticRomaji` vào nested type + dùng `PhoneticDisplay`
  - **File**: `apps/frontend/src/components/quick-note/QuickNoteCard.tsx`
  - **Context**: Đọc `QuickNote.vocabularyBase` interface (dòng 14-19) và render phonetic (87-88)
  - **Thay đổi**:
    - `vocabularyBase` nested interface: thêm `phoneticRomaji?: string | null`
    - Import `PhoneticDisplay`
    - Thay `{vb?.phonetic && <p ...>{vb.phonetic}</p>}` bằng `{(vb?.phonetic || vb?.phoneticRomaji) && <PhoneticDisplay phonetic={vb.phonetic} phoneticRomaji={vb.phoneticRomaji} size="xs" />}`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: QuickNoteCard hiển thị đúng ký âm

- [ ] **TODO-4.7.6**: Update `StageRow.tsx` — thêm `phoneticRomaji` vào `PathStageVocabDto` + dùng `PhoneticDisplay`
  - **File**: `apps/frontend/src/components/roadmap/StageRow.tsx`
  - **Context**: Đọc `PathStageVocabDto` interface (dòng 4-12) và cách vocab được render
  - **Thay đổi**:
    - `PathStageVocabDto`: thêm `phoneticRomaji?: string | null`
    - Import `PhoneticDisplay`
    - Tìm nơi render `phonetic` trong stage vocab list và thay bằng `<PhoneticDisplay phonetic={v.phonetic} phoneticRomaji={v.phoneticRomaji} size="xs" />`
  - **Verify**: `npx tsc --noEmit` — compile sạch
  - **Kết quả**: Stage vocab list trong Roadmap hiển thị đúng ký âm

---

### Phase 5: Integration & Verification

- [ ] **TODO-5.1**: TypeScript compile check backend
  - **File**: N/A (terminal command từ `apps/backend/`)
  - **Thay đổi**: Chạy `npx tsc --noEmit`
  - **Verify**: Exit code 0, không có error
  - **Kết quả**: Toàn bộ backend type-safe

- [ ] **TODO-5.2**: TypeScript compile check frontend
  - **File**: N/A (terminal command từ `apps/frontend/`)
  - **Thay đổi**: Chạy `npx tsc --noEmit`
  - **Verify**: Exit code 0, không có error
  - **Kết quả**: Toàn bộ frontend type-safe

- [ ] **TODO-5.3**: Smoke test TTS fix (Nhóm A)
  - **File**: N/A (manual test với server đang chạy)
  - **Thay đổi**: Test với server local:
    - `GET /vocabulary/<id_từ_tiếng_bồ>/audio` → nghe giọng Portuguese không phải giọng Mỹ
    - `GET /vocabulary/<id_từ_tiếng_trung_phồn>/audio` → test `zh-TW` → giọng Mandarin Traditional
    - `GET /vocabulary/<id_từ_tiếng_việt>/audio` với từ "hai" → phát âm tiếng Việt đúng (SSML fix)
  - **Verify**: Audio phát đúng giọng ngôn ngữ tương ứng
  - **Kết quả**: Nhóm A hoạt động end-to-end

- [ ] **TODO-5.4**: Smoke test phonetics (Nhóm B)
  - **File**: N/A (manual test)
  - **Thay đổi**: Tạo từ mới tiếng Trung qua AI enrich → kiểm tra `phoneticRomaji` trong DB; mở VocabularyPage → xem Pinyin hiển thị
  - **Verify**: `phoneticRomaji` có giá trị trong DB; UI hiển thị Pinyin + IPA
  - **Kết quả**: Nhóm B hoạt động end-to-end

---

## Ghi chú triển khai
- **Nhóm A có thể deploy độc lập**: Chỉ cần 3 TODOs (0.1.1, 0.2.1, 0.3.1) — không migration, không frontend change. Merge và deploy ngay để fix phát âm sai.
- **Tên voice phải verify trước khi commit**: Google TTS voice names thay đổi theo tier và region. Ví dụ `cmn-TW-Wavenet-B` — nếu không tồn tại thì TTS sẽ throw 400 error runtime (không lúc compile). Kiểm tra tại https://cloud.google.com/text-to-speech/docs/voices.
- **`pt` là European Portuguese** (`pt-PT`): Nếu user base học Brazilian Portuguese nhiều hơn, có thể đổi sang `pt-BR-Neural2-A/B` (Neural2 available cho BR). Hiện giữ `pt-PT-Wavenet` vì seed flag là `🇵🇹`.
- **SSML `<lang>` tag**: `voice.languageCode` là BCP-47 (`vi-VN`, `cmn-CN`, `pt-PT`) — dùng làm `xml:lang` attribute là đúng chuẩn.
- **`phoneticRomaji` là nullable**: Không ép API client (frontend) phải có field này — tất cả interface dùng `phoneticRomaji?: string | null`.

## Rủi ro cần theo dõi
- [ ] Risk-1: Voice name không tồn tại trên free tier → TTS throw runtime error cho ngôn ngữ đó — Biện pháp: verify trước khi deploy; lazily wrap synthesize call trong try/catch đã có
- [ ] Risk-2: `pt-PT` Wavenet nghe kém hơn `pt-BR` Neural2 — Biện pháp: check analytics xem user học PT hay BR; đổi sang Neural2 BR nếu cần
- [ ] Risk-3: AI sinh `phoneticRomaji` sai cho tiếng Trung (dấu thanh Pinyin) — Biện pháp: log + user có thể báo lỗi (scope khác); không block MVP

---

## TÓM TẮT TRIỂN KHAI

**Ngày**: 2026-03-05  
**Trạng thái**: ✅ Hoàn thành tất cả TODOs  
**TypeScript**: Backend `tsc --noEmit` ✅ | Frontend `tsc --noEmit` ✅  
**Migration**: `20260305124547_add_phonetic_romaji` — applied thành công

### Các file đã thay đổi

| File | Thay đổi |
|------|----------|
| `apps/backend/src/modules/vocabulary/voice-map.constants.ts` | Mở rộng VOICE_MAP 7→29 ngôn ngữ; thêm key `zh-tw`; fix `getVoiceConfig()` với normalize + warning log |
| `apps/backend/src/modules/vocabulary/tts.service.ts` | Thêm `xmlEscape()` helper; dùng SSML `<speak><lang xml:lang="...">` thay `input: { text }` |
| `apps/backend/prisma/schema.prisma` | Thêm `phoneticRomaji String? @map("phonetic_romaji")` vào `VocabularyBase` |
| `apps/backend/prisma/migrations/20260305124547_add_phonetic_romaji/` | Migration tự động tạo |
| `apps/backend/src/modules/ai/ai.service.ts` | Thêm `getPhoneticRomajiGuide()` helper; thêm `phoneticRomaji` vào `EnrichedWordResult` + `GeneratedPathVocab` + Zod schema; cập nhật cả 2 AI prompt với language-aware phonetics (Japanese: kanji+furigana+romaji format) |
| `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts` | Thêm `phoneticRomaji?` vào `CreateVocabularyDto` |
| `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | Thêm `phoneticRomaji?` vào `BulkVocabItem`; persist trong `create()` và `upsertBulk()` |
| `apps/backend/src/modules/quick-note/quick-note.processor.ts` | Pass `phoneticRomaji` khi gọi `vocabularyService.create()` |
| `apps/backend/src/modules/paths/dto/paths.dto.ts` | Thêm `phoneticRomaji?` vào `PathStageVocabDto` |
| `apps/backend/src/modules/paths/paths.service.ts` | Pass `phoneticRomaji` trong `upsertBulk` mapping; expose trong `mapToPathDto()` |
| `apps/frontend/src/components/ui/PhoneticDisplay.tsx` | **Tạo mới** — component hiển thị phonetic CJK-aware: Romaji làm chính, IPA phụ |
| `apps/frontend/src/components/vocab/WordRow.tsx` | Thêm `phoneticRomaji?` vào `VocabItem`; dùng `PhoneticDisplay` |
| `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Import và dùng `PhoneticDisplay` thay render inline |
| `apps/frontend/src/components/review/FlashCard.tsx` | Thêm `phoneticRomaji?` vào `QueueItem.vocabularyBase`; dùng `PhoneticDisplay` |
| `apps/frontend/src/components/quick-note/QuickNoteCard.tsx` | Thêm `phoneticRomaji?` vào `QuickNote.vocabularyBase`; dùng `PhoneticDisplay` |
| `apps/frontend/src/components/roadmap/StageRow.tsx` | Thêm `phoneticRomaji?` vào `PathStageVocabDto` |

### Điểm quan trọng về Japanese phonetics

Theo yêu cầu của user, `phoneticRomaji` cho tiếng Nhật sử dụng format **Kanji + Furigana + Romaji**:
- `"食べる (たべる, taberu)"` — có kanji → `kanji (hiragana, romaji)`
- `"ありがとう (arigatou)"` — không có kanji → `hiragana (romaji)`

AI prompt được hướng dẫn cụ thể trong `getPhoneticRomajiGuide('ja')`.

