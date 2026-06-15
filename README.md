# 🍎 Blox Fruit Discord Bot

บอทตอบอัตโนมัติเมื่อผู้เล่นพิมพ์คำว่า `blox`, `bloxfruit`, หรือ `bf`

---

## ⚙️ วิธีติดตั้ง

### 1. ติดตั้ง Node.js
ดาวน์โหลดได้ที่ https://nodejs.org (แนะนำ v18+)

### 2. ติดตั้ง dependencies
```bash
npm install
```

### 3. สร้างบอทใน Discord Developer Portal
1. ไปที่ https://discord.com/developers/applications
2. กด **New Application** → ตั้งชื่อ
3. ไปที่แท็บ **Bot** → กด **Add Bot**
4. คัดลอก **Token** ของบอท
5. เปิด **Message Content Intent** ✅ (สำคัญมาก!)

### 4. ใส่ Token ลงในโค้ด
เปิดไฟล์ `index.js` แล้วแก้บรรทัดสุดท้าย:
```js
client.login('วาง_TOKEN_ของคุณตรงนี้');
```

หรือใช้ Environment Variable (ปลอดภัยกว่า):
```bash
DISCORD_TOKEN=your_token_here node index.js
```

### 5. เชิญบอทเข้าเซิร์ฟเวอร์
ในหน้า Developer Portal → **OAuth2 → URL Generator**
- เลือก `bot`
- เลือก permission: `Send Messages`, `Read Messages`
- คัดลอก URL แล้วเปิดในเบราว์เซอร์

### 6. รันบอท
```bash
npm start
```

---

## 🔧 การปรับแต่ง

### เพิ่ม/ลด keyword
แก้ในไฟล์ `index.js`:
```js
const KEYWORDS = ['blox', 'bloxfruit', 'bf', 'คำใหม่'];
```

### จำกัดให้บอทตอบแค่บางช่อง
```js
const ALLOWED_CHANNEL_IDS = ['ID_ช่อง_1', 'ID_ช่อง_2'];
```
> คลิกขวาที่ช่องใน Discord → **Copy Channel ID** (ต้องเปิด Developer Mode ก่อน)

### แก้ข้อความที่บอทส่ง
แก้ตัวแปร `REPLY_MESSAGE` ได้เลย

---

## ✅ ทดสอบ
พิมพ์ในช่อง Discord ว่า `blox` หรือ `BF` — บอทจะตอบทันที!
