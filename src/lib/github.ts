import { Octokit } from '@octokit/rest';

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  created_at: string;
}

export interface LanguageStats {
  [lang: string]: number;
}

export interface CommitActivity {
  date: string;
  count: number;
  hour: number;
}

export interface RepoSummary {
  name: string;
  language: string | null;
  stars: number;
  forks: number;
  size: number;
  updated_at: string;
}

export interface DNAData {
  profile: GitHubProfile;
  languages: LanguageStats;
  commits: CommitActivity[];
  repos: RepoSummary[];
  totalCommits: number;
  nightOwlScore: number; // 0-1
  polyglotScore: number;
  activityRhythm: number[]; // 24 hours
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
};

export function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] || '#888888';
}

export async function fetchGitHubData(
  username: string,
  token?: string
): Promise<DNAData> {
  const octokit = new Octokit(token ? { auth: token } : {});

  // 1. Profile
  const { data: profile } = await octokit.users.getByUsername({ username });

  // 2. Repos (up to 100)
  const { data: repos } = await octokit.repos.listForUser({
    username,
    per_page: 100,
    sort: 'updated',
  });

  // 3. Aggregate languages
  const languages: LanguageStats = {};
  let totalSize = 0;

  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + (repo.size || 1);
      totalSize += repo.size || 1;
    }
  }

  // Normalize languages
  for (const lang in languages) {
    languages[lang] = Math.round((languages[lang] / totalSize) * 1000) / 10;
  }

  // 4. Recent commit activity (last ~90 days via events or commits on top repos)
  // Using public events for simplicity (no token needed for public)
  const commits: CommitActivity[] = [];
  const hourCounts = new Array(24).fill(0);
  let totalCommits = 0;

  try {
    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100,
    });

    for (const event of events) {
      if (event.type === 'PushEvent' && event.payload && 'commits' in event.payload) {
        const push = event.payload as any;
        const count = push.commits?.length || 1;
        const date = new Date(event.created_at!);
        commits.push({
          date: date.toISOString().slice(0, 10),
          count,
          hour: date.getHours(),
        });
        hourCounts[date.getHours()] += count;
        totalCommits += count;
      }
    }
  } catch (e) {
    console.warn('Could not fetch events, using fallback', e);
  }

  // Night owl score: ratio of commits between 22:00-05:00
  const nightHours = hourCounts.slice(22).concat(hourCounts.slice(0, 6));
  const nightSum = nightHours.reduce((a, b) => a + b, 0);
  const nightOwlScore = totalCommits > 0 ? nightSum / totalCommits : 0.3;

  // Polyglot: number of languages with >5%
  const significantLangs = Object.values(languages).filter((v) => v >= 5).length;
  const polyglotScore = Math.min(significantLangs / 6, 1);

  const repoSummaries: RepoSummary[] = repos.slice(0, 20).map((r) => ({
    name: r.name,
    language: r.language,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    size: r.size || 0,
    updated_at: r.updated_at || '',
  }));

  return {
    profile: {
      login: profile.login,
      name: profile.name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      public_repos: profile.public_repos,
      followers: profile.followers,
      created_at: profile.created_at,
    },
    languages,
    commits,
    repos: repoSummaries,
    totalCommits,
    nightOwlScore,
    polyglotScore,
    activityRhythm: hourCounts,
  };
}
