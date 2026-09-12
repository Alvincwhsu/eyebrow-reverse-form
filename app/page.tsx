"use client";

import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

// 官方 LINE 與 IG 設定
const OFFICIAL_LINE_ID = "@250mykon"; 
const OFFICIAL_LINE_URL = `https://line.me/R/ti/p/${OFFICIAL_LINE_ID}`;
const INSTAGRAM_HANDLE = "akunarch";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

// 原價設定
const BASE_SERVICES = [
  { name: '野生眉（熱門首選）', originalPrice: 6800, note: '1. 客製眉型設計 2. 術後保養包 3. 三個月內免費補色一次' },
  { name: '純飄眉（入門體驗）', originalPrice: 4500, note: '1. 客製眉型設計 2. 術後保養包 （▲不含補色）' },
  { name: '一年內補色', originalPrice: 3800, note: '1. 客製眉型調整 2. 術後保養包 （▲限本店舊客）' },
];

// 第一步：預約基本資料
interface BookingInfo {
  name: string;
  phone: string;
  lineId: string;
  birthday: string;
  isBirthdayMonth: string; // 是否為當月壽星
  service: string;
  isFirstTime: string;
  date1: string;
  timeSlot1: string;
  date2: string;
  timeSlot2: string;
  date3: string;
  timeSlot3: string;
  source: string;
  sourceDetail: string;
  note: string;
}

// 第二步：健康評估資料
interface HealthInfo {
  conditions: string[];
  conditionOther: string;
  medications: string[];
  medicationOther: string;
  eyebrowProducts: string[];
  productOther: string;
  hasScar: string;
  scarDetail: string;
}

// 第三步：顧客意向資料
interface PreferenceInfo {
  makeupHabit: string;
  makeupHabitOther: string;
  eyebrowShape: string;
  eyebrowShapeOther: string;
  colorExpectation: string;
  colorExpectationOther: string;
}

// 第四步：須知事項條款
interface TermsInfo {
  agreed: boolean;
}

// 第五步：顧客同意書與線上簽名
interface ConsentInfo {
  photoAgreed: boolean;
  signatureImage: string;
  signedDate: string;
}

export default function BookingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [copiedLine, setCopiedLine] = useState(false);

  // 步驟一狀態
  const [bookingData, setBookingData] = useState<BookingInfo>({
    name: '',
    phone: '',
    lineId: '',
    birthday: '',
    isBirthdayMonth: '否',
    service: '',
    isFirstTime: '是',
    date1: '',
    timeSlot1: '',
    date2: '',
    timeSlot2: '',
    date3: '',
    timeSlot3: '',
    source: 'instagram',
    sourceDetail: '',
    note: '',
  });

  // 計算價格選單（根據是否壽星）
  const getServiceOptions = (isBirthday: boolean) => {
    return BASE_SERVICES.map((item) => {
      const finalPrice = isBirthday
        ? Math.round(item.originalPrice * 0.9)
        : item.originalPrice;
      const label = isBirthday
        ? `${item.name} - 壽星價 NT$ ${finalPrice.toLocaleString()} (原價 NT$ ${item.originalPrice.toLocaleString()})`
        : `${item.name} - NT$ ${finalPrice.toLocaleString()}`;
      const value = `${item.name} (NT$ ${finalPrice.toLocaleString()}${isBirthday ? ' 壽星9折' : ''})`;
      return { ...item, finalPrice, label, value };
    });
  };

  const currentServiceOptions = getServiceOptions(bookingData.isBirthdayMonth === '是');

  // 當選擇壽星切換時，自動更新預約項目的顯示文字與價格
  useEffect(() => {
    if (!bookingData.service) {
      setBookingData((prev) => ({ ...prev, service: currentServiceOptions[0].value }));
      return;
    }

    // 找到當前選中的服務基礎名稱
    const matchedService = BASE_SERVICES.find((s) => bookingData.service.includes(s.name));
    if (matchedService) {
      const isBirthday = bookingData.isBirthdayMonth === '是';
      const finalPrice = isBirthday
        ? Math.round(matchedService.originalPrice * 0.9)
        : matchedService.originalPrice;
      const newServiceValue = `${matchedService.name} (NT$ ${finalPrice.toLocaleString()}${isBirthday ? ' 壽星9折' : ''})`;
      setBookingData((prev) => ({ ...prev, service: newServiceValue }));
    }
  }, [bookingData.isBirthdayMonth]);

  // 步驟二狀態
  const [healthData, setHealthData] = useState<HealthInfo>({
    conditions: [],
    conditionOther: '',
    medications: [],
    medicationOther: '',
    eyebrowProducts: [],
    productOther: '',
    hasScar: '無',
    scarDetail: '',
  });

  // 步驟三狀態
  const [preferenceData, setPreferenceData] = useState<PreferenceInfo>({
    makeupHabit: '完全不化妝',
    makeupHabitOther: '',
    eyebrowShape: '不了解',
    eyebrowShapeOther: '',
    colorExpectation: '喜歡偏自然，平常可以自己掃眉粉',
    colorExpectationOther: '',
  });

  // 步驟四狀態
  const [termsData, setTermsData] = useState<TermsInfo>({
    agreed: false,
  });

  // 步驟五狀態
  const [consentData, setConsentData] = useState<ConsentInfo>({
    photoAgreed: true,
    signatureImage: '',
    signedDate: new Date().toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = ['10:00', '14:00', '18:00'];

  const sources = [
    { label: 'Instagram', value: 'instagram' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'Google 搜尋', value: 'google' },
    { label: '朋友介紹', value: 'friend' },
    { label: '其他', value: 'other' },
  ];

  const conditionOptions = [
    '無',
    '懷孕', '糖尿病', '心臟病', '高血壓', '蟹足腫', '過敏體質',
    '每週喝酒3天以上', '賀爾蒙失調', '甲狀腺',
    '眉毛區塊皮膚疾病（毛囊炎、痘痘、濕疹、異位性皮膚炎）',
    'B型肝炎', '蕁麻疹', '貧血', '愛滋病', '癲癇', '免疫力下降',
    '切眉', '做過雷射洗眉', '做過除色',
    '曾經做過眉毛紋繡（包含紋眉、繡眉、飄眉、霧眉、纖霧眉等等）',
    '月經期間', '月經前七天'
  ];

  const medicationOptions = ['無', '中藥', '西藥', '抗凝血藥物'];
  const productOptions = ['無', 'A酸', 'A醇', '換膚產品'];

  const makeupHabitOptions = [
    '完全不化妝',
    '偶爾畫／經常淡妝',
    '經常畫歐美妝／偏濃妝系',
    '其他'
  ];

  const eyebrowShapeOptions = [
    '不了解',
    '有偏向的喜好（偏平／偏彎／偏挑／偏粗／偏細）',
    '有喜歡的風格（日常／溫柔／自然／韓系／歐美）',
    '其他'
  ];

  const colorExpectationOptions = [
    '喜歡淡淡的感覺，最好不要被發現！',
    '喜歡偏自然，平常可以自己掃眉粉',
    '喜歡妝感眉型',
    '喜歡比較深一點',
    '其他'
  ];

  const handleBookingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (
    field: 'conditions' | 'medications' | 'eyebrowProducts',
    value: string
  ) => {
    setHealthData((prev) => {
      let currentList = [...prev[field]];
      if (value === '無') {
        return { ...prev, [field]: ['無'] };
      } else {
        currentList = currentList.filter((item) => item !== '無');
        if (currentList.includes(value)) {
          currentList = currentList.filter((item) => item !== value);
        } else {
          currentList.push(value);
        }
        return { ...prev, [field]: currentList };
      }
    });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setConsentData((prev) => ({ ...prev, signatureImage: '' }));
  };

  const copyLineId = () => {
    navigator.clipboard.writeText(OFFICIAL_LINE_ID);
    setCopiedLine(true);
    setTimeout(() => setCopiedLine(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sigCanvas.current?.isEmpty()) {
      alert('請完成線上簽名後再送出預約！');
      return;
    }

    const signatureBase64 = sigCanvas.current
      ? sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      : '';

    setIsSubmitting(true);

    const finalPayload = {
      booking: bookingData,
      health: healthData,
      preference: preferenceData,
      termsAgreed: termsData.agreed,
      consent: {
        ...consentData,
        signatureImage: signatureBase64,
      },
    };

    console.log('完整預約、健康評估與線上簽名資料:', finalPayload);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 當前選中的服務說明卡片
  const activeServiceInfo = currentServiceOptions.find((s) => bookingData.service.includes(s.name));

  return (
    <main className="min-h-screen bg-[#F4F7F4] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-sm border border-[#E2EBE2]">
        
        {step !== 6 && (
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold tracking-widest text-[#5B7B5E] uppercase bg-[#E8F0E8] px-3.5 py-1.5 rounded-full inline-block mb-3">
              Online Booking
            </span>
            <h1 className="text-3xl font-bold text-[#2D3B2E] tracking-wide">
              自然野生眉
            </h1>
          </div>
        )}

        {step !== 6 && (
          <div className="flex items-center justify-center mb-8 gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center gap-1">
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium ${step === num ? 'bg-[#5B7B5E] text-white' : 'bg-[#E8F0E8] text-[#5B7B5E]'}`}>
                  {num}
                </span>
                <span className={`text-[10px] sm:text-xs font-medium ${step === num ? 'text-[#5B7B5E]' : 'text-[#A3B0A4]'}`}>
                  {num === 1 && '預約'}
                  {num === 2 && '健康'}
                  {num === 3 && '意向'}
                  {num === 4 && '須知'}
                  {num === 5 && '同意書'}
                </span>
                {num < 5 && <div className="w-2 sm:w-4 h-[1px] bg-[#DCE4DC]" />}
              </div>
            ))}
          </div>
        )}

        {/* ================= 步驟一：預約資訊 (包含動態壽星 9 折) ================= */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1.5 mb-3">
                1. 個人基本資料
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={bookingData.name}
                  onChange={handleBookingChange}
                  placeholder="請輸入您的姓名"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm focus:ring-2 focus:ring-[#8BA88D] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                    電話 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={bookingData.phone}
                    onChange={handleBookingChange}
                    placeholder="0912345678"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm focus:ring-2 focus:ring-[#8BA88D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                    LINE ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lineId"
                    required
                    value={bookingData.lineId}
                    onChange={handleBookingChange}
                    placeholder="請輸入您的 LINE ID"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm focus:ring-2 focus:ring-[#8BA88D] outline-none"
                  />
                </div>
              </div>

              {/* 生日與當月壽星優惠勾選 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                    生日 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    required
                    value={bookingData.birthday}
                    onChange={handleBookingChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm focus:ring-2 focus:ring-[#8BA88D] outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#F0F5F0] border border-[#D8E5D9]">
                  <label className="block text-xs font-medium text-[#3D4D3E] mb-1.5">
                    🎂 是否為當月壽星？ <span className="text-[#5B7B5E] font-semibold">(自動套用 9 折價格)</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#4A574B]">
                      <input
                        type="radio"
                        name="isBirthdayMonth"
                        value="是"
                        checked={bookingData.isBirthdayMonth === '是'}
                        onChange={handleBookingChange}
                        className="accent-[#5B7B5E]"
                      />
                      是，當月壽星 🎂
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#4A574B]">
                      <input
                        type="radio"
                        name="isBirthdayMonth"
                        value="否"
                        checked={bookingData.isBirthdayMonth === '否'}
                        onChange={handleBookingChange}
                        className="accent-[#5B7B5E]"
                      />
                      否
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 預約內容選擇與動態價目 */}
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1.5 mb-3">
                2. 預約項目選擇與價目
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                  預約項目 <span className="text-red-400">*</span>
                </label>
                <select
                  name="service"
                  value={bookingData.service}
                  onChange={handleBookingChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm focus:ring-2 focus:ring-[#8BA88D] outline-none"
                >
                  {currentServiceOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 展示服務詳情與當前結算價格 */}
              {activeServiceInfo && (
                <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs text-[#687869] space-y-1">
                  <div className="flex justify-between items-center border-b border-[#E2EBE2] pb-1">
                    <p className="font-semibold text-[#5B7B5E]">✨ {activeServiceInfo.name}</p>
                    <p className="font-bold text-[#2D3B2E]">
                      {bookingData.isBirthdayMonth === '是' ? (
                        <>
                          <span className="line-through text-gray-400 mr-1.5">NT$ {activeServiceInfo.originalPrice.toLocaleString()}</span>
                          <span className="text-red-600 font-extrabold">壽星價 NT$ {activeServiceInfo.finalPrice.toLocaleString()}</span>
                        </>
                      ) : (
                        `NT$ ${activeServiceInfo.finalPrice.toLocaleString()}`
                      )}
                    </p>
                  </div>
                  <p className="pt-1">{activeServiceInfo.note}</p>
                </div>
              )}

              {/* 是否第一次體驗 */}
              <div className="p-4 rounded-xl bg-[#F0F5F0] border border-[#D8E5D9]">
                <label className="block text-xs font-medium text-[#3D4D3E] mb-2">
                  是否為第一次體驗紋繡/飄眉服務？ <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#4A574B]">
                    <input
                      type="radio"
                      name="isFirstTime"
                      value="是"
                      checked={bookingData.isFirstTime === '是'}
                      onChange={handleBookingChange}
                      className="accent-[#5B7B5E]"
                    />
                    是，第一次
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[#4A574B]">
                    <input
                      type="radio"
                      name="isFirstTime"
                      value="否"
                      checked={bookingData.isFirstTime === '否'}
                      onChange={handleBookingChange}
                      className="accent-[#5B7B5E]"
                    />
                    否，曾有經驗
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1.5 mb-1">
                3. 預約時間順位
              </h2>

              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] space-y-3">
                <span className="text-xs font-semibold text-[#5B7B5E] bg-[#E8F0E8] px-2.5 py-1 rounded-md inline-block">
                  第一順位 (必填) *
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="date1"
                    required
                    value={bookingData.date1}
                    onChange={handleBookingChange}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  />
                  <select
                    name="timeSlot1"
                    required
                    value={bookingData.timeSlot1}
                    onChange={handleBookingChange}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  >
                    <option value="" disabled>請選擇時段</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] space-y-3">
                <span className="text-xs font-medium text-[#7A8A7B] bg-[#F0F4F0] px-2.5 py-1 rounded-md inline-block">
                  第二順位 (選填)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="date2"
                    value={bookingData.date2}
                    onChange={handleBookingChange}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  />
                  <select
                    name="timeSlot2"
                    required={!!bookingData.date2}
                    value={bookingData.timeSlot2}
                    onChange={handleBookingChange}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  >
                    <option value="" disabled>請選擇時段</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] space-y-3">
                <span className="text-xs font-medium text-[#7A8A7B] bg-[#F0F4F0] px-2.5 py-1 rounded-md inline-block">
                  第三順位 (選填)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    name="date3"
                    value={bookingData.date3}
                    onChange={handleBookingChange}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  />
                  <select
                    name="timeSlot3"
                    required={!!bookingData.date3}
                    value={bookingData.timeSlot3}
                    onChange={handleBookingChange}
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  >
                    <option value="" disabled>請選擇時段</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1.5 mb-3">
                4. 更多資訊
              </h2>

              <div>
                <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                  從哪裡得知我們？ <span className="text-red-400">*</span>
                </label>
                <select
                  name="source"
                  value={bookingData.source}
                  onChange={handleBookingChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                >
                  {sources.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {(bookingData.source === 'friend' || bookingData.source === 'other') && (
                <div>
                  <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                    {bookingData.source === 'friend' ? '朋友姓名/暱稱' : '請說明其他來源'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="sourceDetail"
                    required
                    value={bookingData.sourceDetail}
                    onChange={handleBookingChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A574B] mb-1.5">
                  其他備註
                </label>
                <textarea
                  name="note"
                  rows={2}
                  value={bookingData.note}
                  onChange={handleBookingChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm resize-none outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3.5 px-4 bg-[#5B7B5E] hover:bg-[#4A664D] text-white font-medium rounded-xl transition-all shadow-sm"
            >
              下一頁：填寫健康評估 →
            </button>
          </form>
        )}

        {/* ================= 步驟二：顧客身體狀況詢問 ================= */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="space-y-6"
          >
            <div className="p-4 rounded-xl bg-[#F0F5F0] border border-[#D8E5D9] mb-4">
              <p className="text-xs text-[#3D4D3E] leading-relaxed">
                下列項目攸關於您的健康，及評估自身是否適合接受紋繡服務，請務必誠實告知。
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                1. 當下的身體狀況？（可複選） <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                {conditionOptions.map((item) => (
                  <label key={item} className={`flex items-center gap-2 text-xs cursor-pointer hover:text-[#2D3B2E] ${item === '無' ? 'font-bold text-[#5B7B5E] col-span-full pb-1 border-b border-[#E2EBE2]' : 'text-[#4A574B]'}`}>
                    <input
                      type="checkbox"
                      checked={healthData.conditions.includes(item)}
                      onChange={() => handleCheckboxChange('conditions', item)}
                      className="accent-[#5B7B5E] rounded"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="其他身體狀況補充說明..."
                value={healthData.conditionOther}
                onChange={(e) => setHealthData({ ...healthData, conditionOther: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                2. 現在有無服用任何藥物？（可複選） <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                {medicationOptions.map((item) => (
                  <label key={item} className={`flex items-center gap-2 text-xs cursor-pointer ${item === '無' ? 'font-bold text-[#5B7B5E]' : 'text-[#4A574B]'}`}>
                    <input
                      type="checkbox"
                      checked={healthData.medications.includes(item)}
                      onChange={() => handleCheckboxChange('medications', item)}
                      className="accent-[#5B7B5E] rounded"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="其他藥物說明..."
                value={healthData.medicationOther}
                onChange={(e) => setHealthData({ ...healthData, medicationOther: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                3. 近期眉毛有無塗抹保養產品？（可複選） <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                {productOptions.map((item) => (
                  <label key={item} className={`flex items-center gap-2 text-xs cursor-pointer ${item === '無' ? 'font-bold text-[#5B7B5E]' : 'text-[#4A574B]'}`}>
                    <input
                      type="checkbox"
                      checked={healthData.eyebrowProducts.includes(item)}
                      onChange={() => handleCheckboxChange('eyebrowProducts', item)}
                      className="accent-[#5B7B5E] rounded"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <input
                type="text"
                placeholder="其他產品補充說明..."
                value={healthData.productOther}
                onChange={(e) => setHealthData({ ...healthData, productOther: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                4. 眉部有無外傷或疤痕？ <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-6 p-3 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                <label className="flex items-center gap-2 text-xs text-[#4A574B] cursor-pointer">
                  <input
                    type="radio"
                    name="hasScar"
                    value="有"
                    checked={healthData.hasScar === '有'}
                    onChange={(e) => setHealthData({ ...healthData, hasScar: e.target.value })}
                    className="accent-[#5B7B5E]"
                  />
                  有
                </label>
                <label className="flex items-center gap-2 text-xs text-[#4A574B] cursor-pointer">
                  <input
                    type="radio"
                    name="hasScar"
                    value="無"
                    checked={healthData.hasScar === '無'}
                    onChange={(e) => setHealthData({ ...healthData, hasScar: e.target.value })}
                    className="accent-[#5B7B5E]"
                  />
                  無
                </label>
              </div>
              {healthData.hasScar === '有' && (
                <input
                  type="text"
                  required
                  placeholder="請說明疤痕或外傷位置與情況..."
                  value={healthData.scarDetail}
                  onChange={(e) => setHealthData({ ...healthData, scarDetail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
                />
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 px-4 bg-[#E8F0E8] text-[#5B7B5E] font-medium rounded-xl hover:bg-[#DCE7DC] transition-all text-sm"
              >
                ← 上一步
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 px-4 bg-[#5B7B5E] hover:bg-[#4A664D] text-white font-medium rounded-xl transition-all shadow-sm text-sm"
              >
                下一頁：填寫意向詢問 →
              </button>
            </div>
          </form>
        )}

        {/* ================= 步驟三：顧客意向詢問 ================= */}
        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(4);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="space-y-6"
          >
            <div className="p-4 rounded-xl bg-[#F0F5F0] border border-[#D8E5D9] mb-4">
              <p className="text-xs text-[#3D4D3E] leading-relaxed">
                了解您的妝容習慣與風格喜好，協助紋繡師設計最適合您的眉型與留色效果。
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                1. 日常化妝習慣 <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2 p-3.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                {makeupHabitOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2.5 text-xs text-[#4A574B] cursor-pointer hover:text-[#2D3B2E]">
                    <input
                      type="radio"
                      name="makeupHabit"
                      value={option}
                      checked={preferenceData.makeupHabit === option}
                      onChange={(e) => setPreferenceData({ ...preferenceData, makeupHabit: e.target.value })}
                      className="accent-[#5B7B5E]"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {preferenceData.makeupHabit === '其他' && (
                <input
                  type="text"
                  required
                  placeholder="請補充說明您的化妝習慣..."
                  value={preferenceData.makeupHabitOther}
                  onChange={(e) => setPreferenceData({ ...preferenceData, makeupHabitOther: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
                />
              )}
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                2. 是否了解自己適合的眉型？ <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2 p-3.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                {eyebrowShapeOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2.5 text-xs text-[#4A574B] cursor-pointer hover:text-[#2D3B2E]">
                    <input
                      type="radio"
                      name="eyebrowShape"
                      value={option}
                      checked={preferenceData.eyebrowShape === option}
                      onChange={(e) => setPreferenceData({ ...preferenceData, eyebrowShape: e.target.value })}
                      className="accent-[#5B7B5E]"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {preferenceData.eyebrowShape === '其他' && (
                <input
                  type="text"
                  required
                  placeholder="請補充說明偏好的眉型風格..."
                  value={preferenceData.eyebrowShapeOther}
                  onChange={(e) => setPreferenceData({ ...preferenceData, eyebrowShapeOther: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
                />
              )}
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-[#2D3B2E]">
                3. 對留色的期待 <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2 p-3.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
                {colorExpectationOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2.5 text-xs text-[#4A574B] cursor-pointer hover:text-[#2D3B2E]">
                    <input
                      type="radio"
                      name="colorExpectation"
                      value={option}
                      checked={preferenceData.colorExpectation === option}
                      onChange={(e) => setPreferenceData({ ...preferenceData, colorExpectation: e.target.value })}
                      className="accent-[#5B7B5E]"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {preferenceData.colorExpectation === '其他' && (
                <input
                  type="text"
                  required
                  placeholder="請補充說明留色期待..."
                  value={preferenceData.colorExpectationOther}
                  onChange={(e) => setPreferenceData({ ...preferenceData, colorExpectationOther: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-xs outline-none"
                />
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3.5 px-4 bg-[#E8F0E8] text-[#5B7B5E] font-medium rounded-xl hover:bg-[#DCE7DC] transition-all text-sm"
              >
                ← 上一步
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 px-4 bg-[#5B7B5E] hover:bg-[#4A664D] text-white font-medium rounded-xl transition-all shadow-sm text-sm"
              >
                下一頁：閱讀須知事項 →
              </button>
            </div>
          </form>
        )}

        {/* ================= 步驟四：須知事項 ================= */}
        {step === 4 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(5);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="space-y-6"
          >
            <h2 className="text-sm font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1.5 mb-3">
              須知事項
            </h2>

            <div className="max-h-80 overflow-y-auto p-4 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] space-y-4 text-xs text-[#4A574B] leading-relaxed">
              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">一、衛生保障</h3>
                <p>本店使用一次性用品，操作過程中可杜絕所有交叉感染。使用完畢必定拋棄，絕不重複使用。</p>
              </section>

              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">二、紋繡後須知</h3>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>一週內要保持充足睡眠。</li>
                  <li>一週內勿將化妝品或保養品塗抹到紋繡處，以免引起顏色偏色或感染。</li>
                  <li>一週內避免食用海鮮、辛辣、酒。</li>
                  <li>一個月內儘量避免高溫場所、水上活動。</li>
                  <li>結痂後需等自行脫落，如有乾癢現象切勿人為摳除易影響上色。</li>
                  <li>三至五天呈現結痂、脫皮、發癢均為正常現像請不要摳抓會掉色，第三天起可薄擦修復霜緩解乾癢現象。</li>
                  <li>如個人皮膚癒合能力較弱或身體抵抗力較弱或免疫系統不佳，如有發炎現象，請儘速就醫治療。</li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">三、紋繡補色</h3>
                <p className="mb-2">本人充分瞭解半永久化妝技術非永久性上色，操作後若需補色，本人同意依下列方式處理：</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>眉毛 3 個月內可免費補色 1 次。超過上述期限或次數之補色或修型，將酌收費用（1 年內補色 3,800 元，單次）。</li>
                  <li>超過者享有時價之定價八折之舊客優惠。</li>
                </ul>
              </section>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F5F0] border border-[#D8E5D9]">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-[#2D3B2E] font-medium leading-normal">
                <input
                  type="checkbox"
                  required
                  checked={termsData.agreed}
                  onChange={(e) => setTermsData({ agreed: e.target.checked })}
                  className="accent-[#5B7B5E] w-4 h-4 rounded mt-0.5"
                />
                我已詳細閱讀並充分理解以上須知事項，並同意遵守相關注意事項。
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 py-3.5 px-4 bg-[#E8F0E8] text-[#5B7B5E] font-medium rounded-xl hover:bg-[#DCE7DC] transition-all text-sm"
              >
                ← 上一步
              </button>
              <button
                type="submit"
                disabled={!termsData.agreed}
                className="w-2/3 py-3.5 px-4 bg-[#5B7B5E] hover:bg-[#4A664D] text-white font-medium rounded-xl transition-all shadow-sm disabled:bg-[#A3B8A5] text-sm"
              >
                下一頁：簽署顧客同意書 →
              </button>
            </div>
          </form>
        )}

        {/* ================= 步驟五：紋繡服務同意書與線上簽名 ================= */}
        {step === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-sm font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1.5 mb-2">
              紋繡服務說明書與同意書
            </h2>

            <div className="max-h-80 overflow-y-auto p-4 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] space-y-4 text-xs text-[#4A574B] leading-relaxed">
              <p className="italic text-[#5B7B5E]">
                這份說明書是用來解說顧客的需求及接受紋繡服務的目的、方法、效益、施作後的保養須知以及可能產生的問題。
              </p>

              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">一、本服務無法達到的效果</h3>
                <p>本服務不在治療、矯正、預防關於皮膚、身體結構及生理組織疾病，若您有疾病、傷害或殘缺，請盡早與您的醫生聯繫預約就診。</p>
              </section>

              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">二、操作方法</h3>
                <p>將由您的紋繡師以口述方式向您解說。</p>
              </section>

              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">三、可能發生輕微疼痛</h3>
                <p>服務過程或施作後，因每個顧客對疼痛感覺不同而異，有些人會有些許疼痛或不舒服的感覺。如接受本服務過程中發生無法忍受的疼痛、不適，請您務必立即主動告知紋繡師，以便暫停或為適切的處理。</p>
              </section>

              <section>
                <h3 className="font-bold text-[#2D3B2E] mb-1">四、注意事項</h3>
                <p>（一）懷孕期間及患有癌症者或其他特殊疾病等不建議接受本服務。若您仍選擇施作，請確保事前已詢問過您的醫師並已審慎評估風險。</p>
                <p>（二）本店對於您可以接受本服務的條件、應遵循的須知，以及危險性等均會充分說明，如有不清楚請務必當場反應。</p>
              </section>

              <section className="pt-2 border-t border-[#DCE4DC]">
                <h3 className="font-bold text-[#2D3B2E] mb-1 text-sm text-center">紋繡服務同意書</h3>
                <p className="font-semibold text-[#2D3B2E] mt-2">一、【紋繡師】之聲明</p>
                <p>1. 我已經盡量以顧客所能了解的方式及語言，解釋做這項本服務的相關資訊。</p>
                <p>2. 我已經給予顧客充足時間，詢問有關本次本服務的問題，並給予答覆。</p>

                <p className="font-semibold text-[#2D3B2E] mt-2">二、【顧客】之聲明與同意</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>紋繡師已向我解釋，並且我已經瞭解步驟程序、有關健康的風險（出血、發炎、腫脹、疼痛、疤痕、過敏反應、皮膚感染等）、費用、使用的工具及原料。</li>
                  <li>針對我的情況，我能夠向紋繡師提出問題和疑慮，並已獲得說明。</li>
                  <li>紋繡師已給我充分時間考慮是否要做這項本服務。</li>
                  <li>本人已充分瞭解紋繡具有不可避免的輕微傷口始能上色，預期此過程將帶來潛在不適感、流血、紅腫、疼痛及過敏現象。</li>
                  <li>本人已充分瞭解相關保養須知、注意事項並同意遵循，紋繡後保養是本人的責任。</li>
                  <li>產品均經合格單位認證、服務人員均通過檢定，如發生不適或作品瑕疵，應提出係肇因於本服務之證明，否則無法接受退費或賠償要求。</li>
                  <li>其他同意事項：確認設計溝通滿意後始施作，不保證每人美感一定滿意故不接受退費；成果會隨時間褪色，無保固期；去除成果須經醫學雷射或手術，費用昂貴且可能留疤；已誠實告知身體狀況，自行承擔風險。</li>
                </ul>
              </section>

              <div className="pt-2">
                <label className="flex items-center gap-2 font-medium text-[#2D3B2E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentData.photoAgreed}
                    onChange={(e) => setConsentData({ ...consentData, photoAgreed: e.target.checked })}
                    className="accent-[#5B7B5E] rounded"
                  />
                  本人同意由服務人員拍攝本服務前後照片做為記錄，並同意於各項媒體及網路使用。
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-[#2D3B2E]">
                  顧客線上簽名 <span className="text-red-400">* (請在下方畫布簽名)</span>
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-red-500 underline hover:text-red-700"
                >
                  清除重簽
                </button>
              </div>
              
              <div className="border border-[#5B7B5E]/40 rounded-xl bg-white overflow-hidden touch-none shadow-inner">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#2D3B2E"
                  canvasProps={{
                    className: 'w-full h-40 signature-canvas',
                  }}
                />
              </div>
              <p className="text-[11px] text-[#7A8A7B]">
                簽署日期：{consentData.signedDate}
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-1/3 py-3.5 px-4 bg-[#E8F0E8] text-[#5B7B5E] font-medium rounded-xl hover:bg-[#DCE7DC] transition-all text-sm"
              >
                ← 上一步
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3.5 px-4 bg-[#5B7B5E] hover:bg-[#4A664D] text-white font-medium rounded-xl transition-all shadow-sm disabled:bg-[#A3B8A5] text-sm"
              >
                {isSubmitting ? '處理送出中...' : '確認完成並送出預約'}
              </button>
            </div>
          </form>
        )}

        {/* ================= 步驟六：預約成功 ================= */}
        {step === 6 && (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 bg-[#E8F0E8] text-[#5B7B5E] rounded-full flex items-center justify-center mx-auto text-3xl font-semibold shadow-inner">
              ✓
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-[#2D3B2E] mb-2">預約資料已送出！</h2>
              <p className="text-[#687869] text-sm leading-relaxed max-w-md mx-auto">
                親愛的 <span className="font-semibold text-[#2D3B2E]">{bookingData.name}</span> 您好，我們已收到您的預約資訊與簽署同意書。
              </p>
            </div>

            {/* 預約摘要 */}
            <div className="bg-[#FAFBF9] p-4 rounded-2xl border border-[#DCE4DC] text-left max-w-md mx-auto text-xs space-y-2">
              <p className="font-semibold text-[#5B7B5E] border-b border-[#E2EBE2] pb-1">預約摘要</p>
              <p><span className="text-[#7A8A7B]">預約項目：</span>{bookingData.service}</p>
              <p><span className="text-[#7A8A7B]">當月壽星：</span>{bookingData.isBirthdayMonth === '是' ? '🎂 是 (已套用 9 折優惠)' : '否'}</p>
              <p><span className="text-[#7A8A7B]">首選日期/時段：</span>{bookingData.date1} {bookingData.timeSlot1}</p>
            </div>

            {/* 社群聯絡與追蹤卡片 */}
            <div className="bg-[#F0F5F0] p-6 rounded-2xl border border-[#D8E5D9] max-w-md mx-auto space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold tracking-wider text-[#5B7B5E] uppercase bg-white px-2.5 py-1 rounded-full inline-block border border-[#D8E5D9]">
                  Step 2: 最後一步
                </span>
                <h3 className="text-lg font-bold text-[#2D3B2E]">請加入官方 LINE 聯繫預約狀況</h3>
                <p className="text-xs text-[#687869]">
                  點擊下方按鈕加入官方 LINE 並發送您的姓名，紋繡師將親自為您確認時間與發放優惠。
                </p>
              </div>

              {/* 加入 LINE 按鈕 */}
              <a
                href={OFFICIAL_LINE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349.0.63.285.63.631.0.345-.281.63-.63.63H17.61v1.125h1.755c.349.0.63.283.63.63.0.344-.281.629-.63.629h-2.386c-.345.0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346.0.627.285.627.63.0.349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211.0-.416-.105-.537-.289l-2.494-3.676v3.305c0 .348-.282.63-.63.63-.348.0-.63-.282-.63-.63V8.108c0-.27.174-.51.432-.596.063-.021.132-.031.198-.031.211.0.417.105.538.288l2.493 3.676V8.108c0-.345.282-.63.63-.63.348.0.63.285.63.63v4.771zm-6.839.0c0 .348-.282.63-.63.63-.349.0-.63-.282-.63-.63V8.108c0-.345.281-.63.63-.63.348.0.63.285.63.63v4.771zm-2.541.0H3.743c-.349.0-.63-.282-.63-.63V8.108c0-.345.281-.63.63-.63.349.0.63.285.63.63v4.141h1.756c.348.0.629.283.629.63.0.344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943.0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                加入 LINE 官方帳號
              </a>

              {/* 複製 LINE ID 備用 */}
              <div className="pt-1 flex items-center justify-center gap-2 text-xs text-[#687869]">
                <span>LINE ID：<strong className="text-[#2D3B2E]">{OFFICIAL_LINE_ID}</strong></span>
                <button
                  type="button"
                  onClick={copyLineId}
                  className="px-2.5 py-1 bg-white border border-[#D8E5D9] rounded-md hover:bg-[#E8F0E8] text-[#5B7B5E] transition-all"
                >
                  {copiedLine ? '已複製！' : '複製 ID'}
                </button>
              </div>

              {/* 追蹤 Instagram 區塊 */}
              <div className="pt-4 border-t border-[#D8E5D9]">
                <p className="text-xs text-[#687869] mb-2.5">
                  觀看更多作品集與最新動態：
                </p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  追蹤 Instagram：@{INSTAGRAM_HANDLE}
                </a>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#7A8A7B] underline hover:text-[#5B7B5E]"
              >
                返回填寫新的預約表單
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}