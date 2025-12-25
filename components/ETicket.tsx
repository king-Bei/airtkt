
import React from 'react';
import { Booking, Flight, Passenger } from '../types';
import { Icons } from '../constants';

interface Props {
  booking: Booking;
  onClose: () => void;
}

const ETicket: React.FC<Props> = ({ booking, onClose }) => {
  const { flight, passengers, returnFlight, status } = booking;
  const isConfirmed = status === 'Confirmed';
  
  // 模擬為每位旅客生成獨立票號 (基於 Amadeus/Sabre 模型)
  const getTicketNumber = (index: number) => {
    if (!isConfirmed) return '尚未開票 / NOT ISSUED';
    const seed = booking.id.length + index;
    return `297-${Math.floor(1000000000 + (seed * 1234567) % 9000000000)}`;
  };

  const issuingDate = new Date(booking.bookingDate).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const FlightRow = ({ f, type }: { f: Flight, type: string }) => {
    const s = f.segments[0];
    return (
      <tr className="border-b border-slate-100 text-[10px] md:text-[11px]">
        <td className="py-3 md:py-4 font-black text-[#5D2A8E]">{type === 'OUTBOUND' ? '去程' : '回程'}</td>
        <td className="py-3 md:py-4">
          <p className="font-black text-slate-800">{s.airlineCode} {s.flightNumber}</p>
          <p className="text-[9px] text-slate-400 uppercase">{s.airline}</p>
        </td>
        <td className="py-3 md:py-4">
          <p className="font-black text-slate-800">{s.departureAirport}</p>
          <p className="text-[9px] text-slate-400">航廈 {s.departureTerminal || '1'}</p>
        </td>
        <td className="py-3 md:py-4">
          <p className="font-black text-slate-800">{s.arrivalAirport}</p>
          <p className="text-[9px] text-slate-400">航廈 {s.arrivalTerminal || '1'}</p>
        </td>
        <td className="py-3 md:py-4">
          <p className="font-black text-slate-800">{new Date(s.departureTime).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}</p>
          <p className="text-[9px] text-slate-400">{new Date(s.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
        </td>
        <td className={`py-3 md:py-4 font-black italic ${isConfirmed ? 'text-emerald-600' : 'text-amber-600'}`}>
          {isConfirmed ? 'OK' : 'HOLD'}
        </td>
        <td className="py-3 md:py-4 font-bold text-slate-500">{f.class.substring(0, 1)}</td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative my-8">
        
        {/* 機票頂部 */}
        <div className="bg-[#5D2A8E] p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Icons.Plane />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">{isConfirmed ? '電子機票收據' : '訂位行程確認單'}</h1>
              <p className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-widest mt-1">Passenger Itinerary & Receipt</p>
            </div>
          </div>
          <div className="text-center md:text-right border-t md:border-t-0 border-white/10 pt-4 md:pt-0 w-full md:w-auto">
             <p className="text-xs font-black uppercase tracking-widest text-[#E68A5C]">訂位代號 PNR: {booking.pnr}</p>
             <p className="text-[10px] text-white/40 mt-1">開票日期: {issuingDate}</p>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          {/* 旅客清單 - 解決兩位旅客只出現一個的問題 */}
          <div>
            <h3 className="text-xs font-black text-[#5D2A8E] uppercase tracking-[0.2em] mb-4 border-b pb-2">旅客資料明細 Passenger Information</h3>
            <div className="grid grid-cols-1 gap-3">
              {passengers.map((p, idx) => (
                <div key={idx} className="flex flex-col md:flex-row bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                   <div className="p-4 md:w-1/4 border-b md:border-b-0 md:border-r border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">旅客姓名 Name</p>
                      <p className="text-sm font-black text-[#5D2A8E]">{p.lastName} / {p.firstName}</p>
                   </div>
                   <div className="p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">機票號碼 Ticket Number</p>
                      <p className="text-sm font-bold text-slate-700 font-mono">{getTicketNumber(idx)}</p>
                   </div>
                   <div className="p-4 md:w-1/4 border-b md:border-b-0 md:border-r border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">性別/生日 Info</p>
                      <p className="text-sm font-bold text-slate-600">{p.gender === 'M' ? '男 Male' : '女 Female'} • {p.birthDate}</p>
                   </div>
                   <div className="p-4 md:flex-1 bg-white/50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">證件 Passport</p>
                      <p className="text-sm font-bold text-slate-600">{p.passport}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* 航班行程 */}
          <div className="overflow-x-auto">
            <h3 className="text-xs font-black text-[#5D2A8E] uppercase tracking-[0.2em] mb-4 border-b pb-2">航班行程明細 Flight Itinerary</h3>
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="pb-3">航段</th>
                  <th className="pb-3">航班</th>
                  <th className="pb-3">出發</th>
                  <th className="pb-3">到達</th>
                  <th className="pb-3">日期/時間</th>
                  <th className="pb-3">狀態</th>
                  <th className="pb-3">艙等</th>
                </tr>
              </thead>
              <tbody>
                <FlightRow f={flight} type="OUTBOUND" />
                {returnFlight && <FlightRow f={returnFlight} type="RETURN" />}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="text-[10px] text-slate-400 font-bold leading-relaxed">
                <p>注意事項：</p>
                <p>1. 旅客請務必確認護照有效期需滿 6 個月以上。</p>
                <p>2. 建議於起飛前 3 小時抵達機場辦理登機手續。</p>
                <p>3. 本憑證由 鑫囍探索旅行 JOLLIFY TRAVEL 提供。</p>
             </div>
             <div className="text-right">
                <p className="text-xs font-black text-slate-400 uppercase">總計金額 Total Amount</p>
                <p className="text-3xl font-black text-[#5D2A8E] tracking-tighter italic">TWD {booking.totalAmount.toLocaleString()}</p>
             </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-900 flex justify-end gap-3">
          <button className="px-6 py-3 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
            <Icons.Print /> 列印機票
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-white text-slate-900 text-xs font-black uppercase tracking-widest transition-all">
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};

export default ETicket;
