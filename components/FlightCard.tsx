
import React, { useState } from 'react';
import { Flight } from '../types';
import { Icons } from '../constants';

interface Props {
  flights: Flight[]; // 傳入同一航班的不同供應商報價
  onSelect: (flight: Flight) => void;
  label?: string;
  highlight?: boolean;
}

const FlightCard: React.FC<Props> = ({ flights, onSelect, label = "立即預訂", highlight = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // flights 已經由外部排序過，第一個是最低價
  const bestOffer = flights[0];
  const segments = bestOffer.segments || [];
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const stops = segments.length - 1;

  const airlineName = firstSegment.airline || "航空公司";
  const iataCode = (firstSegment.airlineCode || "XX").toUpperCase();
  const logoUrl = `https://www.gstatic.com/flights/airline_logos/70px/${iataCode}.png`;

  return (
    <div className={`group relative bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border-2 overflow-hidden transition-all duration-500 hover:shadow-xl ${highlight ? 'border-[#5D2A8E] ring-4 ring-[#5D2A8E]/5' : 'border-slate-100'}`}>
      
      {/* 最佳報價供應商標籤 */}
      <div className="absolute top-0 right-4 md:right-10 z-10">
        <div className={`text-[8px] md:text-[9px] font-black px-3 py-1.5 rounded-b-xl text-white uppercase tracking-widest ${
          bestOffer.provider === 'Amadeus' ? 'bg-[#5D2A8E]' : 
          bestOffer.provider === 'Sabre' ? 'bg-[#E68A5C]' : 'bg-slate-800'
        }`}>
          最佳價格: {bestOffer.provider}
        </div>
      </div>
      
      <div className="p-5 md:p-10">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
          
          {/* 航司資訊 */}
          <div className="flex items-center gap-4 min-w-[180px]">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center border border-slate-100 p-2 shrink-0">
              <img src={logoUrl} alt={airlineName} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-[#5D2A8E] text-base md:text-lg truncate">{airlineName}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest">{firstSegment.flightNumber} • {bestOffer.class}</p>
            </div>
          </div>

          {/* 核心時間資訊 */}
          <div className="flex-1 flex justify-between items-center w-full px-2">
            <div className="text-left">
              <p className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">
                {new Date(firstSegment.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
              <p className="text-xs md:text-sm font-black text-[#5D2A8E] mt-0.5">{firstSegment.departureAirport}</p>
            </div>
            
            <div className="flex-1 px-4 md:px-8 flex flex-col items-center">
              <span className="text-[8px] md:text-[10px] font-black text-[#E68A5C] uppercase mb-1">航程 {firstSegment.duration}</span>
              <div className="w-full h-px bg-slate-200 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                   <Icons.Plane />
                </div>
              </div>
              <span className={`text-[9px] mt-2 font-black ${stops === 0 ? 'text-emerald-500' : 'text-[#E68A5C]'}`}>
                {stops === 0 ? '直飛' : `轉機 ${stops} 次`}
              </span>
            </div>

            <div className="text-right">
              <p className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter">
                {new Date(lastSegment.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
              <p className="text-xs md:text-sm font-black text-[#5D2A8E] mt-0.5">{lastSegment.arrivalAirport}</p>
            </div>
          </div>

          {/* 價格與供應商比較區塊 */}
          <div className="text-right min-w-[150px] lg:pl-8 lg:border-l border-slate-100 flex flex-col justify-center items-end gap-2">
            <div>
              <p className="text-xl md:text-3xl font-black text-[#5D2A8E] tracking-tighter italic">
                <span className="text-xs font-bold mr-1 italic">TWD</span>{bestOffer.totalPrice.toLocaleString()}
              </p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">最佳來源: {bestOffer.provider}</p>
            </div>
            
            {/* 如果有多個供應商，顯示迷你比較列表 */}
            {flights.length > 1 && (
              <div className="flex flex-col gap-1 items-end w-full mt-2">
                 <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">多方報價比較:</p>
                 {flights.map(f => (
                   <div key={f.id} className="flex items-center gap-2 group/price cursor-pointer" onClick={() => onSelect(f)}>
                      <span className={`text-[8px] font-black uppercase ${f.provider === bestOffer.provider ? 'text-[#5D2A8E]' : 'text-slate-400'}`}>{f.provider}</span>
                      <span className="text-[10px] font-bold text-slate-700">TWD {f.totalPrice.toLocaleString()}</span>
                      <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center opacity-0 group-hover/price:opacity-100 transition-opacity">
                         <Icons.Check />
                      </div>
                   </div>
                 ))}
              </div>
            )}

            <button 
              onClick={() => onSelect(bestOffer)} 
              className="mt-2 bg-[#5D2A8E] hover:bg-[#E68A5C] text-white font-black py-2.5 md:py-3.5 px-6 md:px-8 rounded-xl text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              {label}
            </button>
          </div>
        </div>

        <button 
          onClick={() => setShowDetails(!showDetails)} 
          className="w-full mt-6 md:mt-10 pt-4 md:pt-6 border-t border-slate-50 text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[#5D2A8E] transition-colors"
        >
          {showDetails ? '隱藏詳細內容' : '查看完整比價與行程細節'}
          <svg className={`w-3 h-3 transition-transform duration-500 ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7"/></svg>
        </button>

        {showDetails && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-top-4">
             <div className="lg:col-span-2 space-y-6">
                <h4 className="text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest border-b pb-2">航段詳細資訊 Detail</h4>
                {segments.map((s, i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                     <div className="w-2 h-2 rounded-full bg-[#E68A5C] mt-1.5 shrink-0"></div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                           <p className="text-sm font-black text-slate-900">{s.departureAirport} → {s.arrivalAirport}</p>
                           <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{s.duration}</p>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(s.departureTime).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-black text-[#5D2A8E] mt-1 uppercase tracking-widest">{s.airline} • {s.flightNumber}</p>
                     </div>
                  </div>
                ))}

                {/* 供應商完整比價清單 */}
                {flights.length > 1 && (
                  <div className="mt-10 pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-[#E68A5C] uppercase tracking-widest mb-4">GDS 跨系統比價清單 Full Comparison</h4>
                    <div className="space-y-3">
                       {flights.map((f, i) => (
                         <div key={f.id} className={`flex justify-between items-center p-4 rounded-2xl border ${i === 0 ? 'bg-[#5D2A8E]/5 border-[#5D2A8E]/20' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase text-white ${f.provider === 'Amadeus' ? 'bg-[#5D2A8E]' : f.provider === 'Sabre' ? 'bg-[#E68A5C]' : 'bg-slate-400'}`}>
                                 {f.provider}
                               </span>
                               {i === 0 && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">市場最低價</span>}
                            </div>
                            <div className="flex items-center gap-6">
                               <p className="text-lg font-black text-slate-900 italic"><span className="text-[10px] mr-1">TWD</span>{f.totalPrice.toLocaleString()}</p>
                               <button onClick={() => onSelect(f)} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5D2A8E] hover:text-white transition-all">選擇此方案</button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
             </div>
             <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100 h-fit">
                <h4 className="text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest border-b pb-2 mb-4">行李與退改規則 Policy</h4>
                <ul className="space-y-3 text-[10px] font-bold text-slate-500">
                   <li className="flex justify-between"><span>客艙等級</span><span className="text-[#5D2A8E]">{bestOffer.class}</span></li>
                   <li className="flex justify-between"><span>免費行李額</span><span className="text-[#5D2A8E]">{bestOffer.baggageAllowance}</span></li>
                   <li className="flex justify-between"><span>退票規定</span><span className="text-[#E68A5C]">依航空公司規定</span></li>
                   <li className="flex justify-between"><span>改票規定</span><span className="text-[#E68A5C]">請洽客服專員</span></li>
                   <li className="pt-4 mt-4 border-t border-slate-200">
                      <p className="text-[8px] text-slate-400 italic">※ 以上資訊基於 {bestOffer.provider} 連線獲取，開票時以最終確認為準。</p>
                   </li>
                </ul>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightCard;
