import { useState } from 'react';

/**
 * QuestionNavigator - Interactive question palette grid with flag-for-review tracking,
 * filtering, and instant question jumping.
 *
 * Props:
 * - questions: Array of question objects ({ variantId, topic, ... })
 * - currentIndex: number (0-based)
 * - answers: Record<string, number> (variantId -> selectedIndex)
 * - reviewFlags: string[] (array of flagged variantIds)
 * - onSelectQuestion: (index: number) => void
 */
export default function QuestionNavigator({
  questions = [],
  currentIndex = 0,
  answers = {},
  reviewFlags = [],
  onSelectQuestion,
}) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'FLAGGED' | 'UNANSWERED' | 'ANSWERED'

  const total = questions.length;
  const answeredCount = questions.filter((q) => answers[q.variantId] !== undefined).length;
  const flaggedCount = questions.filter((q) => reviewFlags.includes(q.variantId)).length;
  const unansweredCount = total - answeredCount;

  // Filtered view if student clicks a filter pill
  const filteredIndices = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => {
      const isAnswered = answers[q.variantId] !== undefined;
      const isFlagged = reviewFlags.includes(q.variantId);

      if (filter === 'FLAGGED') return isFlagged;
      if (filter === 'UNANSWERED') return !isAnswered;
      if (filter === 'ANSWERED') return isAnswered;
      return true;
    });

  function jumpToNextUnanswered() {
    const nextUnanswered = questions.findIndex(
      (q, idx) => idx > currentIndex && answers[q.variantId] === undefined
    );
    if (nextUnanswered !== -1) {
      onSelectQuestion(nextUnanswered);
      return;
    }
    // Wrap around
    const wrapUnanswered = questions.findIndex((q) => answers[q.variantId] === undefined);
    if (wrapUnanswered !== -1) {
      onSelectQuestion(wrapUnanswered);
    }
  }

  function jumpToNextFlagged() {
    const nextFlagged = questions.findIndex(
      (q, idx) => idx > currentIndex && reviewFlags.includes(q.variantId)
    );
    if (nextFlagged !== -1) {
      onSelectQuestion(nextFlagged);
      return;
    }
    // Wrap around
    const wrapFlagged = questions.findIndex((q) => reviewFlags.includes(q.variantId));
    if (wrapFlagged !== -1) {
      onSelectQuestion(wrapFlagged);
    }
  }

  return (
    <div
      className="question-navigator card"
      style={{
        padding: '16px',
        margin: '0 0 20px',
        background: 'var(--card)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.06))',
      }}
    >
      {/* Navigator Header & Summary Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧭</span>
          <strong style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>
            Question Navigator
          </strong>
          <span className="badge" style={{ fontSize: 11, fontWeight: 600 }}>
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Legend / Status Badges */}
        <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--accent2, #10b981)',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text)' }}>
              Answered: <strong>{answeredCount}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text)' }}>
              Flagged: <strong>{flaggedCount}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--muted, #94a3b8)',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text)' }}>
              Unanswered: <strong>{unansweredCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Jump Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              borderRadius: 20,
              border: filter === 'ALL' ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              background: filter === 'ALL' ? 'var(--accent)' : 'var(--bg)',
              color: filter === 'ALL' ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: filter === 'ALL' ? 600 : 400,
            }}
          >
            All ({total})
          </button>
          <button
            type="button"
            onClick={() => setFilter('FLAGGED')}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              borderRadius: 20,
              border: filter === 'FLAGGED' ? '1.5px solid #d97706' : '1px solid var(--border)',
              background: filter === 'FLAGGED' ? '#d97706' : 'var(--bg)',
              color: filter === 'FLAGGED' ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: filter === 'FLAGGED' ? 600 : 400,
            }}
          >
            🚩 Flagged ({flaggedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('UNANSWERED')}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              borderRadius: 20,
              border: filter === 'UNANSWERED' ? '1.5px solid var(--muted)' : '1px solid var(--border)',
              background: filter === 'UNANSWERED' ? 'var(--muted)' : 'var(--bg)',
              color: filter === 'UNANSWERED' ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: filter === 'UNANSWERED' ? 600 : 400,
            }}
          >
            Unanswered ({unansweredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('ANSWERED')}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              borderRadius: 20,
              border: filter === 'ANSWERED' ? '1.5px solid var(--accent2)' : '1px solid var(--border)',
              background: filter === 'ANSWERED' ? 'var(--accent2)' : 'var(--bg)',
              color: filter === 'ANSWERED' ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: filter === 'ANSWERED' ? 600 : 400,
            }}
          >
            ✓ Answered ({answeredCount})
          </button>
        </div>

        {/* Quick Jump Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {unansweredCount > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={jumpToNextUnanswered}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                cursor: 'pointer',
              }}
              title="Jump to next unanswered question"
            >
              ⏭ Next Unanswered
            </button>
          )}
          {flaggedCount > 0 && (
            <button
              type="button"
              className="secondary"
              onClick={jumpToNextFlagged}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #d97706',
                color: '#d97706',
                background: 'var(--bg)',
                cursor: 'pointer',
              }}
              title="Jump to next flagged question"
            >
              🚩 Next Flagged
            </button>
          )}
        </div>
      </div>

      {/* Grid Palette */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
          gap: 8,
          maxHeight: 220,
          overflowY: 'auto',
          padding: '4px 2px',
        }}
      >
        {filteredIndices.length === 0 ? (
          <div
            className="muted"
            style={{
              gridColumn: '1 / -1',
              padding: '16px',
              textAlign: 'center',
              fontSize: 12,
            }}
          >
            No questions match the "{filter.toLowerCase()}" filter.
          </div>
        ) : (
          filteredIndices.map(({ q, idx }) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.variantId] !== undefined;
            const isFlagged = reviewFlags.includes(q.variantId);

            // Determine styling tokens based on state
            let bg = 'var(--bg)';
            let borderColor = 'var(--border)';
            let textColor = 'var(--text)';
            let statusIcon = null;

            if (isAnswered && isFlagged) {
              bg = 'color-mix(in srgb, #f59e0b 22%, var(--card))';
              borderColor = '#d97706';
              textColor = '#b45309';
              statusIcon = '🚩';
            } else if (isFlagged) {
              bg = 'color-mix(in srgb, #f59e0b 16%, var(--card))';
              borderColor = '#f59e0b';
              textColor = '#d97706';
              statusIcon = '🚩';
            } else if (isAnswered) {
              bg = 'color-mix(in srgb, var(--accent2) 20%, var(--card))';
              borderColor = 'var(--accent2)';
              textColor = 'var(--accent2)';
              statusIcon = '✓';
            }

            if (isCurrent) {
              borderColor = 'var(--accent, #2563eb)';
            }

            return (
              <button
                key={q.variantId || idx}
                type="button"
                onClick={() => onSelectQuestion(idx)}
                style={{
                  position: 'relative',
                  height: 38,
                  borderRadius: 8,
                  border: isCurrent ? '2.5px solid var(--accent)' : `1.5px solid ${borderColor}`,
                  background: isCurrent ? 'color-mix(in srgb, var(--accent) 15%, var(--card))' : bg,
                  color: isCurrent ? 'var(--accent)' : textColor,
                  fontWeight: isCurrent || isAnswered || isFlagged ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isCurrent ? '0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
                  transform: isCurrent ? 'scale(1.05)' : 'none',
                }}
                title={`Question ${idx + 1}: ${
                  isFlagged ? 'Flagged for review, ' : ''
                }${isAnswered ? 'Answered' : 'Unanswered'}`}
              >
                <span>{idx + 1}</span>

                {statusIcon && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 2,
                      fontSize: 8,
                      lineHeight: 1,
                    }}
                  >
                    {statusIcon}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
