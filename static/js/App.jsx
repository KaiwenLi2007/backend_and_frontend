const { useState, useEffect } = React;

function App() {
    const [history, setHistory] = useState([]);
    const [topic, setTopic] = useState('');
    const [currentResult, setCurrentResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/history');
            const data = await res.json();
            setHistory(data);
        } catch (err) {
            console.error('History load failed', err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setLoading(true);
        setStatus({ message: '', type: '' });

        try {
            const res = await fetch('/get-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            const data = await res.json();

            if (!res.ok) {
                handleError(res.status, data.error);
            } else {
                setCurrentResult(data);
                fetchHistory();
            }
        } catch (err) {
            setStatus({ message: 'Network error. Server might be waking up.', type: 'info' });
        } finally {
            setLoading(false);
        }
    };

    const handleError = (status, msg) => {
        let displayMsg = msg || 'An error occurred.';
        let type = 'error';

        if (status === 500 && msg.includes('Missing configuration')) {
            displayMsg = 'API Keys missing. Please configure your environment.';
        } else if (status === 404) {
            displayMsg = 'No news found for this topic.';
            type = 'info';
        }

        setStatus({ message: displayMsg, type });
        setCurrentResult(null);
    };

    const loadFromHistory = (item) => {
        setTopic(item.topic);
        setCurrentResult(item);
        setStatus({ message: '', type: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-80 bg-black/40 backdrop-blur-2xl border-r border-white/5 p-8 hidden md:flex flex-col">
                <h2 className="text-xs font-bold text-accent uppercase tracking-widest mb-10">Search History</h2>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No history yet.</p>
                    ) : (
                        history.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => loadFromHistory(item)}
                                className="p-4 bg-white/5 rounded-2xl border border-transparent hover:border-accent/30 hover:bg-accent/5 cursor-pointer transition-all animate-slide-in"
                            >
                                <div className="font-semibold text-sm truncate">{item.topic}</div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 md:p-20 max-w-5xl mx-auto flex flex-col items-center">
                <header className="text-center mb-16">
                    <h1 className="text-5xl font-semibold mb-4 tracking-tight">
                        News <span className="text-accent underline decoration-accent/30">Intelligence</span> Engine
                    </h1>
                    <p className="text-gray-400 text-lg font-light">
                        Premium synthesis of global events, powered by Gemini 2.0.
                    </p>
                </header>

                <form onSubmit={handleSearch} className="w-full max-w-2xl flex gap-4 mb-20 relative">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Search for a topic (e.g. Quantum Computing)..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-lg"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-accent flex items-center justify-center min-w-[140px]"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Analyze'}
                    </button>
                </form>

                {status.message && (
                    <div className={`mb-10 px-8 py-4 rounded-xl border animate-fade-in ${status.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-accent/5 border-accent/20 text-accent'
                        }`}>
                        {status.message}
                    </div>
                )}

                {currentResult && (
                    <section className="w-full max-w-3xl glass p-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-start mb-10 border-b border-white/5 pb-6">
                            <h2 className="text-3xl font-bold">{currentResult.topic}</h2>
                            <div className={`vibe-badge vibe-${currentResult.sentiment.toLowerCase()}`}>
                                {currentResult.sentiment}
                            </div>
                        </div>
                        <div className="space-y-8">
                            {currentResult.summary.split('\n').filter(p => p.trim()).map((point, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-2 h-2 rounded-full bg-accent mt-2.5 group-hover:scale-125 transition-transform shadow-[0_0_8px_#58a6ff]"></div>
                                    <p className="flex-1 text-lg text-gray-200 leading-relaxed">
                                        {point.replace(/^[-•*]\s*/, '')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
