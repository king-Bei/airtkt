
import React, { useState, useRef, useEffect } from 'react';
import { SearchParams, FlightClass, TripType } from '../types';
import { Icons, COLORS } from '../constants';

interface Props {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  onSearch: (e: React.FormEvent) => void;
  loading: boolean;
}

const SearchForm: React.FC<Props> = ({ searchParams, setSearchParams, onSearch, loading }) => {
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const swapLocations = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchParams({
      ...searchParams,
      origin: searchParams.destination,
      destination: searchParams.origin
    });
  };

  const updateCount = (field: 'adults' | 'children' | 'infants', delta: number) => {
    const min = field === 'adults' ? 1 : 0;
    const newVal = Math.max(min, (searchParams[field] || 0) + delta);
    setSearchParams({ ...searchParams, [field]: newVal });
  };

  const totalPassengers = searchParams.adults + searchParams.children + searchParams.infants;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* 行程類型切換 - 優化手機版尺寸 */}
      <div className="flex gap-2 mb-6 md:mb-8 justify-center md:justify-start">
        {(['one-way', 'round-trip'] as TripType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSearchParams({ ...searchParams, tripType: type })}
            className={`px-4 md:px-10 py-2 md:py-3 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all ${
              searchParams.tripType === type 
                ? 'bg-[#5D2A8E] text-white shadow-xl scale-105' 
                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {type === 'round-trip' ? '來回 Round Trip' : '單程 One Way'}
          </button>
        ))}
      </div>

      <form onSubmit={onSearch} className="relative z-30">
        <div className="flex flex-col lg:flex-row bg-slate-50/80 p-2 md:p-3 rounded-2xl md:rounded-[3rem] items-stretch gap-2 md:gap-3 border border-slate-200 shadow-inner">
          
          {/* 出發地與目的地 */}
          <div className="flex-[1.5] flex flex-col sm:flex-row gap-2 md:gap-3 relative">
            <div className="flex-1 relative bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 focus-within:border-[#5D2A8E] transition-all shadow-sm">
              <span className="absolute left-4 md:left-6 top-3 md:top-4 text-[8px] md:text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest">出發 Origin</span>
              <input
                type="text" placeholder="例如: TPE" required
                className="w-full pl-4 md:pl-6 pr-4 pt-8 md:pt-10 pb-4 md:pb-5 outline-none font-bold text-slate-800 uppercase bg-transparent text-base md:text-lg"
                value={searchParams.origin}
                onChange={e => setSearchParams({ ...searchParams, origin: e.target.value.toUpperCase() })}
              />
            </div>

            <button
              type="button" onClick={swapLocations}
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-40 w-8 h-8 md:w-12 md:h-12 bg-white border border-[#A5D8E6] rounded-full flex items-center justify-center text-[#E68A5C] hover:scale-110 active:scale-90 transition-all shadow-lg group"
            >
              <svg className="w-4 h-4 md:w-6 h-6 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </button>

            <div className="flex-1 relative bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 focus-within:border-[#5D2A8E] transition-all shadow-sm">
              <span className="absolute left-4 md:left-6 top-3 md:top-4 text-[8px] md:text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest">目的地 Dest.</span>
              <input
                type="text" placeholder="例如: LAX" required
                className="w-full pl-4 md:pl-6 pr-4 pt-8 md:pt-10 pb-4 md:pb-5 outline-none font-bold text-slate-800 uppercase bg-transparent text-base md:text-lg"
                value={searchParams.destination}
                onChange={e => setSearchParams({ ...searchParams, destination: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          {/* 日期選擇 - 手機版垂直堆疊 */}
          <div className="flex-1 flex flex-col sm:flex-row gap-2 md:gap-3">
            <div className="flex-1 relative bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 focus-within:border-[#5D2A8E] transition-all shadow-sm">
              <span className="absolute left-4 md:left-6 top-3 md:top-4 text-[8px] md:text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest">出發日期</span>
              <input
                type="date" required
                className="w-full px-4 md:px-6 pt-8 md:pt-10 pb-4 md:pb-5 outline-none font-bold text-slate-800 text-sm md:text-base bg-transparent"
                value={searchParams.date}
                onChange={e => setSearchParams({ ...searchParams, date: e.target.value })}
              />
            </div>
            {searchParams.tripType === 'round-trip' && (
              <div className="flex-1 relative bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 focus-within:border-[#5D2A8E] transition-all shadow-sm">
                <span className="absolute left-4 md:left-6 top-3 md:top-4 text-[8px] md:text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest">回程日期</span>
                <input
                  type="date" required
                  className="w-full px-4 md:px-6 pt-8 md:pt-10 pb-4 md:pb-5 outline-none font-bold text-slate-800 text-sm md:text-base bg-transparent"
                  value={searchParams.returnDate}
                  onChange={e => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* 乘客人數與艙等 */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
              className="w-full h-full min-h-[64px] bg-white rounded-2xl md:rounded-3xl px-4 md:px-6 pt-8 md:pt-10 pb-4 md:pb-5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between border border-slate-200 focus:border-[#5D2A8E] shadow-sm"
            >
              <div>
                <span className="absolute left-4 md:left-6 top-3 md:top-4 text-[8px] md:text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest">旅客人數/艙等</span>
                <span className="text-sm md:text-base font-black text-slate-800">
                  {totalPassengers}位, {
                    searchParams.class === FlightClass.ECONOMY ? '經濟艙' : 
                    searchParams.class === FlightClass.BUSINESS ? '商務艙' : 
                    searchParams.class === FlightClass.FIRST ? '頭等艙' : '豪經艙'
                  }
                </span>
              </div>
              <svg className={`w-4 h-4 text-[#A5D8E6] transition-transform ${showPassengerDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
            </button>

            {showPassengerDropdown && (
              <div className="absolute right-0 top-[110%] w-full sm:w-[360px] bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 md:p-10 z-[100] animate-in slide-in-from-top-2">
                <div className="space-y-6 md:space-y-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm md:text-base font-black text-[#5D2A8E]">成人 (12歲+)</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Adults</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => updateCount('adults', -1)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#5D2A8E] hover:text-white transition-all">-</button>
                      <span className="text-base font-black w-4 text-center">{searchParams.adults}</span>
                      <button type="button" onClick={() => updateCount('adults', 1)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#5D2A8E] hover:text-white transition-all">+</button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm md:text-base font-black text-[#5D2A8E]">兒童 (2-11歲)</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Children</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => updateCount('children', -1)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#5D2A8E] hover:text-white transition-all">-</button>
                      <span className="text-base font-black w-4 text-center">{searchParams.children}</span>
                      <button type="button" onClick={() => updateCount('children', 1)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#5D2A8E] hover:text-white transition-all">+</button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-black text-[#E68A5C] uppercase tracking-widest mb-4">艙等 Cabin Class</p>
                   <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: FlightClass.ECONOMY, label: '經濟艙' },
                        { key: FlightClass.BUSINESS, label: '商務艙' },
                        { key: FlightClass.FIRST, label: '頭等艙' }
                      ].map(c => (
                        <button
                          key={c.key} type="button"
                          onClick={() => setSearchParams({ ...searchParams, class: c.key })}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                            searchParams.class === c.key ? 'bg-[#5D2A8E] text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                   </div>
                </div>
                
                <button 
                  type="button" onClick={() => setShowPassengerDropdown(false)} 
                  className="w-full mt-8 bg-[#5D2A8E] text-white py-4 rounded-xl font-black uppercase text-[11px] tracking-widest hover:shadow-xl transition-all"
                >
                  確認旅伴資訊
                </button>
              </div>
            )}
          </div>

          <button
            type="submit" disabled={loading}
            className="flex-[0.4] min-h-[64px] bg-[#E68A5C] hover:bg-[#d4784a] text-white font-black rounded-2xl md:rounded-[2rem] transition-all flex items-center justify-center gap-3 md:gap-4 uppercase tracking-[0.2em] text-[12px] md:text-[14px] shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Icons.Search />
                <span>立即查詢</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
