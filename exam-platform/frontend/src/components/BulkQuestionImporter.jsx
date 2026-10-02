import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api/client';

const SAMPLE_QUESTIONS = [
  {
    Question: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
    'Option A': 'O(log n)',
    'Option B': 'O(n)',
    'Option C': 'O(n log n)',
    'Option D': 'O(1)',
    'Correct Answer': 'A',
    Subject: 'Computer Science',
    Topic: 'Data Structures',
    Difficulty: 'MEDIUM',
  },
  {
    Question: 'Which HTTP method is idempotent according to RFC 7231?',
    'Option A': 'POST',
    'Option B': 'PUT',
    'Option C': 'PATCH',
    'Option D': 'CONNECT',
    'Correct Answer': 'B',
    Subject: 'Computer Science',
    Topic: 'Web Engineering',
    Difficulty: 'EASY',
  },
  {
    Question: 'In relational databases, which normal form eliminates transitive functional dependencies?',
    'Option A': 'First Normal Form (1NF)',
    'Option B': 'Second Normal Form (2NF)',
    'Option C': 'Third Normal Form (3NF)',
    'Option D': 'Boyce-Codd Normal Form (BCNF)',
    'Correct Answer': 'C',
    Subject: 'Computer Science',
    Topic: 'Database Systems',
    Difficulty: 'HARD',
  },
  {
    Question: 'What does ACID stand for in transaction processing?',
    'Option A': 'Atomicity, Consistency, Isolation, Durability',
    'Option B': 'Accuracy, Completeness, Integrity, Dependability',
    'Option C': 'Allocation, Concurrency, Indexing, Delivery',
    'Option D': 'Authentication, Cryptography, Identity, Directory',
    'Correct Answer': 'A',
    Subject: 'Computer Science',
    Topic: 'Database Systems',
    Difficulty: 'EASY',
  },
  {
    Question: 'Which protocol operates at the Transport layer of the OSI model?',
    'Option A': 'IP',
    'Option B': 'TCP',
    'Option C': 'HTTP',
    'Option D': 'Ethernet',
    'Correct Answer': 'B',
    Subject: 'Computer Science',
    Topic: 'Computer Networks',
    Difficulty: 'MEDIUM',
  },
];

export default function BulkQuestionImporter({ onImportSuccess, defaultSubject = 'Computer Science' }) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFilter, setPreviewFilter] = useState('ALL'); // 'ALL' | 'VALID' | 'ERRORS'
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Normalize column name variations
  function getHeaderKey(obj, ...possibleAliases) {
    const keys = Object.keys(obj);
    for (const alias of possibleAliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = keys.find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanAlias
      );
      if (match) return obj[match];
    }
    return '';
  }

  // Parse raw JSON rows from XLSX / CSV into validated templates
  function parseAndValidateRows(rawRows) {
    const validated = rawRows.map((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header row
      const errors = [];

      const questionText = (
        getHeaderKey(row, 'Question', 'QuestionText', 'Prompt', 'TemplateText', 'Q') || ''
      ).toString().trim();

      const optA = (
        getHeaderKey(row, 'Option A', 'OptionA', 'Choice A', 'A', 'Opt A', 'Option 1') || ''
      ).toString().trim();

      const optB = (
        getHeaderKey(row, 'Option B', 'OptionB', 'Choice B', 'B', 'Opt B', 'Option 2') || ''
      ).toString().trim();

      const optC = (
        getHeaderKey(row, 'Option C', 'OptionC', 'Choice C', 'C', 'Opt C', 'Option 3') || ''
      ).toString().trim();

      const optD = (
        getHeaderKey(row, 'Option D', 'OptionD', 'Choice D', 'D', 'Opt D', 'Option 4') || ''
      ).toString().trim();

      const rawCorrect = (
        getHeaderKey(row, 'Correct Answer', 'CorrectAnswer', 'Correct', 'Answer', 'Key', 'Ans') || ''
      ).toString().trim();

      const subject = (
        getHeaderKey(row, 'Subject', 'Course') || defaultSubject
      ).toString().trim() || defaultSubject;

      const topic = (
        getHeaderKey(row, 'Topic', 'Category', 'Chapter', 'SubTopic') || 'General'
      ).toString().trim() || 'General';

      let difficulty = (
        getHeaderKey(row, 'Difficulty', 'Level') || 'MEDIUM'
      ).toString().trim().toUpperCase();

      if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        difficulty = 'MEDIUM';
      }

      // Validations
      if (!questionText) {
        errors.push('Question prompt is empty');
      }

      if (!optA || !optB) {
        errors.push('At least Option A and Option B are required');
      }

      const optionsMap = { A: optA, B: optB, C: optC, D: optD };

      // Identify correct option key & value
      let correctKey = 'A';
      let correctValue = optA;

      if (!rawCorrect) {
        errors.push('Missing correct answer');
      } else {
        const cleanCorrect = rawCorrect.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(cleanCorrect)) {
          correctKey = cleanCorrect;
          correctValue = optionsMap[cleanCorrect];
          if (!correctValue) {
            errors.push(`Option ${cleanCorrect} is designated as correct but is empty`);
          }
        } else {
          // Check if value matches option text
          const matchedEntry = Object.entries(optionsMap).find(
            ([, val]) => val && val.toLowerCase() === rawCorrect.toLowerCase()
          );
          if (matchedEntry) {
            correctKey = matchedEntry[0];
            correctValue = matchedEntry[1];
          } else {
            errors.push(`Answer "${rawCorrect}" does not match options A, B, C, or D`);
          }
        }
      }

      // Prepare distractors
      const distractors = Object.entries(optionsMap)
        .filter(([key, val]) => key !== correctKey && Boolean(val))
        .map(([, val]) => val);

      const isValid = errors.length === 0;

      const templatePayload = isValid
        ? {
            subject,
            topic,
            templateText: questionText,
            formulaKey: 'MULTIPLE_CHOICE',
            variableRulesJson: JSON.stringify({
              correct: correctValue,
              distractors: distractors.slice(0, 3),
            }),
            difficulty,
          }
        : null;

      return {
        rowNum,
        questionText,
        options: optionsMap,
        correctKey,
        correctValue,
        subject,
        topic,
        difficulty,
        isValid,
        errors,
        templatePayload,
      };
    });

    return validated;
  }

  function handleFileRead(fileToParse) {
    if (!fileToParse) return;
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows || rows.length === 0) {
          setError('The uploaded file appears to be empty or has no data rows.');
          setParsedRows([]);
          return;
        }

        const validated = parseAndValidateRows(rows);
        setParsedRows(validated);
        setFile(fileToParse);
      } catch (err) {
        console.error(err);
        setError('Failed to parse file: ' + err.message);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please check file permissions and try again.');
    };

    reader.readAsArrayBuffer(fileToParse);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function downloadCsvTemplate() {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_QUESTIONS);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcelTemplate() {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_QUESTIONS);
    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 45 }, // Question
      { wch: 25 }, // Option A
      { wch: 25 }, // Option B
      { wch: 25 }, // Option C
      { wch: 25 }, // Option D
      { wch: 15 }, // Correct Answer
      { wch: 20 }, // Subject
      { wch: 20 }, // Topic
      { wch: 12 }, // Difficulty
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'exam_questions_template.xlsx');
  }

  async function handleExecuteImport() {
    const validQuestions = parsedRows
      .filter((r) => r.isValid && r.templatePayload)
      .map((r) => r.templatePayload);

    if (validQuestions.length === 0) {
      setError('No valid questions to import. Please resolve validation errors.');
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const created = await api.createTemplatesBulk(validQuestions);
      setImportResult({
        count: created.length,
        items: created,
      });

      if (onImportSuccess) {
        onImportSuccess(created);
      }
    } catch (err) {
      console.error(err);
      setError('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  }

  function resetFile() {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Filter parsed rows for preview table
  const filteredRows = parsedRows.filter((row) => {
    if (previewFilter === 'VALID' && !row.isValid) return false;
    if (previewFilter === 'ERRORS' && row.isValid) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        row.questionText.toLowerCase().includes(s) ||
        row.topic.toLowerCase().includes(s) ||
        row.subject.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalCount = parsedRows.length;
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = totalCount - validCount;

  return (
    <div className="bulk-question-importer">
      {/* Header & Download Template Action Bar */}
      <div
        className="card"
        style={{
          padding: 22,
          marginBottom: 20,
          background: 'var(--card)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 19 }}>
              📊 Bulk Question Import via CSV / Excel
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Upload dozens or hundreds of question templates at once from your spreadsheet (.csv, .xlsx, .xls).
            </p>
          </div>

          {/* Sample Template Download Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary"
              onClick={downloadCsvTemplate}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              title="Download standard CSV spreadsheet template"
            >
              <span>📄</span>
              <span>Download CSV Template</span>
            </button>
            <button
              type="button"
              className="secondary"
              onClick={downloadExcelTemplate}
              style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              title="Download Microsoft Excel (.xlsx) template with pre-styled columns"
            >
              <span>📊</span>
              <span>Download Excel Template (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Format Guidelines Box */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'var(--bg)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            💡 Spreadsheet Column Reference:
          </strong>
          <code>Question</code> (prompt) &bull; <code>Option A</code> &bull; <code>Option B</code> &bull;{' '}
          <code>Option C</code> &bull; <code>Option D</code> &bull;{' '}
          <code>Correct Answer</code> (e.g. <em>A</em>, <em>B</em>, <em>C</em>, <em>D</em>, or exact text) &bull;{' '}
          <code>Subject</code> &bull; <code>Topic</code> &bull; <code>Difficulty</code> (<em>EASY</em>, <em>MEDIUM</em>, <em>HARD</em>).
        </div>
      </div>

      {error && (
        <div
          className="card"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            background: 'color-mix(in srgb, var(--danger) 10%, var(--card))',
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 10,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Import Success Banner */}
      {importResult && (
        <div
          className="card"
          style={{
            borderColor: 'var(--accent2)',
            background: 'color-mix(in srgb, var(--accent2) 12%, var(--card))',
            color: 'var(--accent2)',
            marginBottom: 20,
            padding: '16px 20px',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--accent2)' }}>
              🎉 Successfully Imported {importResult.count} Question Templates!
            </h4>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>
              The new questions have been added to your question bank and pre-selected in the exam builder.
            </span>
          </div>
          <button
            type="button"
            className="primary"
            onClick={resetFile}
            style={{ background: 'var(--accent2)', color: '#fff', fontSize: 13 }}
          >
            Upload Another File
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
            background: isDragging
              ? 'color-mix(in srgb, var(--accent) 8%, var(--card))'
              : 'var(--card)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: 24,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileRead(e.target.files[0]);
              }
            }}
          />

          <div style={{ fontSize: 44, marginBottom: 12 }}>📤</div>
          <h4 style={{ margin: '0 0 6px', fontSize: 17 }}>
            Drag &amp; drop your CSV or Excel file here
          </h4>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
            Supports <strong>.csv</strong>, <strong>.xlsx</strong>, and <strong>.xls</strong> spreadsheets
          </p>

          <button
            type="button"
            className="primary"
            style={{ pointerEvents: 'none', padding: '8px 20px', fontSize: 13 }}
          >
            Browse Files from Computer
          </button>
        </div>
      )}

      {/* Parsed Data Preview & Validation Section */}
      {file && parsedRows.length > 0 && (
        <div className="card" style={{ padding: 22, borderRadius: 12 }}>
          {/* File Summary Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>📁</span>
                <strong style={{ fontSize: 16 }}>{file.name}</strong>
                <span className="badge" style={{ fontSize: 11 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>

            <button
              type="button"
              className="secondary"
              onClick={resetFile}
              style={{ fontSize: 12 }}
            >
              ✕ Change File
            </button>
          </div>

          {/* Validation Status Badges & Filtering Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setPreviewFilter('ALL')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  border: previewFilter === 'ALL' ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: previewFilter === 'ALL' ? 'var(--accent)' : 'var(--bg)',
                  color: previewFilter === 'ALL' ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                All Rows ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setPreviewFilter('VALID')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  border: previewFilter === 'VALID' ? '1.5px solid var(--accent2)' : '1px solid var(--border)',
                  background: previewFilter === 'VALID' ? 'var(--accent2)' : 'var(--bg)',
                  color: previewFilter === 'VALID' ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                ✓ Valid &amp; Ready ({validCount})
              </button>

              {errorCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPreviewFilter('ERRORS')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    border: previewFilter === 'ERRORS' ? '1.5px solid var(--danger)' : '1px solid var(--border)',
                    background: previewFilter === 'ERRORS' ? 'var(--danger)' : 'var(--bg)',
                    color: previewFilter === 'ERRORS' ? '#fff' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Needs Attention ({errorCount})
                </button>
              )}
            </div>

            {/* Search Input */}
            <input
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search questions..."
              style={{ maxWidth: 220, fontSize: 12, padding: '6px 12px' }}
            />
          </div>

          {/* Interactive Preview Table */}
          <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', width: 60 }}>Status</th>
                  <th style={{ padding: '10px 12px', width: 50 }}>Row</th>
                  <th style={{ padding: '10px 12px', minWidth: 260 }}>Question Text</th>
                  <th style={{ padding: '10px 12px', minWidth: 280 }}>Options &amp; Correct Answer</th>
                  <th style={{ padding: '10px 12px', width: 130 }}>Topic</th>
                  <th style={{ padding: '10px 12px', width: 90 }}>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                      No rows match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => {
                    const diffColor =
                      r.difficulty === 'EASY'
                        ? 'var(--accent2)'
                        : r.difficulty === 'HARD'
                        ? 'var(--danger)'
                        : 'var(--accent)';

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: !r.isValid
                            ? 'color-mix(in srgb, var(--danger) 5%, transparent)'
                            : 'transparent',
                        }}
                      >
                        {/* Status Column */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          {r.isValid ? (
                            <span
                              style={{
                                color: 'var(--accent2)',
                                fontWeight: 700,
                                fontSize: 15,
                              }}
                              title="Row is valid and ready to import"
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              style={{
                                color: 'var(--danger)',
                                fontWeight: 700,
                                fontSize: 15,
                                cursor: 'help',
                              }}
                              title={r.errors.join('; ')}
                            >
                              ⚠️
                            </span>
                          )}
                        </td>

                        {/* Row # */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'top', color: 'var(--muted)', fontSize: 12 }}>
                          #{r.rowNum}
                        </td>

                        {/* Question Text & Errors */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {r.questionText || <em style={{ color: 'var(--danger)' }}>(Empty Question Prompt)</em>}
                          </div>

                          {r.errors.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                              {r.errors.map((err, eIdx) => (
                                <span
                                  key={eIdx}
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--danger)',
                                    background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    display: 'inline-block',
                                    maxWidth: 'fit-content',
                                  }}
                                >
                                  {err}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Options with Correct Indicator */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
                            {['A', 'B', 'C', 'D'].map((key) => {
                              const val = r.options[key];
                              if (!val) return null;
                              const isCorrect = r.correctKey === key;

                              return (
                                <div
                                  key={key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: isCorrect
                                      ? 'color-mix(in srgb, var(--accent2) 15%, transparent)'
                                      : 'transparent',
                                    color: isCorrect ? 'var(--accent2)' : 'var(--text)',
                                    fontWeight: isCorrect ? 600 : 400,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      padding: '1px 4px',
                                      borderRadius: 3,
                                      background: isCorrect ? 'var(--accent2)' : 'var(--border)',
                                      color: isCorrect ? '#fff' : 'var(--text)',
                                    }}
                                  >
                                    {key}
                                  </span>
                                  <span>{val}</span>
                                  {isCorrect && <span style={{ fontSize: 11 }}>✓ Correct</span>}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Topic & Subject */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <strong style={{ display: 'block', fontSize: 13 }}>{r.topic}</strong>
                          <span className="muted" style={{ fontSize: 11 }}>
                            {r.subject}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <span
                            className="badge"
                            style={{
                              fontSize: 11,
                              background: `color-mix(in srgb, ${diffColor} 15%, transparent)`,
                              color: diffColor,
                            }}
                          >
                            {r.difficulty}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              <span>
                Found <strong>{totalCount}</strong> rows:{' '}
                <strong style={{ color: 'var(--accent2)' }}>{validCount} ready to import</strong>
                {errorCount > 0 && (
                  <span style={{ color: 'var(--danger)', marginLeft: 6 }}>
                    ({errorCount} invalid rows will be skipped)
                  </span>
                )}
              </span>
            </div>

            <button
              type="button"
              className="primary"
              onClick={handleExecuteImport}
              disabled={importing || validCount === 0}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--accent2)',
                color: '#fff',
              }}
            >
              {importing
                ? 'Saving to Question Bank…'
                : `🚀 Import ${validCount} Questions to Database`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
