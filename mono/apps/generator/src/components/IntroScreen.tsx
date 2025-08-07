// src/components/IntroScreen.tsx
import React, { useState, useRef, useEffect } from 'react';

type IntroScreenProps = {
  onNext: () => void;
};

interface StoreBenefit {
  id: string;
  name: string;
  description: string;
  condition: string;
  imageUrl: string;
  expireDate?: string;
}

export default function IntroScreen({ onNext }: IntroScreenProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0은 도입부
  const [benefits, setBenefits] = useState<StoreBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [actualStepPositions, setActualStepPositions] = useState<number[]>([]);
  const [showStepPages, setShowStepPages] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      id: 1,
      title: "STEP 1",
      description: "샤로수길에 설치된\n조형물과 함께 찰칵!",
      image: "/onbording/step1 (2배수).png"
    },
    {
      id: 2,
      title: "STEP 2", 
      description: "카카오톡, 인스타, 페이스북에\n조형물과 찍은 사진 공유!",
      image: "/onbording/step2 (2배수).png"
    },
    {
      id: 3,
      title: "STEP 3",
      description: "sns 공유 인증한 후\n이벤트 쿠폰 발급!",
      image: "/onbording/step3 (2배수).png"
    },
    {
      id: 4,
      title: "STEP 4",
      description: "발급 받은 이벤트 쿠폰을 통해\n혜택이 적용된 가게 확인",
      image: "/onbording/step_4 (2배수).png"
    }
  ];

  // 혜택 상점 데이터 불러오기
  const loadBenefits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to fetch data');
      }
      
      if (Array.isArray(data)) {
        setBenefits(data);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        console.error('Received data is not an array:', data);
        setBenefits([]);
      }
    } catch (error) {
      console.error("Error fetching benefits:", error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setBenefits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    // 스크롤 애니메이션 중에는 handleScroll 비활성화
    if (isScrolling) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // 해치와 찰칵찰칵 섹션
    if (scrollTop < windowHeight) {
      setCurrentStep(0);
      return;
    }
    
    // 각 STEP의 목표 위치를 공통 함수로 계산
    let currentStepIndex = 1;
    
    // 실제 스크롤 위치가 있으면 우선 사용, 없으면 계산된 위치 사용
    for (let i = 0; i < 4; i++) {
      const actualPosition = actualStepPositions[i];
      const calculatedPosition = calculateStepTargetPosition(i + 1);
      
      // 실제 위치가 있으면 사용, 없으면 계산된 위치 사용
      const referencePosition = actualPosition !== undefined ? actualPosition : calculatedPosition;
      
      let earlyActivation;
      if (i === 0) {
        // STEP 1은 50px 여유값
        earlyActivation = 50;
      } else {
        // STEP 2, 3, 4는 100px 여유값 (실제 위치 기준이므로 적게)
        earlyActivation = 0;
      }
      
      if (scrollTop >= referencePosition - earlyActivation) {
        currentStepIndex = i + 1;
      }
    }
    
    setCurrentStep(Math.min(currentStepIndex, 4));
  };

  const handleShowAllBenefits = () => {
    setShowAllBenefits(true);
  };

  // 공통 함수: STEP의 목표 스크롤 위치 계산
  const calculateStepTargetPosition = (stepIndex: number) => {
    const windowHeight = window.innerHeight;
    const progressIndicatorHeight = 122;
    const stepPadding = 122;
    const stepContentHeight = 534;
    const stepGap = 122;
    const topIndicatorHeight = 108;
    const targetOffset = 80;
    
    const stepAreaStart = windowHeight + progressIndicatorHeight;
    let stepAbsolutePosition = stepAreaStart;
    
    // 이전 STEP들의 누적 높이
    for (let i = 1; i < stepIndex; i++) {
      stepAbsolutePosition += stepPadding + stepContentHeight;
      if (i < 4) {
        stepAbsolutePosition += stepGap;
      }
    }
    
    // STEP별 오프셋 적용
    if (stepIndex === 1) {
      return stepAbsolutePosition - targetOffset;
    } else if (stepIndex === 2) {
      return stepAbsolutePosition - (topIndicatorHeight + targetOffset);
    } else if (stepIndex === 3) {
      const gapOffset = -70;
      return stepAbsolutePosition - stepPadding - stepGap + gapOffset;
    } else {
      const gapOffset = -190;
      return stepAbsolutePosition - stepPadding - stepGap + gapOffset;
    }
  };

  // 특정 스텝으로 스크롤하는 함수
  const scrollToStep = (stepIndex: number) => {
    const targetScrollTop = calculateStepTargetPosition(stepIndex);
    
    // 스크롤 애니메이션 시작
    setIsScrolling(true);
    
    window.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
    
    // 스크롤 애니메이션 완료 후 currentStep 설정 및 실제 위치 저장
    setTimeout(() => {
      const actualScrollPosition = window.scrollY;
      
      // 실제 스크롤 위치를 배열에 저장 (인덱스 = stepIndex - 1)
      setActualStepPositions(prev => {
        const newPositions = [...prev];
        newPositions[stepIndex - 1] = actualScrollPosition;
        return newPositions;
      });
      
      setCurrentStep(stepIndex); // 애니메이션 완료 후 불 켜짐
      setIsScrolling(false);
    }, 1000);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadBenefits();
  }, []);

  return (
    <main ref={containerRef} className="relative min-h-screen overflow-y-auto">
      {/* 고정된 Progress Indicator (상단) - STEP 1-4에서만 표시 */}
      {currentStep > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'transparent' }}>
          {/* 검은줄 */}
          <div className="w-full h-1"></div>
          
          {/* 중앙 검은색 선 */}
          <div className="w-[133px] h-[5px] bg-black mx-auto mt-8 rounded-full"></div>
          
          {/* 하단 스텝 표시기 */}
          <div className="flex justify-center items-center mt-8 space-x-2">
            {/* STEP 1 */}
            <button 
              onClick={() => scrollToStep(1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= 1 ? 'bg-white text-[#AAD1FF]' : 'bg-[#AAD1FF]/60 text-white'
              }`}
            >
              1
            </button>
            
            {/* 연결선 */}
            <div className={`w-4 h-0.5 ${currentStep >= 2 ? 'bg-white' : 'bg-[#ffffff]/60'}`}></div>
            
            {/* STEP 2 */}
            <button 
              onClick={() => scrollToStep(2)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= 2 ? 'bg-white text-[#AAD1FF]' : 'bg-[#AAD1FF]/60 text-white'
              }`}
            >
              2
            </button>
            
            {/* 연결선 */}
            <div className={`w-4 h-0.5 ${currentStep >= 3 ? 'bg-white' : 'bg-[#ffffff]/60'}`}></div>
            
            {/* STEP 3 */}
            <button 
              onClick={() => scrollToStep(3)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= 3 ? 'bg-white text-[#AAD1FF]' : 'bg-[#AAD1FF]/60 text-white'
              }`}
            >
              3
            </button>
            
            {/* 연결선 */}
            <div className={`w-4 h-0.5 ${currentStep >= 4 ? 'bg-white' : 'bg-[#ffffff]/60'}`}></div>
            
            {/* STEP 4 */}
            <button 
              onClick={() => scrollToStep(4)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= 4 ? 'bg-white text-[#AAD1FF]' : 'bg-[#AAD1FF]/60 text-white'
              }`}
            >
              4
            </button>
          </div>
        </div>
      )}

      {/* 배경 그라데이션 */}
      <div 
        className="fixed inset-0"
        style={{
          background: `linear-gradient(
            to top,
            #479aff 0px,
            #479aff 250px,
            #b8d8ff 600px,
            #FFFFFF 852px,
            #FFFFFF 100%
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

      {/* 도입부 섹션 */}
      <div className="relative z-10 max-w-[393px] h-auto mx-auto flex flex-col items-center">
        {/* 텍스트 영역 */}
        <h1 className="text-[28px] font-bold text-center text-black mt-[75px]">해치와 찰칵찰칵!</h1>
        <p className="mt-3 text-center text-black/80 text-[15px] leading-[1.5]">
          해치와 해치의 단짝, 아스트로이더와 함께<br />
          사진 찍고 무한 혜택을 받아볼까요?
        </p>

        {/* 카드 컨테이너 */}
        <div className="relative mt-[50px] w-[255px] mx-auto isolate">
          {/* 뒷면 카드 */}
          <div className="absolute -left-[28px] top-[36px] w-[255px] h-[344px] bg-white/80 rounded-[12px] p-3 transform -rotate-[5deg] z-[1]">
            {/* 뒷면 카드 내부 영역 */}
            <div className="w-[235px] h-[280px] bg-[#479BFF] rounded-[10px] flex items-center justify-center">
            </div>
          </div>

          {/* 메인 카드 */}
          <div className="relative w-[255px] h-[355px] bg-white rounded-[12px] p-3 flex flex-col z-[2]">
            {/* 사진 영역 */}
            <div className="w-[235px] h-[280px] bg-black rounded-[10px] flex items-center justify-center overflow-hidden">
              <img 
                src="/onbording/withHechi.png"
                alt="해치와 함께"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Hechi 뱃지 */}
            <div className="absolute top-[31px] right-[-27px] bg-white rounded-[100px] w-[87px] h-[31px] pl-1 pr-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex items-center">
              <div className="w-[27px] h-[27px] rounded-full overflow-hidden">
                <img 
                  src="/onbording/HechiLogo.png" 
                  className="w-full h-full object-cover" 
                  alt="Hechi"
                />
              </div>
              <span className="text-[#479BFF] text-[15px] font-bold ml-1">Hechi</span>
            </div>

            {/* 하단 텍스트 */}
            <div className="mt-3 flex justify-center">
              <div className="text-[#479BFF] text-[13px] font-bold border border-[#479BFF] rounded-[6px] px-3 py-1">
                HECHI X ASTEROIDER
              </div>
            </div>
          </div>
        </div>

        {/* 더 알아보기 버튼 */}
<div className="w-full mt-[-10px] mb-[0px] flex justify-center">
          <button
            onClick={() => scrollToStep(1)}
            className="transition-transform hover:scale-105 active:scale-95"
          >
            <img
              src="/button(x2).png"
              alt="더 알아보기"
              className="w-[150px] h-[150px]"
            />
          </button>
        </div>

        {/* 이벤트 참여하기 버튼 */}
        <div className="w-full mt-[-40px] mb-[40px]">
          <button
            onClick={onNext}
            className="w-[344px] h-[52px] bg-black text-white text-[16px] font-medium rounded-[12px] mx-auto block"
          >
            이벤트 참여하기
          </button>
        </div>
      </div>

      {/* Progress Indicator 컨테이너 (하단 122px) */}
      <div className="relative w-full h-[122px]" style={{ backgroundColor: '#75B4FF' }}>
        {currentStep === 0 && (
          <>
            {/* 검은줄 */}
            <div className="w-full h-1"></div>
            
            {/* 중앙 검은색 선 */}
            <div className="w-[133px] h-[5px] bg-black mx-auto mt-8 rounded-full"></div>
            
            {/* 하단 스텝 표시기 */}
            <div className="flex justify-center items-center mt-8 space-x-2">
              {/* STEP 1 */}
              <button 
                onClick={() => scrollToStep(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors bg-[#AAD1FF]/60 text-white hover:bg-white hover:text-[#AAD1FF]"
              >
                1
              </button>
              
              {/* 연결선 */}
              <div className="w-4 h-0.5 bg-[#ffffff]/60"></div>
              
              {/* STEP 2 */}
              <button 
                onClick={() => scrollToStep(2)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors bg-[#AAD1FF]/60 text-white hover:bg-white hover:text-[#AAD1FF]"
              >
                2
              </button>
              
              {/* 연결선 */}
              <div className="w-4 h-0.5 bg-[#ffffff]/60"></div>
              
              {/* STEP 3 */}
              <button 
                onClick={() => scrollToStep(3)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors bg-[#AAD1FF]/60 text-white hover:bg-white hover:text-[#AAD1FF]"
              >
                3
              </button>
              
              {/* 연결선 */}
              <div className="w-4 h-0.5 bg-[#ffffff]/60"></div>
              
              {/* STEP 4 */}
              <button 
                onClick={() => scrollToStep(4)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors bg-[#AAD1FF]/60 text-white hover:bg-white hover:text-[#AAD1FF]"
              >
                4
              </button>
            </div>
          </>
        )}
      </div>

      {/* Progress Indicator 아래 추가 스텝 1~4 */}
      {steps.map((step, index) => (
        <React.Fragment key={`additional-${step.id}`}>
          <div
            className={`relative w-full flex flex-col items-center justify-center px-6 ${
              step.id === 4 ? 'min-h-screen' : 'h-[534px]'
            } pt-[122px]`}
            style={{ backgroundColor: '#75B4FF' }}
          >
          {/* 스텝 라벨 */}
          <div className="rounded-full mb-6 flex items-center justify-center" style={{ backgroundColor: 'black', color: '#65a7f6', width: '61px', height: '22px' }}>
            <span className="text-[13px] font-bold">{step.title}</span>
          </div>

          {/* 설명 텍스트 */}
          <div className="text-center mb-8">
            <p className="text-white text-[18px] leading-[1.4] whitespace-pre-line">
              {step.description}
            </p>
          </div>

          {/* STEP 4 특별 처리 - 혜택 상점 목록 */}
          {step.id === 4 ? (
            <div className="w-full max-w-[370px]">
              {/* 혜택 알아보기 버튼 */}
              <div className="flex justify-center mb-6">
                <button 
                  onClick={handleShowAllBenefits}
                  className="w-[116px] h-[31px] bg-[#56A3FF] text-white px-[10px] rounded-[999px] font-medium hover:bg-blue-600 transition-colors flex justify-center items-center whitespace-nowrap"
                >
                  혜택 알아보기
                </button>
              </div>

              {/* STEP 4 이미지 */}
              <div className="flex justify-center mb-0 relative z-20 -mt-4">
                <img
                  src="/onbording/step_4 (2배수).png"
                  alt="STEP 4"
                  className="w-auto h-auto max-w-[200px]"
                />
              </div>

              {/* 혜택 목록 컨테이너 */}
              <div className="relative z-10 -mt-8">
                {/* 혜택 목록 */}
                <div className="relative z-10 p-4 space-y-3">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center text-white py-10">
                      <p className="text-sm">{error}</p>
                    </div>
                  ) : benefits.length === 0 ? (
                    <div className="text-center text-white py-10">
                      <p>등록된 혜택이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {/* 첫 번째 혜택 (항상 보임) */}
                      {benefits.slice(0, 1).map((store) => (
                        <div key={store.id} className="flex mb-3">
                          {/* 왼쪽 컨테이너 (썸네일) */}
                          <div className="w-[114px] h-[114px] bg-white rounded-[8px] p-[5.5px] flex items-center justify-center">
                            {store.imageUrl ? (
                              <img 
                                src={store.imageUrl}
                                alt={store.name}
                                className="w-[103px] h-[103px] rounded-[8px] object-cover"
                              />
                            ) : (
                              <div className="w-[103px] h-[103px] rounded-[8px] bg-[#479aff]" />
                            )}
                          </div>

                          {/* 점선 구분선 */}
                          <div 
                            className="h-[98px] bg-white my-[8px]"
                            style={{
                              width: '0.3px',
                              borderRight: '0.3px dashed #3B3B3B',
                              WebkitBorderImage: 'repeating-linear-gradient(to bottom, #3B3B3B, #3B3B3B 1px, transparent 3px, transparent 6px) 1'
                            }}
                          />

                          {/* 오른쪽 컨테이너 (내용) */}
                          <div className="w-[224px] h-[114px] bg-white rounded-[8px] pl-3 pr-3 pt-2 pb-3 flex flex-col items-start">
                            <div className="flex items-center justify-between w-full">
                              <h3 className="text-[22px] font-medium text-[#479aff]">{store.name}</h3>
                            </div>
                            <p className="text-[15px] text-[#333333] font-medium leading-tight mt-1">{store.description}</p>
                            {store.condition && (
                              <p className="text-[12px] text-[#999999] leading-tight">{store.condition}</p>
                            )}
                            <p className="text-[12px] text-[#999999] leading-tight">{store.expireDate || "2026/07/04까지 사용 가능"}</p>
                          </div>
                        </div>
                      ))}

                      {/* 나머지 혜택들 (버튼 클릭 후 보임) */}
                      {showAllBenefits && (
                        <div className="space-y-3 animate-fadeIn">
                          {benefits.slice(1).map((store) => (
                            <div key={store.id} className="flex mb-3 animate-slideUp">
                              {/* 왼쪽 컨테이너 (썸네일) */}
                              <div className="w-[114px] h-[114px] bg-white rounded-[8px] p-[5.5px] flex items-center justify-center">
                                {store.imageUrl ? (
                                  <img 
                                    src={store.imageUrl}
                                    alt={store.name}
                                    className="w-[103px] h-[103px] rounded-[8px] object-cover"
                                  />
                                ) : (
                                  <div className="w-[103px] h-[103px] rounded-[8px] bg-[#479aff]" />
                                )}
                              </div>

                              {/* 점선 구분선 */}
                              <div 
                                className="h-[98px] bg-white my-[8px]"
                                style={{
                                  width: '0.3px',
                                  borderRight: '0.3px dashed #3B3B3B',
                                  WebkitBorderImage: 'repeating-linear-gradient(to bottom, #3B3B3B, #3B3B3B 1px, transparent 3px, transparent 6px) 1'
                                }}
                              />

                              {/* 오른쪽 컨테이너 (내용) */}
                              <div className="w-[224px] h-[114px] bg-white rounded-[8px] pl-3 pr-3 pt-2 pb-3 flex flex-col items-start">
                                <div className="flex items-center justify-between w-full">
                                  <h3 className="text-[22px] font-medium text-[#479aff]">{store.name}</h3>
                                </div>
                                <p className="text-[15px] text-[#333333] font-medium leading-tight mt-1">{store.description}</p>
                                {store.condition && (
                                  <p className="text-[12px] text-[#999999] leading-tight">{store.condition}</p>
                                )}
                                <p className="text-[12px] text-[#999999] leading-tight">{store.expireDate || "2026/07/04까지 사용 가능"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 그라데이션 오버레이 (버튼 클릭 전에만 보임) */}
                      {!showAllBenefits && benefits.length > 1 && (
                        <div className="relative">
                          {/* 나머지 혜택들 (그라데이션으로 가려짐) - 최대 2개만 표시 */}
                          <div className="space-y-3">
                            {benefits.slice(1, 3).map((store) => (
                              <div key={store.id} className="flex mb-3">
                                {/* 왼쪽 컨테이너 (썸네일) */}
                                <div className="w-[114px] h-[114px] bg-white rounded-[8px] p-[5.5px] flex items-center justify-center">
                                  {store.imageUrl ? (
                                    <img 
                                      src={store.imageUrl}
                                      alt={store.name}
                                      className="w-[103px] h-[103px] rounded-[8px] object-cover"
                                    />
                                  ) : (
                                    <div className="w-[103px] h-[103px] rounded-[8px] bg-[#479aff]" />
                                  )}
                                </div>

                                {/* 점선 구분선 */}
                                <div 
                                  className="h-[98px] bg-white my-[8px]"
                                  style={{
                                    width: '0.3px',
                                    borderRight: '0.3px dashed #3B3B3B',
                                    WebkitBorderImage: 'repeating-linear-gradient(to bottom, #3B3B3B, #3B3B3B 1px, transparent 3px, transparent 6px) 1'
                                  }}
                                />

                                {/* 오른쪽 컨테이너 (내용) */}
                                <div className="w-[224px] h-[114px] bg-white rounded-[8px] pl-3 pr-3 pt-2 pb-3 flex flex-col items-start">
                                  <div className="flex items-center justify-between w-full">
                                    <h3 className="text-[22px] font-medium text-[#479aff]">{store.name}</h3>
                                  </div>
                                  <p className="text-[15px] text-[#333333] font-medium leading-tight mt-1">{store.description}</p>
                                  {store.condition && (
                                    <p className="text-[12px] text-[#999999] leading-tight">{store.condition}</p>
                                  )}
                                  <p className="text-[12px] text-[#999999] leading-tight">{store.expireDate || "2026/07/04까지 사용 가능"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* 더 강한 그라데이션 오버레이 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#75B4FF] via-[#75B4FF]/80 to-transparent pointer-events-none" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STEP 1~3: 기존 이미지 표시 */
            <div className="relative flex items-center justify-center" style={{ 
              width: '400px', 
              height: '400px' 
            }}>
              <img
                src={step.image}
                alt={`Additional Step ${step.id}`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          </div>
          
          {/* STEP 사이 빈 공간 (마지막 STEP 제외) */}
          {step.id < 4 && (
            <div className="w-full h-[122px] relative z-10" style={{ backgroundColor: '#75B4FF' }}></div>
          )}
        </React.Fragment>
      ))}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
      `}</style>
    </main>
  );
}
  