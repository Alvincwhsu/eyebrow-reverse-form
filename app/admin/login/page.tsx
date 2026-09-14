"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';

interface Booking {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  line_id: string;
  birthday: string;
  is_birthday_month: boolean;
  service_name: string;
  final_price: number;
  date1: string;
  time_slot1: string;
  date2?: string;
  time_slot2?: string;
  date3?: string;
  time_slot3?: string;
  confirmed_date?: string;
  confirmed_time_slot?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: string;
  source_detail?: string;
  note?: string;           // 顧客填寫的備註
  admin_note?: string;     // 店家內部備註（顧客看不見）
  health_conditions: string[];
  makeup_habit: string;
  signature_image: string;
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<'orders' | 'analytics'>('orders');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // 編輯內部備註狀態
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('admin_auth=true')) {
      router.push('/admin/login');
      return;
    }
    fetchBookings();
  }, [router]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setAdminNoteInput(booking.admin_note || '');
  };

  const confirmBooking = async (bookingId: string, date: string, timeSlot: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          confirmed_date: date,
          confirmed_time_slot: timeSlot,
          status: 'confirmed',
          admin_note: adminNoteInput || null
        })
        .eq('id', bookingId);

      if (error) throw error;
      alert(`已成功確認預約時間為：${date} ${timeSlot}`);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      alert(`確認失敗: ${err.message}`);
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedBooking) return;
    setIsSavingNote(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ admin_note: adminNoteInput || null })
        .eq('id', selectedBooking.id);

      if (error) throw error;
      alert('內部備註已成功更新！');
      setSelectedBooking((prev) => prev ? { ...prev, admin_note: adminNoteInput } : null);
      fetchBookings();
    } catch (err: any) {
      alert(`更新備註失敗: ${err.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('確定要取消此筆預約嗎？')) return;
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    setSelectedBooking(null);
    fetchBookings();
  };

  const handleLogout = () => {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
  };

  const getAgeGroup = (birthday: string) => {
    if (!birthday) return '未提供';
    const birthYear = new Date(birthday).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age < 20) return '20歲以下';
    if (age <= 29) return '20-29歲';
    if (age <= 39) return '30-39歲';
    if (age <= 49) return '40-49歲';
    return '50歲以上';
  };

  const ageDistribution = bookings.reduce((acc: Record<string, number>, b) => {
    const group = getAgeGroup(b.birthday);
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const serviceDistribution = bookings.reduce((acc: Record<string, number>, b) => {
    acc[b.service_name] = (acc[b.service_name] || 0) + 1;
    return acc;
  }, {});

  const sourceDistribution = bookings.reduce((acc: Record<string, number>, b) => {
    const src = b.source === 'friend' ? '朋友介紹' : b.source === 'instagram' ? 'Instagram' : b.source === 'facebook' ? 'Facebook' : b.source === 'google' ? 'Google 搜尋' : '其他';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.final_price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBF9] flex items-center justify-center text-[#5B7B5E] font-medium animate-pulse">
        後台數據載入中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#2D3B2E] font-sans pb-12">
      {/* 導覽列：手機版垂直置中與換行優化 */}
      <header className="bg-white border-b border-[#E2EBE2] px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <span className="text-lg sm:text-xl font-bold text-[#2D3B2E]">預約管理後台</span>
          <span className="text-xs font-semibold bg-[#E8F0E8] text-[#5B7B5E] px-2.5 py-1 rounded-full">
            總預約: {bookings.length} 筆
          </span>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div className="flex bg-[#F0F5F0] p-1 rounded-xl text-xs font-medium flex-1 sm:flex-none justify-center">
            <button
              onClick={() => setTab('orders')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex-1 sm:flex-none text-center ${tab === 'orders' ? 'bg-[#5B7B5E] text-white shadow-sm' : 'text-[#687869]'}`}
            >
              📋 訂單管理
            </button>
            <button
              onClick={() => setTab('analytics')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex-1 sm:flex-none text-center ${tab === 'analytics' ? 'bg-[#5B7B5E] text-white shadow-sm' : 'text-[#687869]'}`}
            >
              📊 數據統計
            </button>
          </div>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:underline px-2 py-1">
            登出
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        {/* ================= 頁籤 1: 訂單管理 ================= */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {/* 提示訊息：提醒手機使用者可以左右滑動 */}
            <div className="sm:hidden flex items-center justify-between text-[11px] text-[#7A8A7B] bg-[#E8F0E8]/60 px-3 py-1.5 rounded-lg border border-[#DCE4DC]">
              <span>👈 提示：手指可左右滑動查看完整表格與操作按鈕 👉</span>
            </div>

            {/* 關鍵優化：包含 overflow-x-auto 讓手機表格支援橫向滾動 */}
            <div className="bg-white rounded-2xl border border-[#E2EBE2] shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="bg-[#FAFBF9] border-b border-[#E2EBE2] text-[#5B7B5E] font-semibold">
                  <tr>
                    <th className="p-3 sm:p-4 min-w-[140px]">顧客姓名 / 電話</th>
                    <th className="p-3 sm:p-4 min-w-[130px]">預約項目 / 費用</th>
                    <th className="p-3 sm:p-4 min-w-[150px]">意願時間順位</th>
                    <th className="p-3 sm:p-4 min-w-[140px]">最終確定時間</th>
                    <th className="p-3 sm:p-4 min-w-[160px]">內部備註 (僅店家可見)</th>
                    <th className="p-3 sm:p-4 min-w-[100px]">狀態</th>
                    <th className="p-3 sm:p-4 min-w-[110px] sticky right-0 bg-[#FAFBF9] border-l border-[#E2EBE2] shadow-sm">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EBE2]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9FBF9] transition-all">
                      <td className="p-3 sm:p-4">
                        <p className="font-bold text-[#2D3B2E] text-sm">{b.name} {b.is_birthday_month && '🎂'}</p>
                        <p className="text-[#7A8A7B]">{b.phone}</p>
                        <p className="text-[#7A8A7B]">LINE: {b.line_id}</p>
                      </td>
                      <td className="p-3 sm:p-4">
                        <p className="font-semibold text-[#5B7B5E]">{b.service_name}</p>
                        <p className="font-bold text-[#2D3B2E]">NT$ {b.final_price.toLocaleString()}</p>
                      </td>
                      <td className="p-3 sm:p-4 space-y-1">
                        <p className="text-[#4A574B]"><span className="text-[#5B7B5E] font-bold">1:</span> {b.date1} {b.time_slot1}</p>
                        {b.date2 && <p className="text-[#7A8A7B]"><span className="font-bold">2:</span> {b.date2} {b.time_slot2}</p>}
                        {b.date3 && <p className="text-[#7A8A7B]"><span className="font-bold">3:</span> {b.date3} {b.time_slot3}</p>}
                      </td>
                      <td className="p-3 sm:p-4">
                        {b.confirmed_date ? (
                          <span className="font-bold text-[#2D3B2E] bg-[#E8F0E8] px-2 py-1 rounded-md border border-[#D8E5D9] inline-block">
                            {b.confirmed_date} {b.confirmed_time_slot}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded inline-block">尚未確認</span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 max-w-[180px]">
                        {b.admin_note ? (
                          <p className="text-xs text-[#4A574B] bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 line-clamp-2">
                            📝 {b.admin_note}
                          </p>
                        ) : (
                          <span className="text-gray-400 italic">無內部備註</span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4">
                        {b.status === 'confirmed' && <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">已確認</span>}
                        {b.status === 'pending' && <span className="text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">待確認</span>}
                        {b.status === 'cancelled' && <span className="text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">已取消</span>}
                      </td>
                      <td className="p-3 sm:p-4 sticky right-0 bg-white border-l border-[#E2EBE2]">
                        <button
                          onClick={() => openModal(b)}
                          className="px-3 py-1.5 bg-[#5B7B5E] text-white rounded-lg hover:bg-[#4A664D] transition-all font-medium whitespace-nowrap shadow-sm"
                        >
                          審核 / 編輯
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 頁籤 2: 客戶數據統計 ================= */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-[#E2EBE2] shadow-sm">
                <p className="text-xs font-semibold text-[#7A8A7B]">已確認總營收</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#5B7B5E] mt-1.5">NT$ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#E2EBE2] shadow-sm">
                <p className="text-xs font-semibold text-[#7A8A7B]">總預約筆數</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#2D3B2E] mt-1.5">{bookings.length} 筆</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#E2EBE2] shadow-sm">
                <p className="text-xs font-semibold text-[#7A8A7B]">當月壽星佔比</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#2D3B2E] mt-1.5">
                  {Math.round((bookings.filter(b => b.is_birthday_month).length / (bookings.length || 1)) * 100)} %
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2EBE2] shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-[#2D3B2E] border-b border-[#E2EBE2] pb-2">🎂 顧客年齡層分佈</h3>
                <div className="space-y-2">
                  {Object.entries(ageDistribution).map(([label, count]) => (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-[#4A574B]">{label}</span>
                      <span className="font-bold text-[#5B7B5E]">{count} 人 ({Math.round((count / bookings.length) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2EBE2] shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-[#2D3B2E] border-b border-[#E2EBE2] pb-2">✨ 預約項目偏好</h3>
                <div className="space-y-2">
                  {Object.entries(serviceDistribution).map(([label, count]) => (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-[#4A574B]">{label}</span>
                      <span className="font-bold text-[#5B7B5E]">{count} 次</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2EBE2] shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-[#2D3B2E] border-b border-[#E2EBE2] pb-2">📢 得知管道分析</h3>
                <div className="space-y-2">
                  {Object.entries(sourceDistribution).map(([label, count]) => (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-[#4A574B]">{label}</span>
                      <span className="font-bold text-[#5B7B5E]">{count} 人</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= Modal: 審核與編輯 (手機滿版滾動優化) ================= */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center border-b border-[#E2EBE2] pb-3 sticky top-0 bg-white z-10">
                <h2 className="text-base sm:text-lg font-bold text-[#2D3B2E]">審核預約與設定</h2>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-black font-bold text-xl px-2">✕</button>
              </div>

              <div className="space-y-2.5 text-xs text-[#4A574B] bg-[#FAFBF9] p-3.5 sm:p-4 rounded-xl border border-[#DCE4DC]">
                <p><strong className="text-[#2D3B2E]">顧客姓名：</strong>{selectedBooking.name} ({selectedBooking.phone})</p>
                <p><strong className="text-[#2D3B2E]">預約項目：</strong>{selectedBooking.service_name} (NT$ {selectedBooking.final_price})</p>
                <p><strong className="text-[#2D3B2E]">健康評估：</strong>{selectedBooking.health_conditions.join(', ') || '無特殊狀況'}</p>
                <p><strong className="text-[#2D3B2E]">日常化妝習慣：</strong>{selectedBooking.makeup_habit}</p>
                {selectedBooking.note && <p><strong className="text-[#2D3B2E]">顧客填寫備註：</strong>{selectedBooking.note}</p>}
                
                {selectedBooking.signature_image && (
                  <div className="pt-2">
                    <p className="font-bold text-[#2D3B2E] mb-1">客戶線上簽名：</p>
                    <img src={selectedBooking.signature_image} alt="Customer Signature" className="h-20 border border-[#DCE4DC] bg-white rounded-lg p-1" />
                  </div>
                )}
              </div>

              {/* 🔒 店家內部備註編輯 */}
              <div className="space-y-2 bg-amber-50/50 p-3.5 sm:p-4 rounded-2xl border border-amber-200/60">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#2D3B2E]">
                    🔒 店家內部備註 <span className="text-[#7A8A7B] font-normal sm:inline hidden">(僅供內部記錄)</span>
                  </label>
                  <button
                    onClick={handleSaveAdminNote}
                    disabled={isSavingNote}
                    className="px-3 py-1 bg-[#5B7B5E] text-white text-xs rounded-lg font-medium hover:bg-[#4A664D] transition-all disabled:opacity-50"
                  >
                    {isSavingNote ? '儲存中...' : '儲存備註'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="例如：已收取訂金 $1000、皮膚偏油留色需注意、舊客介紹..."
                  className="w-full p-2.5 rounded-xl bg-white border border-[#DCE4DC] text-xs outline-none focus:ring-2 focus:ring-[#8BA88D] resize-none"
                />
              </div>

              {/* 確定預約時間順位選擇按鈕 */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[#5B7B5E]">請點擊選擇最終確定時間（點擊後系統將鎖定該時段）：</p>
                
                {/* 順位一 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-[#DCE4DC] bg-white gap-2">
                  <span className="text-xs font-medium text-[#2D3B2E]">
                    第一順位: <strong>{selectedBooking.date1} {selectedBooking.time_slot1}</strong>
                  </span>
                  <button
                    onClick={() => confirmBooking(selectedBooking.id, selectedBooking.date1, selectedBooking.time_slot1)}
                    className="px-3 py-1.5 bg-[#5B7B5E] text-white text-xs font-medium rounded-lg hover:bg-[#4A664D] w-full sm:w-auto text-center"
                  >
                    定案以此時間
                  </button>
                </div>

                {/* 順位二 */}
                {selectedBooking.date2 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-[#DCE4DC] bg-white gap-2">
                    <span className="text-xs font-medium text-[#2D3B2E]">
                      第二順位: <strong>{selectedBooking.date2} {selectedBooking.time_slot2}</strong>
                    </span>
                    <button
                      onClick={() => confirmBooking(selectedBooking.id, selectedBooking.date2!, selectedBooking.time_slot2!)}
                      className="px-3 py-1.5 bg-[#5B7B5E] text-white text-xs font-medium rounded-lg hover:bg-[#4A664D] w-full sm:w-auto text-center"
                    >
                      定案以此時間
                    </button>
                  </div>
                )}

                {/* 順位三 */}
                {selectedBooking.date3 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-[#DCE4DC] bg-white gap-2">
                    <span className="text-xs font-medium text-[#2D3B2E]">
                      第三順位: <strong>{selectedBooking.date3} {selectedBooking.time_slot3}</strong>
                    </span>
                    <button
                      onClick={() => confirmBooking(selectedBooking.id, selectedBooking.date3!, selectedBooking.time_slot3!)}
                      className="px-3 py-1.5 bg-[#5B7B5E] text-white text-xs font-medium rounded-lg hover:bg-[#4A664D] w-full sm:w-auto text-center"
                    >
                      定案以此時間
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#E2EBE2] flex justify-between gap-2">
                <button
                  onClick={() => cancelBooking(selectedBooking.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-xl hover:bg-red-100"
                >
                  取消此訂單
                </button>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-[#E8F0E8] text-[#5B7B5E] text-xs font-medium rounded-xl"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}