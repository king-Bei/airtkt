
import React, { useState } from 'react';
import { db } from '../services/db';
import { Booking, PricingRule, ApiCredentials, FlightClass } from '../types';
import { Icons } from '../constants';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'pricing' | 'gds'>('orders');
  const [bookings, setBookings] = useState<Booking[]>(db.getBookings());
  const [rules, setRules] = useState<PricingRule[]>(db.getPricingRules());
  const [creds, setCreds] = useState<ApiCredentials>(db.getCredentials());

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    airlineCode: '',
    flightClass: FlightClass.ECONOMY,
    markupAmount: 0,
    markupType: 'percent',
    provider: ''
  });

  const handleIssueTickets = (id: string) => {
    if (confirm('確定開票？')) {
      db.issueTickets(id);
      setBookings(db.getBookings());
    }
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('確定刪除規則？')) {
      db.deletePricingRule(id);
      setRules(db.getPricingRules());
    }
  };

  const handleAddRule = () => {
    const rule: PricingRule = {
      id: `RULE-${Date.now()}`,
      airlineCode: newRule.airlineCode?.toUpperCase() || 'DEFAULT',
      flightClass: newRule.flightClass || FlightClass.ECONOMY,
      markupAmount: Number(newRule.markupAmount) || 0,
      markupType: newRule.markupType as 'percent' | 'fixed',
      provider: newRule.provider || undefined
    };
    db.updatePricingRule(rule);
    setRules(db.getPricingRules());
    setShowAddModal(false);
    setNewRule({ airlineCode: '', flightClass: FlightClass.ECONOMY, markupAmount: 0, markupType: 'percent', provider: '' });
  };

  const handleSaveCreds = () => {
    db.saveCredentials(creds);
    alert('API 與 Bridge 配置已儲存。若遇到 "Failed to fetch" 錯誤，請確保 Bridge URL 正確且 Bridge Server 已啟動並處理 CORS。');
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[600px]">
      <div className="flex bg-slate-50/50 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'orders', label: '訂單管理', icon: <Icons.Clipboard /> },
          { id: 'pricing', label: '利潤與供應商規則', icon: <Icons.Settings /> },
          { id: 'pricing', label: '利潤與供應商規則', icon: <Icons.Settings /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[140px] py-6 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'text-[#5D2A8E] bg-white border-b-2 border-[#5D2A8E]' : 'text-slate-400 hover:bg-white/50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-10">
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4">
                  <th className="pb-4">PNR</th>
                  <th className="pb-4">來源 GDS</th>
                  <th className="pb-4">旅客</th>
                  <th className="pb-4">總額</th>
                  <th className="pb-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="py-6 font-black text-[#5D2A8E]">{b.pnr}</td>
                    <td className="py-6">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${b.flight.provider === 'Amadeus' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                        {b.flight.provider}
                      </span>
                    </td>
                    <td className="py-6 text-xs">{b.passengers[0].lastName} {b.passengers[0].firstName}</td>
                    <td className="py-6 font-black">${b.totalAmount.toLocaleString()}</td>
                    <td className="py-6 text-right">
                      {b.status === 'Pending' && <button onClick={() => handleIssueTickets(b.id)} className="bg-[#5D2A8E] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">開票</button>}
                      {b.status === 'Confirmed' && <span className="text-emerald-500 font-black text-[9px] uppercase tracking-widest">已確認</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl">
              <div>
                <h3 className="text-xl font-black italic uppercase text-[#5D2A8E]">Markup Policy.</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">您可以為不同 GDS 設定專屬的價格策略</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-[#5D2A8E] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg">新增加價規則</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rules.map(rule => (
                <div key={rule.id} className="p-8 border-2 border-slate-50 rounded-[2.5rem] hover:border-[#A5D8E6] transition-all relative bg-white group">
                  <button onClick={() => handleDeleteRule(rule.id)} className="absolute top-6 right-6 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.QrCode />
                  </button>
                  <div className="mb-4">
                    <span className={`text-[7px] font-black px-2.5 py-1 rounded-full text-white uppercase tracking-tighter ${rule.provider === 'Amadeus' ? 'bg-[#5D2A8E]' : rule.provider === 'Sabre' ? 'bg-[#E68A5C]' : 'bg-slate-300'}`}>
                      {rule.provider || '通用 (All GDS)'}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-[#5D2A8E] uppercase tracking-widest">{rule.airlineCode === 'DEFAULT' ? '不限航空公司' : `航司: ${rule.airlineCode}`}</p>
                  <p className="text-4xl font-black text-slate-900 mt-2 italic">
                    {rule.markupType === 'percent' ? `+${rule.markupAmount}%` : `+${rule.markupAmount}`}
                    <span className="text-xs font-bold text-slate-400 not-italic ml-1">{rule.markupType === 'percent' ? '' : 'TWD'}</span>
                  </p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase mt-2 tracking-widest">{rule.flightClass}</p>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h4 className="text-2xl font-black italic uppercase mb-8 text-[#5D2A8E]">Create Rule.</h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">指定供應商 GDS Provider</label>
                <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:border-[#5D2A8E] transition-all" value={newRule.provider} onChange={e => setNewRule({ ...newRule, provider: e.target.value })}>
                  <option value="">通用規則 (All Providers)</option>
                  <option value="Amadeus">僅限 Amadeus</option>
                  <option value="Sabre">僅限 Sabre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">航空公司代碼 (預設請留空)</label>
                <input type="text" placeholder="例如: BR, CI, CX" className="w-full p-5 bg-slate-50 rounded-2xl font-bold uppercase outline-none border border-transparent focus:border-[#5D2A8E] transition-all" value={newRule.airlineCode} onChange={e => setNewRule({ ...newRule, airlineCode: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">加價數值</label>
                  <input type="number" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={newRule.markupAmount} onChange={e => setNewRule({ ...newRule, markupAmount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">計算類型</label>
                  <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" value={newRule.markupType} onChange={e => setNewRule({ ...newRule, markupType: e.target.value as any })}>
                    <option value="percent">% (比例)</option>
                    <option value="fixed">TWD (固定)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest">取消</button>
                <button onClick={handleAddRule} className="flex-1 py-5 bg-[#5D2A8E] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">保存規則</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
