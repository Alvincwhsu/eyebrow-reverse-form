"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('帳號或密碼錯誤');
      }

      // 簡易登入標記 (寫入 Cookie)
      document.cookie = `admin_auth=true; path=/; max-age=86400`;
      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || '登入失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFBF9] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-[#E2EBE2]">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold tracking-widest text-[#5B7B5E] uppercase bg-[#E8F0E8] px-3.5 py-1.5 rounded-full inline-block mb-3">
            Admin Portal
          </span>
          <h1 className="text-2xl font-bold text-[#2D3B2E]">預約系統管理後台</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4A574B] mb-1.5">管理者帳號</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none focus:ring-2 focus:ring-[#8BA88D]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A574B] mb-1.5">管理者密碼</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC] text-[#2D3B2E] text-sm outline-none focus:ring-2 focus:ring-[#8BA88D]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-[#5B7B5E] hover:bg-[#4A664D] text-white font-medium rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {isLoading ? '登入驗證中...' : '登入管理後台'}
          </button>
        </form>
      </div>
    </main>
  );
}