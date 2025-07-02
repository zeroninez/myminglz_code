# @repo/api

쿠폰 서비스를 위한 API 패키지

## 설치

```bash
npm install @repo/api
```

## 사용법

```typescript
import { CouponService } from "@repo/api";

const couponService = new CouponService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

// 코드 생성
const generateResult = await couponService.generateCode();
if (generateResult.success) {
  console.log("생성된 코드:", generateResult.code);
}

// 코드 저장
const saveResult = await couponService.saveCode(generateResult.code!);
if (saveResult.success) {
  console.log(saveResult.message);
}

// 코드 검증
const validateResult = await couponService.validateCode("ABC12345");
if (validateResult.success && validateResult.isValid) {
  console.log(validateResult.message);
}

// 클립보드 복사
const copied = await couponService.copyToClipboard("ABC12345");

// 통계 조회
const stats = await couponService.getStats();
```

## 데이터베이스 설정

Supabase에서 다음 테이블을 생성하세요:

```sql
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_used ON coupons(is_used);
```

## API 메서드

- `generateCode()`: 유니크한 쿠폰 코드 생성
- `saveCode(code)`: 코드를 데이터베이스에 저장
- `validateCode(code)`: 코드 검증 및 사용 처리
- `copyToClipboard(text)`: 클립보드에 텍스트 복사
- `getStats()`: 쿠폰 사용 통계 조회
