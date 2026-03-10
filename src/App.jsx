import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Home, Clock, ChevronRight, Library, ArrowLeft, Book, CheckCircle, XCircle, PlayCircle, PieChart, TrendingUp, Trash2, Edit2, Check } from 'lucide-react';

// --- SM-2 アルゴリズム ---
const calculateSM2 = (quality, repetition, efactor, interval) => {
  let newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEfactor < 1.3) newEfactor = 1.3;

  let newRepetition = repetition;
  let newInterval = interval;

  if (quality >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEfactor);
    }
    newRepetition++;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  return { interval: newInterval, repetition: newRepetition, efactor: newEfactor };
};

// --- ヘルパー関数: 日付操作 ---
const getTodayStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  // --- 状態管理 ---
  const [books, setBooks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'books', 'bookDetail', 'study', 'analytics'
  const [selectedBookId, setSelectedBookId] = useState(null);
  
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // --- 初期データ読み込み ---
  useEffect(() => {
    const savedBooks = localStorage.getItem('toeic_sm2_books');
    if (savedBooks) {
      setBooks(JSON.parse(savedBooks));
    }
    const savedTasks = localStorage.getItem('toeic_sm2_tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map(t => ({
        ...t,
        status: t.status || 'learning',
        correctAnswer: t.correctAnswer || null,
        lastAnswer: t.lastAnswer || null
      }));
      setTasks(parsedTasks);
    }
  }, []);

  // --- データ保存 ---
  useEffect(() => {
    localStorage.setItem('toeic_sm2_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('toeic_sm2_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- 今日の復習タスクを取得 ---
  const todayStr = getTodayStr();
  const reviewTasks = tasks.filter(task => task.status === 'learning' && task.nextReviewDate <= todayStr);
  const newTasks = tasks.filter(task => task.status === 'new');

  const getBookName = (bookId) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : '削除された参考書';
  };

  // --- 画面遷移ハンドラ ---
  const startStudy = (type) => {
    const queue = type === 'new' ? newTasks : reviewTasks;
    if (queue.length === 0) return;
    setReviewQueue(queue);
    setCurrentReviewIndex(0);
    setView('study');
  };

  const startStudyFromTask = (selectedTask) => {
    const queue = tasks
      .filter(t => t.bookId === selectedTask.bookId && t.status === selectedTask.status)
      .sort((a, b) => a.questionNumber - b.questionNumber);
    
    const startIndex = queue.findIndex(t => t.id === selectedTask.id);
    
    if (startIndex !== -1) {
      setReviewQueue(queue);
      setCurrentReviewIndex(startIndex);
      setView('study');
    }
  };

  // --- コンポーネント: ナビゲーションバー ---
  const NavBar = () => (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50">
      <button 
        onClick={() => setView('dashboard')}
        className={`flex flex-col items-center p-2 w-20 ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <Home size={24} />
        <span className="text-xs mt-1 font-medium">ホーム</span>
      </button>
      <button 
        onClick={() => setView('books')}
        className={`flex flex-col items-center p-2 w-20 ${(view === 'books' || view === 'bookDetail') ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <Library size={24} />
        <span className="text-xs mt-1 font-medium">参考書</span>
      </button>
      <button 
        onClick={() => setView('analytics')}
        className={`flex flex-col items-center p-2 w-20 ${view === 'analytics' ? 'text-blue-600' : 'text-gray-500'}`}
      >
        <PieChart size={24} />
        <span className="text-xs mt-1 font-medium">分析</span>
      </button>
    </nav>
  );

  // --- コンポーネント: ダッシュボード ---
  const Dashboard = () => (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <BookOpen className="mr-2 text-blue-600" />
        TOEIC 分散学習帳
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
          <h2 className="text-sm font-semibold mb-1 opacity-90">新しい問題</h2>
          <div className="flex items-end mb-3">
            <span className="text-4xl font-bold mr-1">{newTasks.length}</span>
            <span className="text-sm opacity-90 mb-1">問</span>
          </div>
          <button
            onClick={() => startStudy('new')}
            disabled={newTasks.length === 0}
            className={`w-full py-2 rounded-lg font-bold text-sm flex justify-center items-center transition-colors
              ${newTasks.length > 0 ? 'bg-white text-green-600 hover:bg-gray-100 shadow' : 'bg-white/20 text-white cursor-not-allowed'}`}
          >
            <PlayCircle size={18} className="mr-1" /> 解く
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
          <h2 className="text-sm font-semibold mb-1 opacity-90">今日の復習</h2>
          <div className="flex items-end mb-3">
            <span className="text-4xl font-bold mr-1">{reviewTasks.length}</span>
            <span className="text-sm opacity-90 mb-1">問</span>
          </div>
          <button
            onClick={() => startStudy('review')}
            disabled={reviewTasks.length === 0}
            className={`w-full py-2 rounded-lg font-bold text-sm flex justify-center items-center transition-colors
              ${reviewTasks.length > 0 ? 'bg-white text-blue-600 hover:bg-gray-100 shadow' : 'bg-white/20 text-white cursor-not-allowed'}`}
          >
            <Clock size={18} className="mr-1" /> 復習
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
        <CheckCircle className="mr-2 text-gray-500" size={20} />
        直近の復習予定
      </h3>
      {tasks.filter(t => t.status === 'learning').length === 0 ? (
        <p className="text-gray-500 text-center py-8">復習待ちの問題がありません。</p>
      ) : (
        <div className="space-y-3">
          {[...tasks].filter(t => t.status === 'learning').sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate)).slice(0, 10).map(task => {
            const displayName = task.bookName || getBookName(task.bookId);
            return (
              <div 
                key={task.id} 
                onClick={() => startStudyFromTask(task)}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-semibold text-gray-800 truncate max-w-[180px]">{displayName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Part {task.part} | 問{task.questionNumber}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full mb-1 ${
                    task.nextReviewDate <= todayStr ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {task.nextReviewDate <= todayStr ? '今日' : `${task.nextReviewDate}`}
                  </span>
                  <span className="text-xs text-gray-400">連続: {task.repetition}回</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // --- コンポーネント: 参考書一覧 (Books) ---
  const BooksView = () => {
    const [newTitle, setNewTitle] = useState('');

    const handleAddBook = (e) => {
      e.preventDefault();
      if (!newTitle.trim()) return;
      
      const newBook = {
        id: crypto.randomUUID(),
        title: newTitle.trim(),
        createdAt: new Date().toISOString()
      };
      
      setBooks([...books, newBook]);
      setNewTitle('');
    };

    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Library className="mr-2 text-blue-600" />
          参考書一覧
        </h2>

        <form onSubmit={handleAddBook} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex space-x-2">
          <input 
            type="text" 
            placeholder="新しい参考書の名前 (例: でる1000問)"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newTitle.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            <PlusCircle size={24} />
          </button>
        </form>

        {books.length === 0 ? (
          <div className="text-center py-10">
            <Book size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">参考書が登録されていません。<br/>上のフォームから追加してください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {books.map(book => {
              const bookTasks = tasks.filter(t => t.bookId === book.id);
              const reviewCount = bookTasks.filter(t => t.nextReviewDate <= todayStr && t.status === 'learning').length;

              return (
                <div 
                  key={book.id} 
                  onClick={() => { setSelectedBookId(book.id); setView('bookDetail'); }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-50 p-3 rounded-lg mr-4">
                      <Book className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{book.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">登録問題数: {bookTasks.length}問</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {reviewCount > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full mr-2">
                        復習 {reviewCount}
                      </span>
                    )}
                    <ChevronRight className="text-gray-300" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    );
  };

  // --- コンポーネント: 参考書詳細 & 問題登録 (BookDetail) ---
  const BookDetailView = () => {
    const book = books.find(b => b.id === selectedBookId);
    const bookTasks = tasks.filter(t => t.bookId === selectedBookId);
    
    const [part, setPart] = useState('5');
    const [chapter, setChapter] = useState('');
    const [startNumber, setStartNumber] = useState('1');
    const [questionCount, setQuestionCount] = useState('30');
    const [isAdding, setIsAdding] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    // タイトル編集用ステート
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => {
      if (book) setEditTitle(book.title);
    }, [book]);

    if (!book) return (
      <div className="p-4 text-center"><p>参考書が見つかりません</p><button onClick={() => setView('books')}>戻る</button></div>
    );

    const handleUpdateTitle = () => {
      if (!editTitle.trim()) {
        setIsEditingTitle(false);
        setEditTitle(book.title);
        return;
      }
      setBooks(prevBooks => prevBooks.map(b => b.id === book.id ? { ...b, title: editTitle.trim() } : b));
      setIsEditingTitle(false);
    };

    const handleAddTasks = (e) => {
      e.preventDefault();
      const start = parseInt(startNumber, 10);
      const count = parseInt(questionCount, 10);
      if (isNaN(start) || isNaN(count) || count <= 0) return;

      const newTasks = [];
      for (let i = 0; i < count; i++) {
        newTasks.push({
          id: crypto.randomUUID(),
          bookId: book.id,
          part: part,
          page: chapter,
          questionNumber: start + i,
          status: 'new',
          correctAnswer: null,
          lastAnswer: null,
          interval: 0,
          repetition: 0,
          efactor: 2.5,
          nextReviewDate: getTodayStr(),
          createdAt: new Date().toISOString()
        });
      }

      setTasks([...tasks, ...newTasks]);
      setStartNumber(String(start + count));
      setIsAdding(false);
    };

    const handleDeleteBook = () => {
      setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
      setTasks(prevTasks => prevTasks.filter(t => t.bookId !== book.id));
      setView('books');
    };

    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setView('books')}
            className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
            参考書一覧へ戻る
          </button>

          {!isConfirmingDelete ? (
            <button 
              onClick={() => setIsConfirmingDelete(true)}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
              title="この参考書を削除"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <div className="flex items-center bg-red-50 px-3 py-1 rounded-lg border border-red-200 animate-fade-in-up">
              <span className="text-xs text-red-600 font-bold mr-3">削除しますか？</span>
              <button onClick={handleDeleteBook} className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mr-2 transition-colors">はい</button>
              <button onClick={() => setIsConfirmingDelete(false)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors">いいえ</button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          {/* 参考書名の編集UI */}
          {isEditingTitle ? (
            <div className="flex items-center mb-2">
              <Book className="mr-2 text-blue-600 flex-shrink-0" />
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 border-b-2 border-blue-500 outline-none text-2xl font-bold text-gray-800 bg-transparent py-1 w-full"
                autoFocus
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
              />
              <button onClick={handleUpdateTitle} className="ml-2 text-green-600 p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <Check size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center mb-2 group">
              <Book className="mr-2 text-blue-600 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-gray-800 truncate">{book.title}</h2>
              <button 
                onClick={() => setIsEditingTitle(true)}
                className="ml-2 text-gray-400 hover:text-blue-500 p-1 rounded-full transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}

          <div className="mt-3 mb-2">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-green-500" style={{ width: `${bookTasks.length ? (bookTasks.filter(t => t.status === 'graduated').length / bookTasks.length) * 100 : 0}%` }}></div>
              <div className="bg-blue-500" style={{ width: `${bookTasks.length ? (bookTasks.filter(t => t.status === 'learning').length / bookTasks.length) * 100 : 0}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            全{bookTasks.length}問 / マスター済:{bookTasks.filter(t => t.status === 'graduated').length}問 / 復習待ち:{bookTasks.filter(t => t.status === 'learning' && t.nextReviewDate <= todayStr).length}問
          </p>
        </div>

        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors flex justify-center items-center mb-6"
          >
            <PlusCircle className="mr-2" size={20} />
            問題を一括作成する
          </button>
        ) : (
          <form onSubmit={handleAddTasks} className="bg-white p-5 rounded-xl shadow-md border border-blue-100 mb-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">問題を一括作成</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">TOEIC Part</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={part}
                  onChange={(e) => setPart(e.target.value)}
                >
                  <option value="1">Part 1 (写真描写)</option>
                  <option value="2">Part 2 (応答問題)</option>
                  <option value="3">Part 3 (会話問題)</option>
                  <option value="4">Part 4 (説明文問題)</option>
                  <option value="5">Part 5 (短文穴埋め)</option>
                  <option value="6">Part 6 (長文穴埋め)</option>
                  <option value="7">Part 7 (長文読解)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">チャプター等 (任意)</label>
                <input 
                  type="text" placeholder="例: Test 1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={chapter} onChange={(e) => setChapter(e.target.value)}
                />
              </div>

              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">開始問題番号</label>
                  <input 
                    type="number" required placeholder="例: 1" min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={startNumber} onChange={(e) => setStartNumber(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">登録問題数</label>
                  <input 
                    type="number" required placeholder="例: 30" min="1"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-2">
                一括作成する
              </button>
            </div>
          </form>
        )}

        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">登録済み問題 (最大100件表示)</h3>
        {bookTasks.length === 0 ? (
          <p className="text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">問題がありません</p>
        ) : (
          <div className="space-y-2">
            {[...bookTasks].sort((a, b) => a.questionNumber - b.questionNumber).slice(0, 100).map(task => (
              <div 
                key={task.id} 
                onClick={() => startStudyFromTask(task)}
                className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center text-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <span className="inline-block bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-xs mr-2">Part {task.part}</span>
                  <span className="font-medium">
                    {task.page && `${task.page} - `}問{task.questionNumber}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  task.status === 'graduated' ? 'bg-green-50 text-green-600' : 
                  task.status === 'new' ? 'bg-blue-50 text-blue-600' :
                  task.nextReviewDate <= todayStr ? 'bg-red-50 text-red-600' : 'text-gray-400'
                }`}>
                  {task.status === 'graduated' ? 'マスター済' : 
                   task.status === 'new' ? '未着手' :
                   task.nextReviewDate <= todayStr ? '今日復習' : `${task.nextReviewDate}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // --- コンポーネント: 学習・復習モード (StudySession) ---
  const StudySession = () => {
    const task = reviewQueue[currentReviewIndex];
    const [step, setStep] = useState('select_answer'); // 'select_answer', 'input_correct', 'result'
    const [userAnswer, setUserAnswer] = useState(null);
    const [actualCorrect, setActualCorrect] = useState(null);
    const [isCorrect, setIsCorrect] = useState(false);

    if (!task) return null;
    const displayName = task.bookName || getBookName(task.bookId);
    
    const options = String(task.part) === '2' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];

    // ユーザーが選択肢をタップした時
    const handleAnswerSelect = (choice) => {
      setUserAnswer(choice);
      if (task.correctAnswer) {
        // 2回目以降は即座に判定
        const correct = (choice === task.correctAnswer);
        setIsCorrect(correct);
        setActualCorrect(task.correctAnswer);
        setStep('result');
      } else {
        // 初見は実際の正解を聞く
        setStep('input_correct');
      }
    };

    // 実際の正解を入力した時 (初見 or 修正時)
    const handleCorrectInput = (choice) => {
      setActualCorrect(choice);
      const correct = (userAnswer === choice);
      setIsCorrect(correct);
      setStep('result');
    };

    // 次の問題へ＆データ更新
    const handleNext = () => {
      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === task.id) {
          let updatedTask = { ...t, lastAnswer: userAnswer };
          
          // 正解データを記録・上書き修正
          if (actualCorrect) {
            updatedTask.correctAnswer = actualCorrect;
          }

          if (isCorrect) {
            const { interval, repetition, efactor } = calculateSM2(4, t.repetition, t.efactor, t.interval);
            updatedTask = { ...updatedTask, interval, repetition, efactor, nextReviewDate: addDays(todayStr, interval), status: 'learning' };
            
            if (updatedTask.repetition >= 3) {
              updatedTask.status = 'graduated';
            }
          } else {
            updatedTask.status = 'learning';
            const { interval, repetition, efactor } = calculateSM2(0, t.repetition, t.efactor, t.interval);
            updatedTask = { ...updatedTask, interval, repetition, efactor, nextReviewDate: addDays(todayStr, interval) };
          }
          return updatedTask;
        }
        return t;
      }));

      if (currentReviewIndex < reviewQueue.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
        setStep('select_answer');
        setUserAnswer(null);
        setActualCorrect(null);
      } else {
        setView('dashboard');
      }
    };

    return (
      <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
        <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
          <span className="text-gray-500 font-medium text-sm">
            {task.status === 'new' ? '新規学習' : '復習'} {currentReviewIndex + 1} / {reviewQueue.length}
          </span>
          <button 
            onClick={() => setView('dashboard')}
            className="text-sm text-gray-500 hover:text-gray-800 bg-gray-100 px-3 py-1 rounded-full"
          >
            中断する
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
          <div className="w-full bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100 mb-6 mt-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
              Part {task.part}
            </span>
            <h2 className="text-lg font-bold text-gray-800 mb-1 leading-tight">
              {displayName}
            </h2>
            <div className="text-lg text-gray-600 font-medium flex justify-center items-center space-x-3 mt-2">
              {task.page && <span>{task.page}</span>}
              {task.page && <span className="w-1 h-1 bg-gray-400 rounded-full"></span>}
              <span>問 {task.questionNumber}</span>
            </div>
          </div>

          {step === 'select_answer' && (
            <div className="w-full animate-fade-in-up">
              <p className="text-center text-gray-600 font-medium mb-6">実際の解答を選んでください</p>
              <div className="grid grid-cols-2 gap-3">
                {/* ボタンのサイズ(py, textサイズ)を調整 */}
                {options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswerSelect(opt)}
                    className="bg-white border border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-bold py-4 rounded-xl text-lg shadow-sm transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'input_correct' && (
            <div className="w-full animate-fade-in-up">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-center">
                <p className="text-orange-800 font-medium">あなたの解答: <span className="font-bold text-xl ml-2">{userAnswer}</span></p>
                
                <button 
                  onClick={() => { setStep('select_answer'); setUserAnswer(null); }}
                  className="mt-2 text-sm text-orange-600 underline hover:text-orange-800 transition-colors"
                >
                  解答を選び直す
                </button>
                
                <div className="mt-4 pt-3 border-t border-orange-200">
                  <p className="text-sm text-orange-700">答え合わせをして、実際の正解を選択してください。</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* こちらのボタンも同様にサイズを調整 */}
                {options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleCorrectInput(opt)}
                    className="bg-white border border-green-200 hover:border-green-500 hover:bg-green-50 text-green-700 font-bold py-3 rounded-xl text-base shadow-sm transition-all"
                  >
                    {opt} が正解
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="w-full animate-fade-in-up flex flex-col items-center">
              <div className="text-center mb-6">
                {isCorrect ? (
                  <CheckCircle size={80} className="mx-auto text-green-500 mb-2" />
                ) : (
                  <XCircle size={80} className="mx-auto text-red-500 mb-2" />
                )}
                <h2 className={`text-3xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? '正解！' : '不正解...'}
                </h2>
              </div>

              <div className="w-full bg-white border border-gray-200 p-5 rounded-2xl shadow-sm mb-6 flex justify-between items-center text-lg">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-500 mb-1">あなたの解答</span>
                  <span className={`font-bold text-3xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {userAnswer}
                  </span>
                </div>
                <div className="w-px h-12 bg-gray-200 mx-2"></div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs text-gray-500 mb-1">実際の正解</span>
                  <span className="font-bold text-3xl text-blue-600">
                    {actualCorrect}
                  </span>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex justify-center items-center text-lg hover:bg-blue-700 transition-colors mb-6"
              >
                次へ進む <ChevronRight className="ml-2" />
              </button>

              <div className="flex space-x-6 text-sm">
                <button 
                  onClick={() => { setStep('select_answer'); setUserAnswer(null); setActualCorrect(null); }}
                  className="text-gray-500 hover:text-gray-800 underline transition-colors"
                >
                  解答を選び直す
                </button>
                <button 
                  onClick={() => { setStep('input_correct'); setActualCorrect(null); }}
                  className="text-gray-500 hover:text-gray-800 underline transition-colors"
                >
                  正解データを修正する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- コンポーネント: 分析画面 (AnalyticsView) ---
  const AnalyticsView = () => {
    const totalTasks = tasks.length;
    const graduatedTasks = tasks.filter(t => t.status === 'graduated').length;
    const learningTasks = tasks.filter(t => t.status === 'learning').length;
    const newTasks = tasks.filter(t => t.status === 'new').length;
    
    const weakTasks = tasks.filter(t => t.status === 'learning' && t.repetition === 0).length;
    const learningButOkayTasks = learningTasks - weakTasks;

    const gradPct = totalTasks > 0 ? ((graduatedTasks / totalTasks) * 100).toFixed(1) : 0;
    const learnPct = totalTasks > 0 ? ((learningTasks / totalTasks) * 100).toFixed(1) : 0;
    const newPct = totalTasks > 0 ? ((newTasks / totalTasks) * 100).toFixed(1) : 0;

    const weakPctInLearning = learningTasks > 0 ? ((weakTasks / learningTasks) * 100).toFixed(1) : 0;
    const weakDeg = learningTasks > 0 ? (weakTasks / learningTasks) * 360 : 0;

    return (
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <PieChart className="mr-2 text-blue-600" />
          学習データ分析
        </h2>

        {totalTasks === 0 ? (
          <p className="text-gray-500 text-center py-8">まだ問題が登録されていません。</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
                <TrendingUp className="mr-2 text-green-500" size={20} />
                全体の習得率
              </h3>
              <div className="flex items-end mb-2">
                <span className="text-4xl font-bold text-green-600 mr-1">{gradPct}</span>
                <span className="text-lg text-gray-500 font-medium mb-1">%</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">マスター済 {graduatedTasks}問 / 全 {totalTasks}問</p>
              
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                <div className="bg-green-500 transition-all duration-500" style={{ width: `${gradPct}%` }}></div>
                <div className="bg-blue-400 transition-all duration-500" style={{ width: `${learnPct}%` }}></div>
                <div className="bg-gray-300 transition-all duration-500" style={{ width: `${newPct}%` }}></div>
              </div>
              
              <div className="flex justify-between text-xs font-medium text-gray-500 px-1">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>マスター</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 mr-1"></span>復習中</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-300 mr-1"></span>未着手</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-700 mb-4">復習中の問題の内訳</h3>
              {learningTasks === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">復習中の問題はありません。</p>
              ) : (
                <div className="flex items-center">
                  <div className="w-24 h-24 rounded-full relative mr-6 flex-shrink-0" 
                       style={{ backgroundImage: `conic-gradient(#EF4444 ${weakDeg}deg, #60A5FA ${weakDeg}deg 360deg)` }}>
                    <div className="absolute inset-2 bg-white rounded-full flex justify-center items-center">
                      <span className="font-bold text-gray-700">{weakPctInLearning}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-3">
                      <div className="flex items-center text-sm font-bold text-red-600 mb-1">
                        <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        苦手・要対策
                      </div>
                      <div className="text-xs text-gray-500 ml-5">{weakTasks}問 (直近で不正解)</div>
                    </div>
                    <div>
                      <div className="flex items-center text-sm font-bold text-blue-500 mb-1">
                        <span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
                        順調に記憶中
                      </div>
                      <div className="text-xs text-gray-500 ml-5">{learningButOkayTasks}問 (連続正解中)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {view === 'dashboard' && <Dashboard />}
      {view === 'books' && <BooksView />}
      {view === 'bookDetail' && <BookDetailView />}
      {view === 'study' && <StudySession />}
      {view === 'analytics' && <AnalyticsView />}
      
      {view !== 'study' && <NavBar />}
    </div>
  );
}