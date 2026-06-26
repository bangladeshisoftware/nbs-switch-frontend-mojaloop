/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { useState } from 'react';
import api from '../../services/api';

export default function SettlementFinalize({ settlementId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState(false);
  const [reason, setReason] = useState('Physical transfer confirmed via RTGS');

  const handleFinalize = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/settlement/${settlementId}/finalize`, {
        reason,
      });
      setResult(res.data);
      if (onDone) onDone(res.data);
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.error || err.message,
        results: { funds_movements: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        className='btn btn-primary'
        onClick={() => {
          setModal(true);
          setResult(null);
        }}
        style={{ background: 'var(--green)', border: 'none' }}
      >
        ✓ Confirm Physical Transfer
      </button>

      {/* Confirm Modal */}
      {modal && (
        <div
          className='modal-overlay'
          onClick={() => !loading && setModal(false)}
        >
          <div
            className='modal'
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            {!result ? (
              <>
                <div className='modal-title'>✓ Confirm Physical Settlement</div>

                {/* Warning */}
                <div
                  style={{
                    padding: '12px 14px',
                    marginBottom: 16,
                    background: '#1a1a00',
                    border: '1px solid #3a3000',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#d4a017',
                    lineHeight: 1.7,
                  }}
                >
                  <strong>
                    Only click this after physical money has been moved.
                  </strong>
                  <br />
                  This will update each DFSP's SETTLEMENT account balance in
                  Mojaloop to reflect the real money transfer via RTGS.
                </div>

                {/* Settlement ID info */}
                <div
                  style={{
                    padding: '10px 14px',
                    marginBottom: 16,
                    background: 'var(--bg-hover)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Settlement ID
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    {settlementId}
                  </span>
                </div>

                {/* What will happen */}
                <div
                  style={{
                    padding: '12px 14px',
                    marginBottom: 16,
                    background: 'var(--bg-hover)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.8,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    What this will do:
                  </div>
                  <div>
                    {' '}
                    <strong>recordFundsOut</strong> DFSPs with negative net
                    amount (they sent money)
                  </div>
                  <div>
                    <strong>recordFundsIn</strong> DFSPs with positive net
                    amount (they received money)
                  </div>
                  <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                    SETTLEMENT account balances will be updated in Mojaloop
                    Central Ledger.
                  </div>
                </div>

                {/* Reason */}
                <div className='input-group' style={{ marginBottom: 16 }}>
                  <label className='input-label'>Reason / Reference</label>
                  <input
                    className='input w-full'
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder='e.g. RTGS transfer ref #12345'
                  />
                </div>

                <div className='modal-actions'>
                  <button
                    className='btn btn-secondary'
                    onClick={() => setModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className='btn btn-primary'
                    onClick={handleFinalize}
                    disabled={loading}
                    style={{ background: 'var(--green)', border: 'none' }}
                  >
                    {loading ? ' Processing...' : ' Confirm & Update Mojaloop'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/*  Result view */}
                <div
                  style={{
                    padding: '16px 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid var(--border)',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {result.success
                        ? 'Finalization Complete'
                        : 'Partial Finalization'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {result.message}
                    </div>
                  </div>
                </div>

                {/* Summary badges */}
                {result.summary && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                      {
                        label: 'Succeeded',
                        val: result.summary.succeeded,
                        color: 'var(--green)',
                      },
                      {
                        label: 'Failed',
                        val: result.summary.failed,
                        color: 'var(--red)',
                      },
                      {
                        label: 'Skipped',
                        val: result.summary.skipped,
                        color: 'var(--text-muted)',
                      },
                    ].map((b) => (
                      <div
                        key={b.label}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: 'var(--bg-hover)',
                          borderRadius: 8,
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: b.color,
                          }}
                        >
                          {b.val}
                        </div>
                        <div
                          style={{ fontSize: 10, color: 'var(--text-muted)' }}
                        >
                          {b.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Per-participant results */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                      letterSpacing: 1,
                    }}
                  >
                    SETTLEMENT ACCOUNT CHANGES
                  </div>
                  {(result.results?.funds_movements || []).map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 0',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {m.participantName ||
                            `Participant ${m.participantId}`}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            marginLeft: 8,
                          }}
                        >
                          {m.action}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {m.status === 'ok' && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              fontWeight: 700,
                              color:
                                m.netAmount < 0 ? 'var(--red)' : 'var(--green)',
                            }}
                          >
                            {m.netAmount < 0 ? '-' : '+'}
                            {m.absAmount} {m.currency}
                          </span>
                        )}
                        <span
                          className={`badge ${
                            m.status === 'ok'
                              ? 'COMMITTED'
                              : m.status === 'failed'
                                ? 'FAILED'
                                : 'TIMEOUT'
                          }`}
                          style={{ marginLeft: 8 }}
                        >
                          {m.status === 'ok'
                            ? 'Success'
                            : m.status === 'failed'
                              ? 'Failed'
                              : '—'}{' '}
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className='btn btn-primary'
                    onClick={() => {
                      setModal(false);
                      setResult(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
