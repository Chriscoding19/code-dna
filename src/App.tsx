import { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import DNAHelix from './components/DNAHelix';
import { fetchGitHubData, DNAData, getLanguageColor } from './lib/github';
import { generateDNASequence, DNASequence } from './lib/dna';
import { playGenome, stopAudio, isAudioPlaying } from './lib/audio';
import html2canvas from 'html2canvas';

function GenomeView() {
  const { username: urlUsername } = useParams();
  const navigate = useNavigate();
  const captureRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState(urlUsername || '');
  const [compareUser, setCompareUser] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DNAData | null>(null);
  const [sequence, setSequence] = useState<DNASequence | null>(null);
  const [compareData, setCompareData] = useState<DNAData | null>(null);
  const [compareSequence, setCompareSequence] = useState<DNASequence | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'single' | 'compare'>('single');

  // Load from URL
  useEffect(() => {
    if (urlUsername && urlUsername !== username) {
      setUsername(urlUsername);
      loadGenome(urlUsername);
    }
  }, [urlUsername]);

  async function loadGenome(user: string, isCompare = false) {
    if (!user.trim()) return;
    setLoading(true);
    setError(null);
    if (!isCompare) {
      setData(null);
      setSequence(null);
    }

    try {
      const dnaData = await fetchGitHubData(user.trim(), token.trim() || undefined);
      const seq = generateDNASequence(dnaData);

      if (isCompare) {
        setCompareData(dnaData);
        setCompareSequence(seq);
      } else {
        setData(dnaData);
        setSequence(seq);
        // Update URL without reload
        if (user !== urlUsername) {
          navigate(`/u/${user}`, { replace: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message?.includes('rate limit')
          ? 'GitHub rate limit hit. Add a personal access token for higher limits.'
          : err?.message || 'Failed to fetch GitHub data. Check the username.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    stopAudio();
    setPlaying(false);
    setCompareData(null);
    setCompareSequence(null);
    setMode('single');
    await loadGenome(username);
  }

  async function handleCompare() {
    if (!username.trim() || !compareUser.trim()) return;
    stopAudio();
    setPlaying(false);
    setMode('compare');
    setLoading(true);
    try {
      const [d1, d2] = await Promise.all([
        fetchGitHubData(username.trim(), token.trim() || undefined),
        fetchGitHubData(compareUser.trim(), token.trim() || undefined),
      ]);
      setData(d1);
      setSequence(generateDNASequence(d1));
      setCompareData(d2);
      setCompareSequence(generateDNASequence(d2));
      navigate(`/u/${username}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Compare failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlay() {
    if (!sequence || !data) return;
    if (isAudioPlaying()) {
      stopAudio();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setProgress(0);
    await playGenome(sequence, data, (p) => {
      setProgress(p);
      if (p >= 1) setPlaying(false);
    });
  }

  async function handleExport() {
    if (!captureRef.current) return;
    const canvas = await html2canvas(captureRef.current, {
      backgroundColor: '#07070f',
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = `codedna-${data?.profile.login || 'genome'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function handleShare() {
    const url = `${window.location.origin}/u/${data?.profile.login}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #1e1e3f',
          background: 'rgba(7, 7, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CodeDNA
            </h1>
          </Link>
          <p style={{ margin: '0.2rem 0 0', opacity: 0.65, fontSize: '0.9rem' }}>
            Turn any GitHub profile into a living genetic code
          </p>
        </div>

        {data && (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleExport}
              style={{
                padding: '0.55rem 1rem',
                background: '#1e1e3f',
                color: '#c4b5fd',
                border: '1px solid #3b3b6d',
                borderRadius: 8,
                fontSize: '0.85rem',
              }}
            >
              Export PNG
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: '0.55rem 1rem',
                background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                color: 'white',
                borderRadius: 8,
                fontSize: '0.85rem',
              }}
            >
              Copy Share Link
            </button>
          </div>
        )}
      </header>

      {/* Controls */}
      <div
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          borderBottom: '1px solid #1e1e3f',
          background: 'rgba(10, 10, 20, 0.5)',
        }}
      >
        <input
          type="text"
          placeholder="GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          style={{ flex: '1 1 160px', maxWidth: 220 }}
        />
        <input
          type="text"
          placeholder="Compare with..."
          value={compareUser}
          onChange={(e) => setCompareUser(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
          style={{ flex: '1 1 140px', maxWidth: 180 }}
        />
        <input
          type="password"
          placeholder="Optional token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: '1 1 140px', maxWidth: 180 }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !username.trim()}
          style={{
            padding: '0.7rem 1.3rem',
            background: loading ? '#333' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            color: 'white',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Sequencing…' : 'Generate'}
        </button>
        <button
          onClick={handleCompare}
          disabled={loading || !username.trim() || !compareUser.trim()}
          style={{
            padding: '0.7rem 1.1rem',
            background: '#1e1e3f',
            color: '#c4b5fd',
            border: '1px solid #4f46e5',
          }}
        >
          Compare
        </button>
      </div>

      {error && (
        <div
          style={{
            margin: '1rem 2rem',
            padding: '1rem',
            background: '#3f1f1f',
            border: '1px solid #7f1d1d',
            borderRadius: 8,
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      {/* Main content */}
      {data && sequence && (
        <div
          ref={captureRef}
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: mode === 'compare' && compareData
              ? '1fr 1fr'
              : 'minmax(320px, 1fr) minmax(300px, 380px)',
            gap: '1.25rem',
            padding: '1.25rem 2rem',
          }}
        >
          {/* Left: Helix(es) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                background: 'rgba(10, 10, 22, 0.7)',
                borderRadius: 16,
                border: '1px solid #2a2a4a',
                overflow: 'hidden',
                minHeight: 500,
              }}
            >
              <DNAHelix sequence={sequence} />
            </div>

            {mode === 'compare' && compareSequence && (
              <div
                style={{
                  background: 'rgba(10, 10, 22, 0.7)',
                  borderRadius: 16,
                  border: '1px solid #2a2a4a',
                  overflow: 'hidden',
                  minHeight: 420,
                }}
              >
                <div style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', opacity: 0.7 }}>
                  {compareData?.profile.login}
                </div>
                <DNAHelix sequence={compareSequence} />
              </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Profile */}
            <ProfileCard data={data} />

            {/* Genome Report */}
            <Card title="Genome Report">
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, opacity: 0.88 }}>
                {sequence.summary}
              </p>
            </Card>

            {/* Traits */}
            <Card title="Traits">
              <TraitBar label="Night Owl" value={data.nightOwlScore} color="#818cf8" />
              <div style={{ height: 10 }} />
              <TraitBar label="Polyglot" value={data.polyglotScore} color="#c084fc" />
              <div style={{ fontSize: '0.8rem', opacity: 0.55, marginTop: 10 }}>
                ~{data.totalCommits} recent push events sampled
              </div>
            </Card>

            {/* Languages */}
            <Card title="Language Composition">
              {Object.entries(data.languages)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([lang, pct]) => (
                  <div
                    key={lang}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 3,
                        background: getLanguageColor(lang),
                      }}
                    />
                    <span style={{ flex: 1, fontSize: '0.85rem' }}>{lang}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.55 }}>{pct}%</span>
                  </div>
                ))}
            </Card>

            {/* Top Repos */}
            {data.repos.length > 0 && (
              <Card title="Top Repositories">
                {data.repos
                  .sort((a, b) => b.stars - a.stars)
                  .slice(0, 5)
                  .map((repo) => (
                    <div
                      key={repo.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem',
                        marginBottom: 7,
                        gap: 8,
                      }}
                    >
                      <span style={{ opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {repo.name}
                      </span>
                      <span style={{ opacity: 0.5, whiteSpace: 'nowrap' }}>
                        ★ {repo.stars}
                      </span>
                    </div>
                  ))}
              </Card>
            )}

            {/* Compare result */}
            {mode === 'compare' && compareData && (
              <Card title={`vs ${compareData.profile.login}`}>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <div>Night Owl: {Math.round(data.nightOwlScore * 100)}% vs {Math.round(compareData.nightOwlScore * 100)}%</div>
                  <div>Polyglot: {Math.round(data.polyglotScore * 100)}% vs {Math.round(compareData.polyglotScore * 100)}%</div>
                  <div>Repos: {data.profile.public_repos} vs {compareData.profile.public_repos}</div>
                  <div style={{ marginTop: 6, opacity: 0.7 }}>
                    Dominant: {sequence.dominantLanguage} vs {compareSequence?.dominantLanguage}
                  </div>
                </div>
              </Card>
            )}

            {/* Play button */}
            <button
              onClick={handlePlay}
              style={{
                padding: '1rem',
                background: playing
                  ? 'linear-gradient(90deg, #7f1d1d, #991b1b)'
                  : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                color: 'white',
                fontSize: '1rem',
                borderRadius: 10,
              }}
            >
              {playing ? `Stop (${Math.round(progress * 100)}%)` : '▶ Play Genome Soundtrack'}
            </button>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.55,
            fontSize: '1.1rem',
            padding: '3rem',
            textAlign: 'center',
            gap: '0.8rem',
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>🧬</div>
          <div>Enter a GitHub username to extract its unique CodeDNA sequence</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            Try <code style={{ background: '#1e1e3f', padding: '2px 8px', borderRadius: 4 }}>torvalds</code> or{' '}
            <code style={{ background: '#1e1e3f', padding: '2px 8px', borderRadius: 4 }}>gaearon</code>
          </div>
        </div>
      )}

      <footer
        style={{
          padding: '1rem 2rem',
          textAlign: 'center',
          fontSize: '0.78rem',
          opacity: 0.35,
          borderTop: '1px solid #1e1e3f',
        }}
      >
        CodeDNA · Your commits become biology · Share your genome
      </footer>
    </div>
  );
}

function ProfileCard({ data }: { data: DNAData }) {
  return (
    <div
      style={{
        background: 'rgba(15, 15, 30, 0.75)',
        borderRadius: 12,
        padding: '1.1rem',
        border: '1px solid #2a2a4a',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
      }}
    >
      <img
        src={data.profile.avatar_url}
        alt={data.profile.login}
        style={{
          width: 62,
          height: 62,
          borderRadius: '50%',
          border: '2px solid #6366f1',
        }}
      />
      <div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
          {data.profile.name || data.profile.login}
        </div>
        <div style={{ opacity: 0.65, fontSize: '0.88rem' }}>@{data.profile.login}</div>
        <div style={{ fontSize: '0.82rem', marginTop: 3, opacity: 0.55 }}>
          {data.profile.public_repos} repos · {data.profile.followers} followers
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(15, 15, 30, 0.75)',
        borderRadius: 12,
        padding: '1.1rem',
        border: '1px solid #2a2a4a',
      }}
    >
      <h3 style={{ margin: '0 0 0.7rem', fontSize: '0.95rem', color: '#a5b4fc' }}>{title}</h3>
      {children}
    </div>
  );
}

function TraitBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.65 }}>{Math.round(value * 100)}%</span>
      </div>
      <div
        style={{
          height: 7,
          background: '#1e1e3f',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value * 100}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.7s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GenomeView />} />
        <Route path="/u/:username" element={<GenomeView />} />
      </Routes>
    </BrowserRouter>
  );
}
