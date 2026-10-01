import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';

// Pre-curated subject packs that faculty can load in 1 click
const CURATED_PACKS = {
  cs: {
    name: 'Computer Science Core',
    icon: '💻',
    subject: 'Computer Science',
    questions: [
      {
        subject: 'Computer Science',
        topic: 'Operating Systems',
        templateText: 'What is the primary function of Virtual Memory in modern operating systems?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Allow execution of processes larger than physical RAM via paging',
          distractors: ['Speed up network packet transmission', 'Prevent power loss during shutdowns', 'Replace CPU cache registers']
        }),
        difficulty: 'MEDIUM'
      },
      {
        subject: 'Computer Science',
        topic: 'Data Structures',
        templateText: 'What is the worst-case search time complexity in an unbalanced Binary Search Tree (BST)?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'O(n)',
          distractors: ['O(log n)', 'O(1)', 'O(n log n)']
        }),
        difficulty: 'MEDIUM'
      },
      {
        subject: 'Computer Science',
        topic: 'OOP Concepts',
        templateText: 'Which OOP principle allows a subclass to provide a specific implementation of a method already defined in its superclass?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Method Overriding (Polymorphism)',
          distractors: ['Data Encapsulation', 'Multiple Inheritance', 'Garbage Collection']
        }),
        difficulty: 'EASY'
      },
      {
        subject: 'Computer Science',
        topic: 'Git & Version Control',
        templateText: 'In Git, what is the primary operational difference between "git merge" and "git rebase"?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Rebase rewrites commit history linearly, while merge preserves branch topology with a merge commit',
          distractors: ['Merge deletes untracked files', 'Rebase only works on remote repositories', 'Merge cannot handle merge conflicts']
        }),
        difficulty: 'HARD'
      },
      {
        subject: 'Computer Science',
        topic: 'Cybersecurity',
        templateText: 'Which cryptographic approach uses a public key for encryption and a distinct private key for decryption?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Asymmetric (Public Key) Cryptography',
          distractors: ['Symmetric Key Encryption', 'SHA-256 Hashing', 'Caesar Cipher']
        }),
        difficulty: 'EASY'
      }
    ]
  },
  aptitude: {
    name: 'Quantitative Aptitude & Logic',
    icon: '📊',
    subject: 'Aptitude',
    questions: [
      {
        subject: 'Aptitude',
        topic: 'Work & Time',
        templateText: 'Worker A can complete a task in 10 days, and Worker B can complete it in 15 days. Working together, how many days will they take?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: '6 days',
          distractors: ['12.5 days', '8 days', '5 days']
        }),
        difficulty: 'MEDIUM'
      },
      {
        subject: 'Aptitude',
        topic: 'Ratio & Proportion',
        templateText: 'A sum of $150 is divided between Alice and Bob in the ratio 2:3. What is Bob\'s share?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: '$90',
          distractors: ['$60', '$75', '$100']
        }),
        difficulty: 'EASY'
      },
      {
        subject: 'Aptitude',
        topic: 'Probability',
        templateText: 'What is the probability of rolling a prime number on a fair, standard 6-sided die?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: '1/2 (50%)',
          distractors: ['1/3 (33.3%)', '2/3 (66.7%)', '1/6 (16.7%)']
        }),
        difficulty: 'EASY'
      },
      {
        subject: 'Aptitude',
        topic: 'Geometry',
        templateText: 'Find the area of a right-angled triangle with a base of 8 cm and a height of 6 cm.',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: '24 cm²',
          distractors: ['48 cm²', '14 cm²', '28 cm²']
        }),
        difficulty: 'EASY'
      },
      {
        subject: 'Aptitude',
        topic: 'Profit & Discount',
        templateText: 'An article marked at $500 is sold after two successive discounts of 10% and 10%. What is the final selling price?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: '$405',
          distractors: ['$400', '$410', '$420']
        }),
        difficulty: 'HARD'
      }
    ]
  },
  web: {
    name: 'Web Dev & Cloud Architecture',
    icon: '🌐',
    subject: 'Web Technologies',
    questions: [
      {
        subject: 'Web Technologies',
        topic: 'React & Frontend',
        templateText: 'In React function components, what is the primary purpose of the useEffect hook?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Perform side effects like data fetching, subscriptions, or manual DOM manipulation',
          distractors: ['Define mutable instance state', 'Directly compile JSX into HTML strings', 'Block UI thread rendering']
        }),
        difficulty: 'EASY'
      },
      {
        subject: 'Web Technologies',
        topic: 'HTTP & REST APIs',
        templateText: 'Which of the following HTTP methods is defined by the HTTP/1.1 specification as idempotent?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'PUT and DELETE',
          distractors: ['POST only', 'PATCH and POST', 'None of them']
        }),
        difficulty: 'MEDIUM'
      },
      {
        subject: 'Web Technologies',
        topic: 'Cloud Computing',
        templateText: 'What is the distinguishing characteristic of Serverless / FaaS (Function-as-a-Service) execution?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Event-driven auto-scaling to zero and charging only for executed compute time',
          distractors: ['Running dedicated bare-metal servers 24/7', 'Requiring manual operating system patching', 'Static IP addresses for every container']
        }),
        difficulty: 'MEDIUM'
      },
      {
        subject: 'Web Technologies',
        topic: 'CSS Layout',
        templateText: 'In CSS Flexbox, what property aligns items along the cross-axis?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'align-items',
          distractors: ['justify-content', 'flex-direction', 'align-content']
        }),
        difficulty: 'EASY'
      },
      {
        subject: 'Web Technologies',
        topic: 'JavaScript Engine',
        templateText: 'In the JavaScript event loop, which queue has priority when the call stack is clear?',
        formulaKey: 'MULTIPLE_CHOICE',
        variableRulesJson: JSON.stringify({
          correct: 'Microtask Queue (Promises, queueMicrotask)',
          distractors: ['Macrotask Queue (setTimeout, setInterval)', 'I/O Polling Queue', 'Rendering Queue']
        }),
        difficulty: 'HARD'
      }
    ]
  }
};

const SAMPLE_BULK_TEXT = `Question: What is the main purpose of an index in a relational database?
A: Speed up data retrieval queries
B: Enforce foreign key constraints only
C: Compress database tables on disk
D: Prevent concurrent transactions
Answer: A
Topic: Databases
Difficulty: EASY

Question: Which layer of the OSI reference model handles end-to-end reliability and flow control?
A: Transport Layer
B: Physical Layer
C: Data Link Layer
D: Presentation Layer
Answer: A
Topic: Networking
Difficulty: MEDIUM

Question: Which sorting algorithm has an optimal worst-case time complexity of O(n log n)?
A: Merge Sort
B: Bubble Sort
C: Selection Sort
D: Quick Sort
Answer: A
Topic: Algorithms
Difficulty: MEDIUM

Question: In Python, which collection data structure is ordered and immutable?
A: Tuple
B: Dictionary
C: Set
D: List
Answer: A
Topic: Python
Difficulty: EASY

Question: What is the output of 2 ** 3 in Python?
A: 8
B: 6
C: 5
D: 9
Answer: A
Topic: Python
Difficulty: EASY`;

export default function CreateExamPage() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'bulk' | 'builder' | 'exams'

  // Exam Creation State
  const [form, setForm] = useState({
    title: '',
    subject: 'Computer Science & Aptitude',
    durationSeconds: 600,
    startWindow: new Date().toISOString().slice(0, 16),
    endWindow: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');

  // Templates & Exams Lists
  const [templates, setTemplates] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingExam, setSavingExam] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Bulk Importer State
  const [bulkText, setBulkText] = useState(SAMPLE_BULK_TEXT);
  const [bulkSubject, setBulkSubject] = useState('Computer Science');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [importingBulk, setImportingBulk] = useState(false);
  const [packLoading, setPackLoading] = useState(null);

  // Single Template Builder State
  const [builderType, setBuilderType] = useState('MCQ'); // 'MCQ' | 'EXPRESSION'
  const [builderSubject, setBuilderSubject] = useState('Computer Science');
  const [builderTopic, setBuilderTopic] = useState('');
  const [builderDifficulty, setBuilderDifficulty] = useState('MEDIUM');
  const [builderText, setBuilderText] = useState('');
  // MCQ fields
  const [mcqCorrect, setMcqCorrect] = useState('');
  const [mcqDistractor1, setMcqDistractor1] = useState('');
  const [mcqDistractor2, setMcqDistractor2] = useState('');
  const [mcqDistractor3, setMcqDistractor3] = useState('');
  // Expression fields
  const [exprFormula, setExprFormula] = useState('a * b');
  const [exprVar1Name, setExprVar1Name] = useState('a');
  const [exprVar1Min, setExprVar1Min] = useState(2);
  const [exprVar1Max, setExprVar1Max] = useState(12);
  const [exprVar2Name, setExprVar2Name] = useState('b');
  const [exprVar2Min, setExprVar2Min] = useState(5);
  const [exprVar2Max, setExprVar2Max] = useState(20);

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [tmplList, examList] = await Promise.all([
        api.listTemplates(),
        api.listExams(),
      ]);
      setTemplates(tmplList || []);
      setExams(examList || []);

      if (selectedTemplateIds.length === 0 && tmplList && tmplList.length > 0) {
        setSelectedTemplateIds(tmplList.slice(0, 5).map((t) => t.id));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTemplate(id) {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // 1-Click Fast Exam Generator
  function handleQuickPresetExam(count = 10) {
    const targetTemplates = templates.slice(0, count);
    if (targetTemplates.length === 0) {
      setError('No templates available to generate preset.');
      return;
    }

    setForm({
      title: `General Assessment (${targetTemplates.length} Questions)`,
      subject: 'STEM & Computer Science',
      durationSeconds: targetTemplates.length * 60, // 1 min per question
      startWindow: new Date().toISOString().slice(0, 16),
      endWindow: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    });
    setSelectedTemplateIds(targetTemplates.map((t) => t.id));
    setSuccessMsg(`Preset applied! Selected ${targetTemplates.length} questions. You can now click "Publish Examination" directly!`);
  }

  // 1-Click Pre-made Subject Pack Importer
  async function handleImportCuratedPack(packKey) {
    const pack = CURATED_PACKS[packKey];
    if (!pack) return;

    setPackLoading(packKey);
    setError(null);
    try {
      const created = await api.createTemplatesBulk(pack.questions);
      setSuccessMsg(`Successfully imported "${pack.name}" (${created.length} questions)!`);

      const refreshed = await api.listTemplates();
      setTemplates(refreshed || []);
      // Automatically select newly added IDs
      const newIds = created.map((q) => q.id);
      setSelectedTemplateIds((prev) => Array.from(new Set([...prev, ...newIds])));
      setActiveTab('create');
    } catch (err) {
      setError('Pack import error: ' + err.message);
    } finally {
      setPackLoading(null);
    }
  }

  // Parse bulk text into questions
  function parseBulkText(rawText, defaultSubject = 'General') {
    const blocks = rawText.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const results = [];

    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      let questionText = '';
      let topic = 'General';
      let subject = defaultSubject;
      let difficulty = 'MEDIUM';
      const options = {};
      let correctKey = 'A';

      for (const line of lines) {
        if (/^(Q|Question)[:\.]\s*/i.test(line)) {
          questionText = line.replace(/^(Q|Question)[:\.]\s*/i, '').trim();
        } else if (/^Topic[:\.]\s*/i.test(line)) {
          topic = line.replace(/^Topic[:\.]\s*/i, '').trim();
        } else if (/^Subject[:\.]\s*/i.test(line)) {
          subject = line.replace(/^Subject[:\.]\s*/i, '').trim();
        } else if (/^Difficulty[:\.]\s*/i.test(line)) {
          difficulty = line.replace(/^Difficulty[:\.]\s*/i, '').trim().toUpperCase();
        } else if (/^(Ans|Answer|Correct)[:\.]\s*/i.test(line)) {
          correctKey = line.replace(/^(Ans|Answer|Correct)[:\.]\s*/i, '').trim().toUpperCase().charAt(0);
        } else if (/^[A-D][:|\.)]\s*/i.test(line)) {
          const key = line.charAt(0).toUpperCase();
          options[key] = line.replace(/^[A-D][:|\.)]\s*/i, '').trim();
        }
      }

      if (questionText && options['A'] && options['B']) {
        const correctVal = options[correctKey] || options['A'];
        const distractors = Object.entries(options)
          .filter(([k, v]) => v !== correctVal)
          .map(([k, v]) => v);

        results.push({
          subject,
          topic,
          templateText: questionText,
          formulaKey: 'MULTIPLE_CHOICE',
          variableRulesJson: JSON.stringify({
            correct: correctVal,
            distractors: distractors.slice(0, 3),
          }),
          difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
        });
      }
    }

    return results;
  }

  async function handleExecuteBulkImport() {
    const parsed = parseBulkText(bulkText, bulkSubject);
    if (parsed.length === 0) {
      setError('Could not extract valid questions. Please ensure each question has a prompt, options (A, B, C, D), and an Answer line.');
      return;
    }

    setImportingBulk(true);
    setError(null);
    try {
      const created = await api.createTemplatesBulk(parsed);
      setSuccessMsg(`Successfully imported ${created.length} question templates!`);

      const refreshed = await api.listTemplates();
      setTemplates(refreshed || []);
      const newIds = created.map((q) => q.id);
      setSelectedTemplateIds((prev) => Array.from(new Set([...prev, ...newIds])));
      setActiveTab('create');
    } catch (err) {
      setError('Bulk import error: ' + err.message);
    } finally {
      setImportingBulk(false);
    }
  }

  async function handleCreateExam(e) {
    e.preventDefault();
    if (selectedTemplateIds.length === 0) {
      setError('Please select at least one question template for the exam.');
      return;
    }

    setSavingExam(true);
    setError(null);
    try {
      const exam = await api.createExam({
        title: form.title,
        subject: form.subject,
        durationSeconds: Number(form.durationSeconds),
        startWindow: new Date(form.startWindow).toISOString(),
        endWindow: new Date(form.endWindow).toISOString(),
        templateIdsInOrder: selectedTemplateIds,
      });

      setSuccessMsg(`Exam "${exam.title}" deployed successfully with ${selectedTemplateIds.length} questions!`);
      // Reload exams list and switch to Manage tab
      const updatedExams = await api.listExams();
      setExams(updatedExams || []);
      setActiveTab('exams');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingExam(false);
    }
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    setSavingTemplate(true);
    setError(null);

    try {
      let variableRulesJson = '{}';
      let formulaKey = 'MULTIPLE_CHOICE';

      if (builderType === 'MCQ') {
        formulaKey = 'MULTIPLE_CHOICE';
        variableRulesJson = JSON.stringify({
          correct: mcqCorrect.trim(),
          distractors: [mcqDistractor1.trim(), mcqDistractor2.trim(), mcqDistractor3.trim()].filter(Boolean),
        });
      } else {
        formulaKey = 'MATH_EXPRESSION';
        const ranges = {
          [exprVar1Name.trim()]: { min: Number(exprVar1Min), max: Number(exprVar1Max) },
        };
        if (exprVar2Name.trim()) {
          ranges[exprVar2Name.trim()] = { min: Number(exprVar2Min), max: Number(exprVar2Max) };
        }
        variableRulesJson = JSON.stringify({
          expression: exprFormula.trim(),
          ranges,
        });
      }

      const created = await api.createTemplate({
        subject: builderSubject.trim(),
        topic: builderTopic.trim(),
        templateText: builderText.trim(),
        formulaKey,
        variableRulesJson,
        difficulty: builderDifficulty,
      });

      setSuccessMsg(`Template "${created.topic}" created successfully!`);
      setBuilderTopic('');
      setBuilderText('');
      setMcqCorrect('');
      setMcqDistractor1('');
      setMcqDistractor2('');
      setMcqDistractor3('');

      const tmplList = await api.listTemplates();
      setTemplates(tmplList || []);
      setSelectedTemplateIds((prev) => [...prev, created.id]);
      setActiveTab('create');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleCalibrate() {
    setCalibrating(true);
    setError(null);
    try {
      const res = await api.calibrateDifficulty();
      setSuccessMsg(`Difficulty calibration completed! ${res.calibratedTemplatesCount || 0} template(s) calibrated based on live student performance.`);
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setCalibrating(false);
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.topic.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.templateText.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesDiff = difficultyFilter === 'ALL' || t.calibratedDifficulty === difficultyFilter || t.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: '0 14px' }}>
      {/* Top Portal Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 24 }}>👩‍🏫 Faculty Examination Management</h2>
          <p className="muted" style={{ margin: 0 }}>
            Create exams quickly with pre-made question packs, bulk text import, or the custom builder.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={activeTab === 'create' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('create')}
            style={{ fontSize: 13 }}
          >
            ➕ Create Exam
          </button>
          <button
            type="button"
            className={activeTab === 'bulk' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('bulk')}
            style={{ fontSize: 13, background: activeTab === 'bulk' ? 'var(--accent2)' : undefined, color: activeTab === 'bulk' ? '#fff' : undefined }}
          >
            ⚡ Bulk Import & Packs
          </button>
          <button
            type="button"
            className={activeTab === 'builder' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('builder')}
            style={{ fontSize: 13 }}
          >
            🧩 Single Builder
          </button>
          <button
            type="button"
            className={activeTab === 'exams' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('exams')}
            style={{ fontSize: 13 }}
          >
            📋 Manage Exams ({exams.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="card" style={{ background: 'color-mix(in srgb, var(--accent2) 15%, var(--card))', color: 'var(--accent2)', border: '1px solid var(--accent2)', padding: '10px 16px', marginBottom: 16 }}>
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div className="card" style={{ background: 'color-mix(in srgb, var(--danger) 15%, var(--card))', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '10px 16px', marginBottom: 16 }}>
          ✕ {error}
        </div>
      )}

      {/* TAB 1: CREATE EXAM & TEMPLATE PICKER */}
      {activeTab === 'create' && (
        <div>
          {/* Quick-Action Speed Bar */}
          <div className="card" style={{
            padding: '14px 18px',
            marginBottom: 16,
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--card)), var(--card))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <strong style={{ fontSize: 14, display: 'block' }}>⚡ Fast Exam Setup</strong>
              <span className="muted" style={{ fontSize: 12 }}>
                Don't want to pick one-by-one? Click a preset to instantly configure and select questions:
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="secondary"
                onClick={() => handleQuickPresetExam(10)}
                style={{ fontSize: 12, padding: '6px 12px', fontWeight: 600 }}
              >
                ⚡ 10-Question Test Preset
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setSelectedTemplateIds(templates.map((t) => t.id))}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Select All {templates.length} Questions
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => setActiveTab('bulk')}
                style={{ fontSize: 12, padding: '6px 12px', background: 'var(--accent2)' }}
              >
                + Import More Questions
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateExam}>
            {/* Exam Parameters */}
            <div className="card" style={{ padding: 22, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Exam Specifications</h3>
              <div className="grid2">
                <div>
                  <label className="field-label">Exam Title</label>
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="e.g. Midterm Assessment: Computer Science & Aptitude"
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Subject</label>
                  <input
                    className="input"
                    value={form.subject}
                    onChange={(e) => updateForm('subject', e.target.value)}
                    placeholder="e.g. Aptitude, Computer Science, Physics"
                    required
                  />
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 12 }}>
                <div>
                  <label className="field-label">Duration (seconds)</label>
                  <input
                    className="input"
                    type="number"
                    value={form.durationSeconds}
                    onChange={(e) => updateForm('durationSeconds', e.target.value)}
                    min={30}
                    required
                  />
                  <span className="muted" style={{ fontSize: 11 }}>
                    {Math.round(form.durationSeconds / 60)} minutes ({form.durationSeconds}s)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="field-label">Start Window</label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.startWindow}
                      onChange={(e) => updateForm('startWindow', e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="field-label">End Window</label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.endWindow}
                      onChange={(e) => updateForm('endWindow', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Question Template Checklist Picker */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>
                    Question Template Picker ({selectedTemplateIds.length} Selected of {templates.length})
                  </h3>
                  <span className="muted" style={{ fontSize: 13 }}>
                    Each selected template renders as 1 randomized question per student candidate.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setActiveTab('bulk')}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    ⚡ Bulk Import / Packs
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setActiveTab('builder')}
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    ➕ Single Builder
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  style={{ flex: 2, minWidth: 200 }}
                  placeholder="🔍 Search questions by topic, subject, or text…"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                />
                <select
                  className="input"
                  style={{ flex: 1, minWidth: 140 }}
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: 12 }}
                  onClick={() => setSelectedTemplateIds(filteredTemplates.map((t) => t.id))}
                >
                  Select Filtered ({filteredTemplates.length})
                </button>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: 12 }}
                  onClick={() => setSelectedTemplateIds([])}
                >
                  Clear
                </button>
              </div>

              {/* Template Checklist Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                {filteredTemplates.length === 0 ? (
                  <p className="muted" style={{ padding: 20, textAlign: 'center' }}>
                    No matching question templates found. Try changing filters or import more questions.
                  </p>
                ) : (
                  filteredTemplates.map((t, idx) => {
                    const isSelected = selectedTemplateIds.includes(t.id);
                    const diff = t.calibratedDifficulty || t.difficulty;
                    const diffColor =
                      diff === 'EASY' ? 'var(--accent2)' : diff === 'HARD' ? 'var(--danger)' : 'var(--accent)';

                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTemplate(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                          background: isSelected
                            ? 'color-mix(in srgb, var(--accent) 8%, var(--card))'
                            : 'var(--card)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTemplate(t.id)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>#{idx + 1}</span>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{t.topic}</span>
                            <span className="badge" style={{ fontSize: 11 }}>{t.subject}</span>
                            <span
                              className="badge"
                              style={{
                                fontSize: 11,
                                background: `color-mix(in srgb, ${diffColor} 15%, transparent)`,
                                color: diffColor,
                              }}
                            >
                              {diff} {t.calibratedDifficulty && '⚡Auto'}
                            </span>
                            {t.timesAnswered > 0 && (
                              <span className="muted" style={{ fontSize: 11 }}>
                                {Math.round(t.accuracyRate * 100)}% accuracy ({t.timesAnswered} answers)
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: 'var(--text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {t.templateText}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <strong>{selectedTemplateIds.length}</strong> questions selected for this exam.
                </div>
                <button
                  type="submit"
                  className="primary"
                  disabled={savingExam || selectedTemplateIds.length === 0}
                  style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600 }}
                >
                  {savingExam ? 'Publishing Exam…' : `🚀 Publish Examination (${selectedTemplateIds.length} Questions)`}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BULK IMPORTER & PRE-MADE PACKS */}
      {activeTab === 'bulk' && (
        <div>
          {/* 1-Click Curated Packs Section */}
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>🚀 1-Click Curated Question Packs</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 13 }}>
              Instantly import pre-built, verified questions with answer keys across popular engineering and testing domains:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {Object.entries(CURATED_PACKS).map(([key, pack]) => (
                <div
                  key={key}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 16,
                    background: 'var(--card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{pack.icon}</span>
                      <div>
                        <strong style={{ fontSize: 15 }}>{pack.name}</strong>
                        <div className="muted" style={{ fontSize: 11 }}>{pack.subject} &middot; {pack.questions.length} Questions</div>
                      </div>
                    </div>
                    <ul style={{ margin: '8px 0 14px', paddingLeft: 18, fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                      {pack.questions.map((q, idx) => (
                        <li key={idx}><strong>{q.topic}:</strong> {q.templateText.slice(0, 45)}…</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="primary"
                    disabled={packLoading !== null}
                    onClick={() => handleImportCuratedPack(key)}
                    style={{ fontSize: 13, width: '100%', padding: '8px 12px' }}
                  >
                    {packLoading === key ? 'Importing…' : `+ Import ${pack.name} (+${pack.questions.length})`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Paste Text / Q&A Bulk Importer */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>📝 Fast Text Q&A Importer</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  Paste questions formatted as Question / A, B, C, D / Answer. You can import 10, 20, or 50 questions at once!
                </span>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setBulkText(SAMPLE_BULK_TEXT)}
                style={{ fontSize: 12 }}
              >
                📋 Load Example Questions
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Default Subject</label>
              <input
                className="input"
                style={{ maxWidth: 300 }}
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
                placeholder="e.g. Computer Science, Mathematics"
              />
            </div>

            <textarea
              className="input"
              rows={12}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste formatted questions here..."
              style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5 }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Format: <code>Question: ... \n A: ... \n B: ... \n C: ... \n D: ... \n Answer: A</code>
              </span>
              <button
                type="button"
                className="primary"
                onClick={handleExecuteBulkImport}
                disabled={importingBulk || !bulkText.trim()}
                style={{ padding: '9px 20px', background: 'var(--accent2)', color: '#fff', fontWeight: 600 }}
              >
                {importingBulk ? 'Parsing & Saving…' : '⚡ Parse & Import All Questions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SINGLE TEMPLATE BUILDER */}
      {activeTab === 'builder' && (
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>🧩 Custom Question Template Builder</h3>
          <p className="muted" style={{ margin: '0 0 20px', fontSize: 13 }}>
            Build single questions with custom distractors or dynamic formulas.
          </p>

          <form onSubmit={handleCreateTemplate}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <button
                type="button"
                className={builderType === 'MCQ' ? 'primary' : 'secondary'}
                onClick={() => setBuilderType('MCQ')}
                style={{ fontSize: 13 }}
              >
                Multiple Choice Question (MCQ)
              </button>
              <button
                type="button"
                className={builderType === 'EXPRESSION' ? 'primary' : 'secondary'}
                onClick={() => setBuilderType('EXPRESSION')}
                style={{ fontSize: 13 }}
              >
                Dynamic Math Formula
              </button>
            </div>

            <div className="grid2">
              <div>
                <label className="field-label">Subject</label>
                <input
                  className="input"
                  value={builderSubject}
                  onChange={(e) => setBuilderSubject(e.target.value)}
                  placeholder="e.g. Computer Science, Physics"
                  required
                />
              </div>
              <div>
                <label className="field-label">Topic</label>
                <input
                  className="input"
                  value={builderTopic}
                  onChange={(e) => setBuilderTopic(e.target.value)}
                  placeholder="e.g. Data Structures, Optics, Algebra"
                  required
                />
              </div>
            </div>

            <div className="grid2" style={{ marginTop: 12 }}>
              <div>
                <label className="field-label">Difficulty</label>
                <select
                  className="input"
                  value={builderDifficulty}
                  onChange={(e) => setBuilderDifficulty(e.target.value)}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="field-label">Question Text</label>
              <textarea
                className="input"
                rows={3}
                value={builderText}
                onChange={(e) => setBuilderText(e.target.value)}
                placeholder={
                  builderType === 'MCQ'
                    ? 'e.g. Which layer of the OSI model does IP address routing operate in?'
                    : 'e.g. If an object travels at {a} m/s for {b} seconds, calculate the distance covered.'
                }
                required
              />
            </div>

            {builderType === 'MCQ' ? (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 15 }}>Answer Choices</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="field-label" style={{ color: 'var(--accent2)', fontWeight: 600 }}>✓ Correct Answer</label>
                    <input
                      className="input"
                      value={mcqCorrect}
                      onChange={(e) => setMcqCorrect(e.target.value)}
                      placeholder="e.g. Network Layer"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Wrong Option (Distractor 1)</label>
                    <input
                      className="input"
                      value={mcqDistractor1}
                      onChange={(e) => setMcqDistractor1(e.target.value)}
                      placeholder="e.g. Data Link Layer"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Wrong Option (Distractor 2)</label>
                    <input
                      className="input"
                      value={mcqDistractor2}
                      onChange={(e) => setMcqDistractor2(e.target.value)}
                      placeholder="e.g. Transport Layer"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label">Wrong Option (Distractor 3)</label>
                    <input
                      className="input"
                      value={mcqDistractor3}
                      onChange={(e) => setMcqDistractor3(e.target.value)}
                      placeholder="e.g. Session Layer"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 15 }}>Formula Configuration</h4>
                <div style={{ marginBottom: 12 }}>
                  <label className="field-label">Mathematical Formula Expression</label>
                  <input
                    className="input"
                    value={exprFormula}
                    onChange={(e) => setExprFormula(e.target.value)}
                    placeholder="e.g. a * b or p * (1 + r / 100)"
                    required
                  />
                </div>
                <div className="grid2">
                  <div>
                    <label className="field-label">Variable 1 Name & Min/Max Range</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="input" style={{ width: 80 }} value={exprVar1Name} onChange={(e) => setExprVar1Name(e.target.value)} placeholder="Var" />
                      <input className="input" type="number" value={exprVar1Min} onChange={(e) => setExprVar1Min(e.target.value)} placeholder="Min" />
                      <input className="input" type="number" value={exprVar1Max} onChange={(e) => setExprVar1Max(e.target.value)} placeholder="Max" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Variable 2 Name & Min/Max Range (Optional)</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="input" style={{ width: 80 }} value={exprVar2Name} onChange={(e) => setExprVar2Name(e.target.value)} placeholder="Var" />
                      <input className="input" type="number" value={exprVar2Min} onChange={(e) => setExprVar2Min(e.target.value)} placeholder="Min" />
                      <input className="input" type="number" value={exprVar2Max} onChange={(e) => setExprVar2Max(e.target.value)} placeholder="Max" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="submit"
                className="primary"
                disabled={savingTemplate}
                style={{ padding: '9px 24px', fontSize: 14 }}
              >
                {savingTemplate ? 'Saving Template…' : '✓ Create & Save Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: MANAGE EXAMS & DIFFICULTY CALIBRATION */}
      {activeTab === 'exams' && (
        <div>
          {/* Difficulty Calibration Trigger Banner */}
          <div className="card" style={{
            padding: '16px 20px',
            marginBottom: 20,
            background: 'color-mix(in srgb, var(--accent) 8%, var(--card))',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <strong style={{ fontSize: 15, display: 'block', marginBottom: 2 }}>
                🎯 Automatic Difficulty Calibration
              </strong>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Calibrate questions to Easy, Medium, or Hard automatically based on actual student success rates.
              </p>
            </div>
            <button
              className="secondary"
              onClick={handleCalibrate}
              disabled={calibrating}
              style={{ fontSize: 13 }}
            >
              {calibrating ? 'Calibrating…' : '⚡ Run Auto-Calibration'}
            </button>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Created Examinations</h3>
            {exams.length === 0 ? (
              <p className="muted">No examinations created yet. Click "Create Exam" above to deploy your first assessment.</p>
            ) : (
              <div className="wide-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Duration</th>
                      <th>Questions</th>
                      <th>Total Candidates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((ex) => (
                      <tr key={ex.id}>
                        <td><strong>{ex.title}</strong></td>
                        <td><span className="badge">{ex.subject}</span></td>
                        <td>{Math.round(ex.durationSeconds / 60)} min</td>
                        <td>{ex.questionCount}</td>
                        <td>
                          {ex.submittedAttempts || 0} completed / {ex.totalAttempts || 0} started
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Link
                              to={`/faculty/progress/${ex.id}`}
                              className="secondary"
                              style={{ fontSize: 12, padding: '4px 8px' }}
                            >
                              🔴 Live Wall
                            </Link>
                            <Link
                              to={`/faculty/analytics/${ex.id}`}
                              className="primary"
                              style={{ fontSize: 12, padding: '4px 8px' }}
                            >
                              📊 Analytics
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
