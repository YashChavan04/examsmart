/**
 * Renders one question with its options. `question` is a QuestionResponseDTO
 * from the backend: { variantId, topic, text, options, order } — note there
 * is deliberately no correct answer in this shape.
 */
export default function QuestionCard({ question, selectedIndex, onSelect, revealCorrectIndex }) {
  return (
    <div className="card">
      <p className="muted">Topic: {question.topic}</p>
      <h3>{question.text}</h3>
      <div className="options">
        {question.options.map((opt, i) => {
          let cls = 'opt';
          if (revealCorrectIndex != null) {
            if (i === revealCorrectIndex) cls += ' correct';
            else if (i === selectedIndex) cls += ' wrong';
          } else if (i === selectedIndex) {
            cls += ' selected';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => onSelect?.(i)}
              disabled={revealCorrectIndex != null}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
