
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
// Fix: Corrected import member name from AirlinePricingRule to PricingRule
import { PricingRule, FlightClass, Booking } from '../types';

const AdminPanel: React.FC = () => {
  // Fix: Use PricingRule instead of non-existent AirlinePricingRule
  const [rules, setRules] = useState<PricingRule[]>(db.getPricingRules());
  const [bookings, setBookings] = useState<Booking[]>(db.getBookings());
  const [activeTab, setActiveTab] = useState<'pricing' | 'bookings'>('pricing');
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    airlineCode: '',
    flightClass: FlightClass.ECONOMY,
    markupAmount: 0,
    markupType: 'percent'
  });

  const handleAddRule = () => {
    if (!newRule.airlineCode) return;
    // Fix: Use PricingRule instead of non-existent AirlinePricingRule
    const rule: PricingRule = {
      id: Math.random().toString(36).substr(2, 9),
      airlineCode: newRule.airlineCode.toUpperCase(),
      flightClass: newRule.flightClass || FlightClass.ECONOMY,
      markupAmount: newRule.markupAmount || 0,
      markupType: (newRule.markupType as 'percent' | 'fixed') || 'percent'
    };
    // Fix: Used updatePricingRule instead of non-existent savePricingRule
    db.updatePricingRule(rule);
    setRules(db.getPricingRules());
    setNewRule({ airlineCode: '', flightClass: FlightClass.ECONOMY, markupAmount: 0, markupType: 'percent' });
  };

  const handleDeleteRule = (id: string) => {
    // Fix: Used deletePricingRule (now implemented in db.ts)
    db.deletePricingRule(id);
    setRules(db.getPricingRules());
  };

  const handleConfirmBooking = (id: string) => {
    // Fix: Find existing booking and update status via db.updateBooking
    const b = bookings.find(x => x.id === id);
    if (b) {
      db.updateBooking({ ...b, status: 'Confirmed' });
      setBookings(db.getBookings());
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-3">
          <div className="list-group shadow-sm">
            <button 
              onClick={() => setActiveTab('pricing')}
              className={`list-group-item list-group-item-action font-weight-bold ${activeTab === 'pricing' ? 'active bg-dark' : ''}`}
            >
              報價策略設定
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`list-group-item list-group-item-action font-weight-bold ${activeTab === 'bookings' ? 'active bg-dark' : ''}`}
            >
              訂單審核中心
            </button>
          </div>
        </div>

        <div className="col-md-9">
          {activeTab === 'pricing' ? (
            <div className="card shadow-sm border-0 rounded-lg">
              <div className="card-header bg-white border-0 pt-4 px-4">
                <h5 className="font-weight-black m-0">航司與艙等加價管理</h5>
              </div>
              <div className="card-body px-4">
                <div className="row mb-4 align-items-end bg-light p-3 rounded mx-0">
                  <div className="col-md-3">
                    <label className="small font-weight-bold">航空公司代碼 (IATA)</label>
                    <input 
                      type="text" className="form-control" placeholder="如: BR, CI" 
                      value={newRule.airlineCode}
                      onChange={e => setNewRule({...newRule, airlineCode: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="small font-weight-bold">套用艙等</label>
                    <select 
                      className="form-control"
                      value={newRule.flightClass}
                      onChange={e => setNewRule({...newRule, flightClass: e.target.value as FlightClass})}
                    >
                      {Object.values(FlightClass).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="small font-weight-bold">加價數值</label>
                    <input 
                      type="number" className="form-control" 
                      value={newRule.markupAmount}
                      onChange={e => setNewRule({...newRule, markupAmount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="small font-weight-bold">類型</label>
                    <select 
                      className="form-control"
                      value={newRule.markupType}
                      onChange={e => setNewRule({...newRule, markupType: e.target.value as 'percent' | 'fixed'})}
                    >
                      <option value="percent">% (比例)</option>
                      <option value="fixed">$ (固定金額)</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button onClick={handleAddRule} className="btn btn-dark btn-block font-weight-bold">新增規則</button>
                  </div>
                </div>

                <table className="table table-hover">
                  <thead className="thead-light">
                    <tr>
                      <th>航空公司</th>
                      <th>艙等</th>
                      <th>加價幅度</th>
                      <th className="text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => (
                      <tr key={rule.id}>
                        <td className="font-weight-bold">{rule.airlineCode === 'DEFAULT' ? '預設 (所有航司)' : rule.airlineCode}</td>
                        <td>{rule.flightClass}</td>
                        <td className="text-primary font-weight-bold">
                          {rule.markupType === 'percent' ? `+${rule.markupAmount}%` : `+$${rule.markupAmount}`}
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0 rounded-lg">
              <div className="card-header bg-white border-0 pt-4 px-4">
                <h5 className="font-weight-black m-0">後端預訂明細</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>訂單號</th>
                        <th>旅客</th>
                        <th>航班</th>
                        <th>總額 (已稅)</th>
                        <th>狀態</th>
                        <th>管理</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-5 text-muted">目前暫無預訂紀錄</td></tr>
                      ) : (
                        bookings.map(b => (
                          <tr key={b.id}>
                            <td className="font-weight-bold">{b.id}</td>
                            <td>{b.passengers[0].lastName}, {b.passengers[0].firstName}</td>
                            <td>{b.flight.segments[0].airlineCode} {b.flight.segments[0].flightNumber}</td>
                            {/* Fix: Changed totalPaid to totalAmount */}
                            <td className="font-weight-bold text-success">${b.totalAmount.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                {b.status === 'Confirmed' ? '已確認開票' : '待處理'}
                              </span>
                            </td>
                            <td>
                              {b.status === 'Pending' && (
                                <button 
                                  onClick={() => handleConfirmBooking(b.id)}
                                  className="btn btn-sm btn-dark"
                                >
                                  確認開票
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
