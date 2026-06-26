/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransferById } from '../../services/api';
import { fmt } from '../../utils/format';

const DOT_COLOR = {
  RECEIVED: '#00d4ff',
  RESERVED: '#9c88ff',
  COMMITTED: '#00e5a0',
  FAILED: '#ff4757',
  TIMEOUT: '#ffd32a',
  ABORTED: '#ff4757',
  CANCELLED: '#ffd32a',
};

export default function TransferDetail() {
  const { transferId } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransferById(transferId)
      .then((r) => setTransfer(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [transferId]);

  if (loading)
    return (
      <div className='loading-screen'>
        <div className='spinner' /> Loading transfer...
      </div>
    );
  if (!transfer)
    return <div className='loading-screen'>Transfer not found.</div>;

  return (
    <div>
      <div className='page-header'>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className='btn btn-secondary'
              style={{ padding: '5px 10px' }}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <div className='page-title'>Transfer Detail</div>
            <span className={`badge ${transfer.status}`}>
              {transfer.status}
            </span>
          </div>
          <div className='page-subtitle mono' style={{ marginTop: 4 }}>
            {transfer.transfer_id}
          </div>
        </div>
      </div>

      <div className='page-content'>
        <div className='grid-2' style={{ marginBottom: 16 }}>
          {/* Main Info */}
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>Transfer Info</span>
            </div>
            <div>
              <div className='detail-row'>
                <span className='detail-key'>Transfer ID</span>
                <span className='detail-value text-accent'>
                  {transfer.transfer_id}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Transaction ID</span>
                <span className='detail-value'>
                  {transfer.transaction_id || '—'}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Quote ID</span>
                <span className='detail-value'>{transfer.quote_id || '—'}</span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Amount</span>
                <span
                  className='detail-value text-green'
                  style={{ fontSize: 16, fontWeight: 700 }}
                >
                  {fmt.amount(transfer.amount, transfer.currency)}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Payer FSP</span>
                <span className='detail-value'>
                  {transfer.payer_fsp || '—'}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Payee FSP</span>
                <span className='detail-value'>
                  {transfer.payee_fsp || '—'}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Expiration</span>
                <span className='detail-value'>
                  {fmt.datetime(transfer.expiration)}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Completed At</span>
                <span className='detail-value'>
                  {fmt.datetime(transfer.completed_at)}
                </span>
              </div>
              <div className='detail-row'>
                <span className='detail-key'>Created At</span>
                <span className='detail-value'>
                  {fmt.datetime(transfer.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Error / Fulfil Info */}
          <div className='card'>
            <div className='card-header'>
              <span className='card-title'>
                {transfer.status === 'COMMITTED'
                  ? 'Fulfilment Info'
                  : 'Error Info'}
              </span>
            </div>
            <div>
              {transfer.status === 'COMMITTED' ? (
                <>
                  <div className='detail-row'>
                    <span className='detail-key'>Fulfilment</span>
                    <span
                      className='detail-value'
                      style={{ fontSize: 10, wordBreak: 'break-all' }}
                    >
                      {transfer.fulfilment || '—'}
                    </span>
                  </div>
                  <div className='detail-row'>
                    <span className='detail-key'>ILP Packet</span>
                    <span
                      className='detail-value'
                      style={{
                        fontSize: 10,
                        wordBreak: 'break-all',
                        maxWidth: 260,
                      }}
                    >
                      {transfer.ilp_packet
                        ? transfer.ilp_packet.slice(0, 60) + '...'
                        : '—'}
                    </span>
                  </div>
                  <div className='detail-row'>
                    <span className='detail-key'>Condition</span>
                    <span
                      className='detail-value'
                      style={{
                        fontSize: 10,
                        wordBreak: 'break-all',
                        maxWidth: 260,
                      }}
                    >
                      {transfer.condition_value
                        ? transfer.condition_value.slice(0, 60) + '...'
                        : '—'}
                    </span>
                  </div>
                </>
              ) : transfer.error_code ? (
                <>
                  <div className='detail-row'>
                    <span className='detail-key'>Error Code</span>
                    <span
                      className='detail-value'
                      style={{ color: 'var(--red)' }}
                    >
                      {transfer.error_code}
                    </span>
                  </div>
                  <div className='detail-row'>
                    <span className='detail-key'>Error Message</span>
                    <span
                      className='detail-value'
                      style={{ color: 'var(--red)' }}
                    >
                      {transfer.error_message || '—'}
                    </span>
                  </div>
                </>
              ) : (
                <div className='empty-state' style={{ padding: 24 }}>
                  <div className='empty-desc'>No error info</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* State Timeline */}
        <div className='card'>
          <div className='card-header'>
            <span className='card-title'>State History</span>
          </div>
          {transfer.state_history?.length > 0 ? (
            <div className='timeline'>
              {transfer.state_history.map((s, i) => (
                <div key={s.id || i} className='timeline-item'>
                  <div
                    className='timeline-dot'
                    style={{
                      background: DOT_COLOR[s.new_status] || 'var(--accent)',
                    }}
                  />
                  <div className='timeline-body'>
                    <div className='timeline-event'>
                      <span
                        className={`badge ${s.new_status}`}
                        style={{ marginRight: 8 }}
                      >
                        {s.new_status}
                      </span>
                      <span
                        style={{ fontSize: 11, color: 'var(--text-secondary)' }}
                      >
                        via {s.event_type}
                      </span>
                      {s.from_dfsp && (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginLeft: 8,
                          }}
                        >
                          from {s.from_dfsp}
                        </span>
                      )}
                    </div>
                    <div className='timeline-time'>
                      {fmt.datetime(s.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='empty-state'>
              <div className='empty-desc'>No state history</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
