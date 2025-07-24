// src/components/IntroScreen.tsx
type IntroScreenProps = {
  onNext: () => void;
};

export default function IntroScreen({ onNext }: IntroScreenProps) {
  return (
    <main className="relative min-h-screen overflow-y-auto">
      {/* 배경 그라데이션 */}
      <div 
        className="fixed inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            #479aff 0px,
            #479aff 296px,
            #b8d8ff 760px,
            #b8d8ff 100%
          )`
        }}
      />

      {/* 배경 그리드 */}
      <div 
        className="fixed inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 메인 컨텐츠 */}
      <div className="relative w-full max-w-[393px] min-h-screen mx-auto flex flex-col items-center">
        {/* 텍스트 영역 - mt 값을 더 크게 */}
        <h1 className="text-[28px] font-bold text-center text-black mt-[40px]">해치와 찰칵찰칵!</h1>
        <p className="mt-3 text-center text-black/80 text-[15px] leading-[1.5]">
          해치와 해치의 단짝, 아스트로이더와 함께<br />
          사진 찍고 무한 혜택을 받아볼까요?
        </p>

        {/* 카드 컨테이너 - mt 값을 더 크게 */}
        <div className="relative mt-[60px] w-[255px] mx-auto isolate">
          {/* 뒷면 카드 */}
          <div className="absolute -left-[28px] top-[36px] w-[255px] h-[344px] bg-white/80 rounded-[12px] p-3 transform -rotate-[5deg] z-[1]">
            {/* 뒷면 카드 내부 영역 */}
            <div className="w-[235px] h-[280px] bg-[#479BFF] rounded-[10px] flex items-center justify-center">
            </div>
          </div>

          {/* 메인 카드 */}
          <div className="relative w-[255px] h-[355px] bg-white rounded-[12px] p-3 flex flex-col z-[2]">
            {/* 사진 영역 */}
            <div className="w-[235px] h-[280px] bg-black rounded-[10px] flex items-center justify-center">
              <span className="text-white text-[15px]">해치 사진</span>
            </div>

            {/* Hechi 뱃지 */}
            <div className="absolute top-4 right-4 bg-white rounded-full py-1.5 px-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center gap-1.5">
              <img 
                src="/hechi-icon.svg" 
                className="w-5 h-5" 
                alt="Hechi"
              />
              <span className="text-[#479BFF] text-[13px] font-bold">Hechi</span>
            </div>

            {/* 하단 텍스트 */}
            <div className="mt-3 flex justify-center">
              <div className="text-[#479BFF] text-[13px] font-bold border border-[#479BFF] rounded-[6px] px-3 py-1">
                HECHI X ASTEROIDER
              </div>
            </div>
          </div>
        </div>

        {/* 이벤트 참여하기 버튼 - mt-[80px] 추가 */}
        <div className="w-full mt-[90px] mb-[40px]">
          <button
            onClick={onNext}
            className="w-[344px] h-[52px] bg-black text-white text-[16px] font-medium rounded-[12px] mx-auto block"
          >
            이벤트 참여하기
          </button>
        </div>
      </div>
    </main>
  );
}
  