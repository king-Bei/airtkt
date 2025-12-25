
import React, { useState, useEffect, useMemo } from 'react';
import { User, Flight, SearchParams, FlightClass, Booking, Passenger } from './types';
import { db } from './services/db';
import { flightApi } from './services/api';
import SearchForm from './components/SearchForm';
import FlightCard from './components/FlightCard';
import AdminDashboard from './components/AdminDashboard';
import ETicket from './components/ETicket';
import PassengerForm from './components/PassengerForm';
import { Icons } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'admin' | 'my-bookings'>('home');
  const [searchResults, setSearchResults] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'time'>('price-asc');
  const [filterAirline, setFilterAirline] = useState<string>('ALL');

  const [selectionStep, setSelectionStep] = useState<'outbound' | 'return' | 'passengers'>('outbound');
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);

  const [searchParams, setSearchParams] = useState<SearchParams>({
    tripType: 'round-trip',
    origin: '',
    destination: '',
    date: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    adults: 1,
    children: 0,
    infants: 0,
    class: FlightClass.ECONOMY
  });

  useEffect(() => {
    setCurrentUser(db.getUsers().find(u => u.role === 'admin') || db.getUsers()[0]);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchParams.origin || !searchParams.destination) return alert("請輸入航點！");

    setLoading(true);
    setSearchResults([]);
    setSelectionStep('outbound');
    setOutboundFlight(null);
    setReturnFlight(null);

    try {
      const results = await flightApi.search(searchParams);
      setSearchResults(results);
    } catch (error) {
      alert("搜尋失敗");
    } finally {
      setLoading(false);
    }
  };

  const onSelectFlight = async (flight: Flight) => {
    if (searchParams.tripType === 'round-trip' && selectionStep === 'outbound') {
      setOutboundFlight(flight);
      setSelectionStep('return');
      setLoading(true);
      setSearchResults([]);
      try {
        const returnParams = { ...searchParams, origin: searchParams.destination, destination: searchParams.origin, date: searchParams.returnDate || searchParams.date };
        const results = await flightApi.search(returnParams);
        setSearchResults(results);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      } catch (error) {
        alert("回程航班獲取失敗");
      } finally {
        setLoading(false);
      }
    } else if (searchParams.tripType === 'round-trip' && selectionStep === 'return') {
      setReturnFlight(flight);
      setSelectionStep('passengers');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setOutboundFlight(flight);
      setSelectionStep('passengers');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 將搜尋結果按航班唯一性進行分組 (航司+航班號+起飛時間)
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: Flight[] } = {};
    
    searchResults.forEach(f => {
      const firstSeg = f.segments[0];
      const key = `${firstSeg.airlineCode}-${firstSeg.flightNumber}-${firstSeg.departureTime}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });

    // 每一組內部先按價格排序，讓最便宜的供應商成為主要顯示對象
    let list = Object.values(groups).map(group => {
      return group.sort((a, b) => a.totalPrice - b.totalPrice);
    });

    // 過濾航空公司
    if (filterAirline !== 'ALL') {
      list = list.filter(group => group[0].segments[0].airlineCode === filterAirline);
    }

    // 排序組
    list.sort((a, b) => {
      const bestA = a[0];
      const bestB = b[0];
      if (sortBy === 'price-asc') return bestA.totalPrice - bestB.totalPrice;
      if (sortBy === 'price-desc') return bestB.totalPrice - bestA.totalPrice;
      if (sortBy === 'time') return new Date(bestA.segments[0].departureTime).getTime() - new Date(bestB.segments[0].departureTime).getTime();
      return 0;
    });

    return list;
  }, [searchResults, sortBy, filterAirline]);

  const uniqueAirlines = useMemo(() => {
    const airlines = searchResults.map(f => ({ code: f.segments[0].airlineCode, name: f.segments[0].airline }));
    return Array.from(new Set(airlines.map(a => a.code))).map(code => airlines.find(a => a.code === code));
  }, [searchResults]);

  const handleFinalBookingSubmit = (passengers: Passenger[]) => {
    if (!currentUser || !outboundFlight) return;
    const pnr = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newBooking: Booking = {
      id: `JF-${Date.now()}`,
      pnr: pnr,
      userId: currentUser.id,
      flight: outboundFlight,
      returnFlight: returnFlight || undefined,
      passengers: passengers.map(p => ({ ...p, id: Math.random().toString(36).substr(2, 9) })),
      status: 'Pending',
      paymentStatus: 'Unpaid',
      bookingDate: new Date().toISOString(),
      totalAmount: (outboundFlight.totalPrice + (returnFlight?.totalPrice || 0)) * passengers.length
    };
    db.saveBooking(newBooking);
    alert(`訂位成功！\nPNR: ${pnr}\n系統正在處理開票中，請稍後至「我的訂位」查看。`);
    setView('my-bookings');
    setOutboundFlight(null);
    setReturnFlight(null);
    setSelectionStep('outbound');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-24 flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-[#5D2A8E] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Icons.Plane />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black text-[#5D2A8E] leading-none tracking-tighter">鑫囍探索旅行</span>
              <span className="text-[8px] md:text-[10px] font-bold text-[#E68A5C] uppercase tracking-[0.3em] mt-1">JOLLIFY TRAVEL</span>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={() => setView('home')} className={`text-[10px] font-black uppercase tracking-widest ${view === 'home' ? 'text-[#5D2A8E]' : 'text-slate-400'}`}>搜尋</button>
            <button onClick={() => setView('my-bookings')} className={`text-[10px] font-black uppercase tracking-widest ${view === 'my-bookings' ? 'text-[#5D2A8E]' : 'text-slate-400'}`}>訂位紀錄</button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => setView('admin')} className="px-4 py-2 bg-[#5D2A8E] text-white rounded-full text-[9px] font-black uppercase tracking-widest">後台管理</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        {view === 'admin' ? (
          <AdminDashboard />
        ) : view === 'my-bookings' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-[#5D2A8E] tracking-tighter italic uppercase">My Records.</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">查看您的歷史行程與電子機票</p>
            </div>
            {db.getBookings().map(b => (
               <div key={b.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-[#A5D8E6] transition-all">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#5D2A8E] group-hover:scale-110 transition-transform">
                        <Icons.Clipboard />
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-[#E68A5C] uppercase tracking-widest">PNR: {b.pnr}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>{b.status}</span>
                        </div>
                        <h4 className="text-xl font-black text-[#5D2A8E]">{b.flight.segments[0].departureAirport} → {b.flight.segments[0].arrivalAirport}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">旅客: {b.passengers[0].lastName} 等 {b.passengers.length} 位</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedBooking(b)} className="w-full md:w-auto px-10 py-4 bg-[#5D2A8E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#E68A5C] transition-all">檢視收據 / E-Ticket</button>
               </div>
            ))}
            {db.getBookings().length === 0 && <p className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest">尚無訂位紀錄</p>}
          </div>
        ) : selectionStep === 'passengers' ? (
          <div className="max-w-4xl mx-auto">
             <div className="mb-10 flex items-center gap-6">
                <button onClick={() => setSelectionStep(searchParams.tripType === 'round-trip' ? 'return' : 'outbound')} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#5D2A8E] hover:border-[#5D2A8E] transition-all shadow-sm">
                   <Icons.Plane />
                </button>
                <h2 className="text-3xl font-black text-[#5D2A8E] tracking-tighter italic uppercase">Guest Info <span className="text-[#E68A5C]">Entry.</span></h2>
             </div>
             <PassengerForm 
                outboundFlight={outboundFlight!} 
                returnFlight={returnFlight || undefined}
                adultCount={searchParams.adults}
                childCount={searchParams.children}
                infantCount={searchParams.infants}
                onSubmit={handleFinalBookingSubmit}
             />
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center px-4 animate-in fade-in duration-1000">
              <h1 className="text-4xl md:text-7xl font-black text-[#5D2A8E] tracking-tighter italic leading-none mb-6 uppercase">Travel <span className="text-[#E68A5C]">Inspired.</span></h1>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">即時搜尋 AMADEUS & SABRE 全球航網機位</p>
            </div>
            <div className="bg-white/90 backdrop-blur-md p-6 md:p-14 rounded-[3rem] shadow-2xl border border-white">
               <SearchForm searchParams={searchParams} setSearchParams={setSearchParams} onSearch={handleSearch} loading={loading} />
            </div>
            {loading ? (
              <div className="py-32 text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-[#5D2A8E] border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
                <p className="text-xl font-black text-[#5D2A8E] tracking-widest italic uppercase">正在連線 GDS 獲取最低票價...</p>
              </div>
            ) : groupedResults.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="mb-8 bg-white p-4 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">篩選航空公司:</span>
                      <select value={filterAirline} onChange={(e) => setFilterAirline(e.target.value)} className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black outline-none text-[#5D2A8E]">
                        <option value="ALL">所有航司 (All Airlines)</option>
                        {uniqueAirlines.map(a => <option key={a?.code} value={a?.code}>{a?.name}</option>)}
                      </select>
                   </div>
                   <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                      <button onClick={() => setSortBy('price-asc')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${sortBy === 'price-asc' ? 'bg-[#5D2A8E] text-white shadow-lg' : 'text-slate-400'}`}>價格最低</button>
                      <button onClick={() => setSortBy('time')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${sortBy === 'time' ? 'bg-[#5D2A8E] text-white shadow-lg' : 'text-slate-400'}`}>時間最早</button>
                   </div>
                </div>
                <div className="space-y-6 md:space-y-10">
                  {groupedResults.map((group, i) => (
                    <FlightCard key={group[0].id} flights={group} onSelect={onSelectFlight} label={selectionStep === 'outbound' ? "挑選去程" : "挑選回程並進入訂位"} highlight={i === 0 && sortBy === 'price-asc'} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
      {selectedBooking && <ETicket booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
};

export default App;
