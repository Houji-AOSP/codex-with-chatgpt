# Codex with ChatGPT

> ChatGPT suy nghĩ. Codex / Antigravity thực thi.

> [!IMPORTANT]
> **Gặp lỗi?** Hãy bảo Agent của bạn (Codex hoặc Antigravity) **"Cập nhật Codex with ChatGPT"** rồi thử lại. Nâng lên phiên bản mới nhất sẽ khắc phục hầu hết các lỗi đã biết.

## Giải quyết vấn đề gì

Bạn đang trả tiền cho ChatGPT Plus/Pro nhưng quota web hầu như không dùng hết,
trong khi đó coding agent (Codex, Antigravity CLI…) lại đốt token API đắt đỏ
chỉ để lập kế hoạch và review code. Dự án này chuyển phần **"suy nghĩ"** sang
ChatGPT web — thứ bạn đã trả tiền — còn agent local chỉ việc **thực thi**.
Không cần API Key, không reverse proxy — chỉ dùng giao diện web chính thức
kết hợp cầu nối MCP **chỉ đọc**.

## Dự án này là gì

Biến ChatGPT web thành **"bộ não quy hoạch và review"** cho phiên code của bạn,
trong khi agent local (Codex hoặc Antigravity CLI) nắm toàn quyền thực thi.
Mã nguồn của bạn **không bao giờ bị upload** — ChatGPT đọc đúng những dòng code
cần thiết qua kết nối MCP **chỉ đọc**, được bảo vệ bằng OAuth.

Hỗ trợ cả **Codex (OpenAI)** và **Antigravity CLI (`agy` — Google)**.

---

## Cài đặt một phát (dành cho người không rành kỹ thuật)

Không biết git, Node, hay terminal? Không sao. Copy đoạn dưới đây, dán cho
Agent của bạn (Codex hoặc Antigravity), rồi đi pha cà phê:

### Cho Codex:

```text
Hãy cài đặt và cấu hình "Codex with ChatGPT" cho tôi, tự động hoàn toàn.
Tôi không biết kỹ thuật — bạn tự làm hết:

1. Kiểm tra môi trường: cần git và Node.js >= 20. Thiếu gì thì tự cài
   (macOS: Homebrew, Windows: winget). Cài thêm cloudflared.
2. Clone https://github.com/Houji-AOSP/codex-with-chatgpt vào
   ~/codex-with-chatgpt (đã có thì git pull).
3. Build: chạy `corepack pnpm install` rồi `corepack pnpm build`.
4. Cài Skill: chạy `node bin/c2c.js install-skill --target codex`.
5. Cấu hình lần đầu: chạy `c2c setup`, kết nối connector ChatGPT, nhập mã ghép nối.
6. Chỉ gọi tôi khi cần đăng nhập (ChatGPT / Cloudflare), CAPTCHA hoặc 2FA —
   mỗi lần chỉ bảo tôi MỘT thao tác.
7. Xong thì cho tôi xem danh sách ✓ và xác nhận test đọc file đã pass.
```

### Cho Antigravity CLI (`agy`):

```text
Hãy cài đặt và cấu hình "Antigravity with ChatGPT" cho tôi, tự động hoàn toàn.
Tôi không biết kỹ thuật — bạn tự làm hết:

1. Kiểm tra môi trường: cần git và Node.js >= 20. Thiếu gì thì tự cài.
   Cài thêm cloudflared.
2. Clone https://github.com/Houji-AOSP/codex-with-chatgpt vào
   ~/codex-with-chatgpt (đã có thì git pull).
3. Build: chạy `corepack pnpm install` rồi `corepack pnpm build`.
4. Cài Skill cho Antigravity: chạy `node bin/c2c.js install-skill --target antigravity`.
5. Thêm workspace vào whitelist: chạy `node bin/c2c.js sandbox-allow`.
6. Cấu hình lần đầu: chạy `node bin/c2c.js setup`, kết nối connector trong
   ChatGPT web, nhập mã ghép nối.
7. Xong thì cho tôi xem danh sách ✓ và xác nhận test đọc file đã pass.
```

**Cập nhật tự động**: Skill tự kiểm tra GitHub mỗi ngày. Bạn cũng có thể nói
"Cập nhật Codex with ChatGPT" bất cứ lúc nào.

---

## Cài đặt → Cấu hình → Sử dụng (thủ công)

### Cho Codex:
1. Cài Skill: `node bin/c2c.js install-skill --target codex`
   (hoặc copy `skill/` vào `~/.codex/skills/codex-with-chatgpt/`).
2. Bảo Codex: **"Set up Codex with ChatGPT."**
3. Sử dụng: **"Use Codex with ChatGPT to implement XXX."**

### Cho Antigravity CLI (`agy`):
1. Cài Skill: `node bin/c2c.js install-skill --target antigravity`
   (tự động cài vào `~/.gemini/config/skills/antigravity-with-chatgpt/SKILL.md`).
2. Chạy setup: `node bin/c2c.js setup` rồi kết nối MCP connector trong ChatGPT web.
3. Sử dụng: **"Dùng Antigravity with ChatGPT để lên kế hoạch và thực hiện XXX."**
   Antigravity CLI phối hợp qua `c2c prompt` và `c2c open`.

Hết. Bạn không cần biết MCP, OAuth, tunnel, port, localhost là gì — Agent tự
cấu hình mọi thứ và bạn chỉ thấy:

```
Antigravity with ChatGPT       (hoặc "Codex with ChatGPT")

✓ Đã nhận diện dự án
✓ Workspace Bridge đã khởi động
✓ Kết nối bảo mật đã thiết lập
✓ ChatGPT đã kết nối
✓ Test đọc file đã pass

Ready.
```

Bước duy nhất có thể cần bạn: đăng nhập ChatGPT (và nếu muốn domain cố định,
đăng nhập Cloudflare một lần). **Workspace mới** sẽ hỏi bạn tạo một ChatGPT
Project (bộ sưu tập) — đặt tên theo workspace, chọn **chỉ nhớ trong project**.

### Domain cố định (tùy chọn)

Địa chỉ công khai mặc định là URL tạm của Cloudflare — thay đổi khi bridge
khởi động lại. Agent sẽ tự xóa connector cũ và tạo lại.

Nếu bạn có tài khoản Cloudflare và domain đã thêm trên Cloudflare, lần cấu
hình đầu sẽ hỏi bạn có muốn domain cố định (VD: `c2c-<project>.domain.com`)
không. Chọn có → đăng nhập Cloudflare một lần. Sau đó connector giữ nguyên
qua các lần khởi động lại. Không có/không muốn? Vẫn dùng được, chỉ sửa chậm hơn.

---

## Cách hoạt động

```
             ┌───────────────────────────┐
             │       ChatGPT Web         │
             │  Suy nghĩ / Lập kế hoạch │
             │       / Review           │
             └──────────┬──────────▲─────┘
                        │          │
               MCP      │          │ Tin nhắn điều khiển
           (Dữ liệu)   │          │ (< 1 KB)
                        ▼          │
             ┌─────────────────────┐
             │      C2C Bridge     │   HTTP chỉ localhost
             │  MCP chỉ đọc       │   OAuth 2.1 + mã ghép nối
             │  OAuth + Pairing    │   Cloudflare Tunnel
             └──────────┬──────────┘
                        │  chỉ đọc
                        ▼
             ┌─────────────────────┐          ┌──────────────────────────┐
             │   Workspace local   │◀─────────│  Codex / Antigravity CLI │
             └─────────────────────┘ sửa/git  │  shell / test / sửa lỗi  │
                                              └──────────────────────────┘
```

- **Mặt phẳng điều khiển**: Agent local và ChatGPT trao đổi tin nhắn cấu trúc
  `[C2C]` cực nhỏ — `INIT → PLAN → EXECUTED → REVIEW → DONE`. Không bao giờ
  dán diff, log, hay nội dung file.
- **Mặt phẳng dữ liệu (MCP)**: ChatGPT tự kéo những gì cần qua 9 công cụ
  chỉ đọc: `workspace_info`, `list_directory`, `read_file`, `search_workspace`,
  `git_status`, `git_diff`, `test_status`, `execution_summary`,
  `execution_output`.
- **Review độc lập**: sau khi agent thực thi, ChatGPT tự kiểm tra git diff
  và kết quả test qua MCP — không tin mù rằng "test đã pass".

## Mô hình bảo mật (tóm tắt)

- **Chỉ đọc từ cấu trúc**: server không có tool ghi/xóa/shell/commit.
  Không prompt injection nào có thể kích hoạt chúng.
- **Một workspace = một ranh giới**: mỗi token gắn với một workspace duy nhất;
  kiểm tra đường dẫn dùng realpath chuẩn (chặn symlink/`../`/đường dẫn tuyệt đối).
- **File nhạy cảm không bao giờ lộ**: `.env*`, key, SSH, credentials bị chặn
  mặc định (`.env.example` được phép); `.c2cignore` thêm quy tắc tùy chỉnh.
- **Biết URL không có nghĩa có quyền**: endpoint MCP yêu cầu OAuth 2.1
  (PKCE S256, đăng ký client động, xoay refresh token). Không có token: 401.
  Token sai workspace: 403.
- **Model không bao giờ thấy credential dài hạn**: bí mật duy nhất xuất hiện
  trên trình duyệt là mã ghép nối một lần (hết hạn 5 phút, tối đa 5 lần thử,
  giới hạn tốc độ, hủy sau khi dùng).

Chi tiết: [docs/security.md](docs/security.md)

## Dành cho lập trình viên

```bash
pnpm install
pnpm build          # → dist/, lộ lệnh `c2c`
pnpm test           # vitest: 181+ test (bảo mật đường dẫn, OAuth, MCP e2e)

c2c setup           # bridge + tunnel + mã ghép nối, tất cả trong một
c2c install-skill   # cài Skill cho Codex & Antigravity
c2c sandbox-allow   # thêm thư mục cài đặt vào whitelist Codex & Antigravity
c2c prompt boot     # sinh prompt khởi động C2C cho ChatGPT
c2c prompt init     # sinh prompt [C2C] STATE: INIT
c2c prompt executed # sinh prompt [C2C] STATE: EXECUTED
c2c open            # mở cuộc trò chuyện ChatGPT hiện tại
c2c status / doctor / pair / unpair / logs / stop
```

Yêu cầu: Node.js >= 20, git. `cloudflared` cho kết nối công khai
(tự phát hiện; Skill sẽ cài cho bạn). Nếu QUIC bị chặn, đặt
`C2C_TUNNEL_PROTOCOL=http2` rồi khởi động lại bridge.

Tài liệu: [kiến trúc](docs/architecture.md) · [giao thức](docs/protocol.md) ·
[bảo mật](docs/security.md) · [xử lý sự cố](docs/troubleshooting.md)

## Cấu trúc dự án

```
src/
  bridge/     HTTP server localhost, khôi phục port, admin API
  mcp/        9 công cụ chỉ đọc, Streamable HTTP stateless
  auth/       OAuth 2.1 (PKCE, đăng ký động, xoay refresh, thu hồi)
  pairing/    mã ghép nối một lần (CSPRNG, TTL, giới hạn tốc độ)
  workspace/  kiểm tra đường dẫn, chính sách file nhạy cảm, tìm kiếm, git
  tunnel/     TunnelProvider + Cloudflare Quick/Named Tunnel
  execution/  bản ghi thực thi cho vòng lặp review
  process/    quản lý vòng đời daemon
  cli/        CLI c2c
  prompt/     template prompt C2C cho ChatGPT
  config/     cấu hình sandbox, skill-install, endpoint, session
  util/       tiện ích (mở trình duyệt, v.v.)
skill/          Codex Skill (lớp UX)
skill/antigravity/  Antigravity Skill
tests/          unit + integration test
docs/           kiến trúc / giao thức / bảo mật / xử lý sự cố
```

## Trạng thái & Tuyên bố

V1. Đã xác minh end-to-end: Bridge, OAuth + ghép nối, tunnel công khai,
cấu hình ChatGPT connector, trải nghiệm cấu hình lần đầu tự động.
Hỗ trợ cả Codex (OpenAI) và Antigravity CLI (Google).

**Dự án cộng đồng không chính thức. Không liên kết hay được OpenAI/Google chứng nhận.**

## Giấy phép

[MIT](LICENSE)
