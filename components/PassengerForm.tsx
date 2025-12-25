
import React, { useState } from 'react';
import { Flight, Passenger } from '../types';
import { Icons } from '../constants';

interface Props {
  outboundFlight: Flight;
  returnFlight?: Flight;
  adultCount: number;
  childCount: number;
  infantCount: number;
  onSubmit: (passengers: Passenger[]) => void;
}

const PassengerForm: React.FC<Props> = ({ outboundFlight, returnFlight, adultCount, childCount, infantCount, onSubmit }) => {
  const totalPassengers = adultCount + childCount + infantCount;
  
  // Fix: Added missing 'id' property to initial passenger state
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: totalPassengers }).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      firstName: '',
      lastName: '',
      passport: '',
      birthDate: '', // 新欄位
      gender: 'M',    // 新欄位
      email: '',
      phone: ''
    }))
  );

  const handleInputChange = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passengers.some(p => !p.firstName || !p.lastName || !p.passport || !p.birthDate)) {
      alert("請完整填寫所有旅客的姓名、護照號碼與出生日期。");
      return;
    }
    onSubmit(passengers);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in slide-in-from-bottom-8 duration-700 pb-12 px-1">
      
      {/* 行程總覽摘要 */}
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 shadow-xl border border-slate-100">
         <h3 className="text-[9px] md:text-[11px] font-black text-[#5D2A8E] uppercase tracking-[0.3em] mb-4 md:mb-8 border-b border-slate-100 pb-4">行程總覽 Summary</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
            <div className="flex gap-4 md:gap-6 items-start">
               <div className="w-9 h-9 md:w-12 md:h-12 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <Icons.Plane />
               </div>
               <div>
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">去程 Outbound</p>
                  <p className="text-base md:text-xl font-black text-[#5D2A8E] uppercase">{outboundFlight.segments[0].departureAirport} → {outboundFlight.segments[0].arrivalAirport}</p>
                  <p className="text-[9px] md:text-xs font-bold text-slate-500 mt-1 uppercase">
                    {new Date(outboundFlight.segments[0].departureTime).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} • {outboundFlight.segments[0].airline}
                  </p>
               </div>
            </div>
            {returnFlight && (
              <div className="flex gap-4 md:gap-6 items-start">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                   <Icons.Plane />
                </div>
                <div>
                   <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">回程 Return</p>
                   <p className="text-base md:text-xl font-black text-[#5D2A8E] uppercase">{returnFlight.segments[0].departureAirport} → {returnFlight.segments[0].arrivalAirport}</p>
                   <p className="text-[9px] md:text-xs font-bold text-slate-500 mt-1 uppercase">
                     {new Date(returnFlight.segments[0].departureTime).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} • {returnFlight.segments[0].airline}
                   </p>
                </div>
              </div>
            )}
         </div>
         
         <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400">
               <span>{adultCount} 成人</span>
               {childCount > 0 && <span>{childCount} 兒童</span>}
               {infantCount > 0 && <span>{infantCount} 嬰兒</span>}
            </div>
            <div className="text-center md:text-right">
               <span className="text-[10px] font-black text-slate-400 uppercase mr-3">預估總額</span>
               <span className="text-2xl md:text-4xl font-black text-[#5D2A8E] tracking-tighter italic">
                  TWD {(outboundFlight.totalPrice + (returnFlight?.totalPrice || 0)).toLocaleString()}
               </span>
            </div>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-8">
        {passengers.map((p, i) => (
          <div key={i} className="bg-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 shadow-lg border border-slate-100">
             <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="w-7 h-7 md:w-9 md:h-9 bg-[#5D2A8E]/10 rounded-full flex items-center justify-center text-[#5D2A8E] font-black text-[10px] md:text-xs shrink-0">
                   {i + 1}
                </div>
                <h3 className="text-sm md:text-base font-black text-[#5D2A8E] uppercase tracking-widest flex items-baseline">
                  旅客 {i + 1} <span className="text-[8px] md:text-[9px] text-slate-400 font-bold lowercase ml-2">({i < adultCount ? '成人' : (i < adultCount + childCount ? '兒童' : '嬰兒')})</span>
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="relative bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-[#5D2A8E] transition-all">
                   <span className="absolute left-4 md:left-6 top-2 md:top-3 text-[7px] md:text-[9px] font-black text-[#5D2A8E] uppercase tracking-widest leading-none">姓氏 (如: WANG)</span>
                   <input
                     type="text" required placeholder="Surname"
                     className="w-full pl-4 md:pl-6 pr-4 pt-6 md:pt-8 pb-3 md:pb-4 outline-none font-bold text-slate-800 uppercase bg-transparent text-sm md:text-base"
                     value={p.lastName}
                     onChange={e => handleInputChange(i, 'lastName', e.target.value.toUpperCase())}
                   />
                </div>
                <div className="relative bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-[#5D2A8E] transition-all">
                   <span className="absolute left-4 md:left-6 top-2 md:top-3 text-[7px] md:text-[9px] font-black text-[#5D2A8E] uppercase tracking-widest leading-none">名字 (如: XIAOMING)</span>
                   <input
                     type="text" required placeholder="Given Name"
                     className="w-full pl-4 md:pl-6 pr-4 pt-6 md:pt-8 pb-3 md:pb-4 outline-none font-bold text-slate-800 uppercase bg-transparent text-sm md:text-base"
                     value={p.firstName}
                     onChange={e => handleInputChange(i, 'firstName', e.target.value.toUpperCase())}
                   />
                </div>
                <div className="relative bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-[#5D2A8E] transition-all">
                   <span className="absolute left-4 md:left-6 top-2 md:top-3 text-[7px] md:text-[9px] font-black text-[#5D2A8E] uppercase tracking-widest leading-none">性別 Gender</span>
                   <select
                     className="w-full pl-4 md:pl-6 pr-4 pt-6 md:pt-8 pb-3 md:pb-4 outline-none font-bold text-slate-800 uppercase bg-transparent text-sm md:text-base appearance-none cursor-pointer"
                     value={p.gender}
                     onChange={e => handleInputChange(i, 'gender', e.target.value as 'M' | 'F')}
                   >
                     <option value="M">男 Male</option>
                     <option value="F">女 Female</option>
                   </select>
                </div>
                <div className="relative bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-[#5D2A8E] transition-all">
                   <span className="absolute left-4 md:left-6 top-2 md:top-3 text-[7px] md:text-[9px] font-black text-[#5D2A8E] uppercase tracking-widest leading-none">出生日期 Birth Date</span>
                   <input
                     type="date" required
                     className="w-full pl-4 md:pl-6 pr-4 pt-6 md:pt-8 pb-3 md:pb-4 outline-none font-bold text-slate-800 bg-transparent text-sm md:text-base"
                     value={p.birthDate}
                     onChange={e => handleInputChange(i, 'birthDate', e.target.value)}
                   />
                </div>
                <div className="relative bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-[#5D2A8E] transition-all">
                   <span className="absolute left-4 md:left-6 top-2 md:top-3 text-[7px] md:text-[9px] font-black text-[#5D2A8E] uppercase tracking-widest leading-none">護照號碼 Passport No.</span>
                   <input
                     type="text" required placeholder="證件號碼"
                     className="w-full pl-4 md:pl-6 pr-4 pt-6 md:pt-8 pb-3 md:pb-4 outline-none font-bold text-slate-800 uppercase bg-transparent text-sm md:text-base"
                     value={p.passport}
                     onChange={e => handleInputChange(i, 'passport', e.target.value.toUpperCase())}
                   />
                </div>
                {i === 0 && (
                  <div className="relative bg-slate-50 rounded-xl md:rounded-2xl border border-slate-200 focus-within:border-[#5D2A8E] transition-all">
                     <span className="absolute left-4 md:left-6 top-2 md:top-3 text-[7px] md:text-[9px] font-black text-[#5D2A8E] uppercase tracking-widest leading-none">聯絡信箱 Email</span>
                     <input
                       type="email" required placeholder="接收憑證用"
                       className="w-full pl-4 md:pl-6 pr-4 pt-6 md:pt-8 pb-3 md:pb-4 outline-none font-bold text-slate-800 bg-transparent text-sm md:text-base"
                       value={p.email}
                       onChange={e => handleInputChange(i, 'email', e.target.value)}
                     />
                  </div>
                )}
             </div>
          </div>
        ))}

        <div className="bg-[#A5D8E6]/20 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-[#A5D8E6]/50 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-inner">
           <div className="flex gap-4 items-center">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-[#E68A5C] shadow-lg shrink-0">
                 <Icons.Check />
              </div>
              <p className="text-[9px] md:text-xs font-bold text-slate-500 leading-relaxed uppercase">
                確認訂位代表您已核對拼音與護照資訊正確。<br className="hidden md:block" />
                提交後將發送訂位請求至 GDS。
              </p>
           </div>
           <button 
              type="submit"
              className="w-full lg:w-auto px-8 md:px-16 py-4 md:py-6 bg-[#E68A5C] hover:bg-[#d4784a] text-white font-black rounded-xl md:rounded-3xl text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
           >
              提交訂位請求
           </button>
        </div>
      </form>
    </div>
  );
};

export default PassengerForm;
