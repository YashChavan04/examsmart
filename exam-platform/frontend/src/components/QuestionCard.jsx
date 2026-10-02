/**
 * QuestionCard - High-fidelity question presentation with option letter chips,
 * animated radio selection indicators, and clear reveal modes.
 */
export default function QuestionCard({ question, selectedIndex, onSelect, revealCorrectIndex }) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div style={{ marginTop: 6 }}>
      {/* Question Prompt */}
      <h3
        style={{
          margin: '0 0 18px',
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.5,
          color: 'var(--text)',
          letterSpacing: -0.2,
        }}
      >
        {question.text}
      </h3>

      {/* Options Stack */}
      <div className="options">
        {question.options.map((opt, i) => {
          const letter = letters[i] || String(i + 1);
          let cls = 'opt';
          let isCorrect = false;
          let isWrong = false;
          const isSelected = i === selectedIndex;

          if (revealCorrectIndex != null) {
            if (i === revealCorrectIndex) {
              cls += ' correct';
              isCorrect = true;
            } else if (isSelected) {
              cls += ' wrong';
              isWrong = true;
            }
          } else if (isSelected) {
            cls += ' selected';
          }

          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => onSelect?.(i)}
              disabled={revealCorrectIndex != null}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 12,
                cursor: revealCorrectIndex != null ? 'default' : 'pointer',
              }}
            >
              {/* Option Letter Chip + Option Text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    background: isCorrect
                      ? 'var(--accent2)'
                      : isWrong
                      ? 'var(--danger)'
                      : isSelected
                      ? 'var(--accent)'
                      : 'color-mix(in srgb, var(--text) 8%, transparent)',
                    color: isCorrect || isWrong || isSelected ? '#fff' : 'var(--text)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {letter}
                </span>

                <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 500 }}>
                  {opt}
                </span>
              </div>

              {/* Radio Indicator */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: `2px solid ${
                    isCorrect
                      ? 'var(--accent2)'
                      : isWrong
                      ? 'var(--danger)'
                      : isSelected
                      ? 'var(--accent)'
                      : 'var(--border)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected && !isCorrect && !isWrong ? 'var(--accent)' : 'transparent',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {isCorrect ? (
                  <span style={{ color: 'var(--accent2)', fontSize: 13, fontWeight: 700 }}>✓</span>
                ) : isWrong ? (
                  <span style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 700 }}>✕</span>
                ) : isSelected ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
