import { useEffect, useState } from 'preact/hooks';

interface Feed {
	name: string;
	url: string;
}

interface FeedItem {
	title: string;
	link: string;
	date: Date;
	source: string;
}

interface Props {
	feeds: Feed[];
}

const CORS_PROXIES = [
	(url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
	(url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<string> {
	for (const proxyFn of CORS_PROXIES) {
		try {
			const proxyUrl = proxyFn(url);
			const response = await fetch(proxyUrl);
			if (response.ok) {
				return await response.text();
			}
		} catch {
			continue;
		}
	}
	throw new Error('All proxies failed');
}

async function fetchFeed(feed: Feed): Promise<FeedItem[]> {
	try {
		const text = await fetchWithProxy(feed.url);
		const parser = new DOMParser();
		const xml = parser.parseFromString(text, 'text/xml');

		const items: FeedItem[] = [];

		// Try RSS format
		const rssItems = xml.querySelectorAll('item');
		rssItems.forEach((item) => {
			const title = item.querySelector('title')?.textContent || 'Untitled';
			const link = item.querySelector('link')?.textContent || '#';
			const pubDate = item.querySelector('pubDate')?.textContent;
			const date = pubDate ? new Date(pubDate) : new Date();

			items.push({ title, link, date, source: feed.name });
		});

		// Try Atom format
		const atomEntries = xml.querySelectorAll('entry');
		atomEntries.forEach((entry) => {
			const title = entry.querySelector('title')?.textContent || 'Untitled';
			const linkEl = entry.querySelector('link[href]');
			const link = linkEl?.getAttribute('href') || '#';
			const published =
				entry.querySelector('published')?.textContent ||
				entry.querySelector('updated')?.textContent;
			const date = published ? new Date(published) : new Date();

			items.push({ title, link, date, source: feed.name });
		});

		return items;
	} catch (error) {
		console.error(`Error fetching ${feed.name}:`, error);
		return [];
	}
}

function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

function getTimeCategory(date: Date): 'today' | 'week' | 'older' {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	const diffDays = diffMs / (1000 * 60 * 60 * 24);

	if (diffHours <= 24) return 'today';
	if (diffDays <= 7) return 'week';
	return 'older';
}

const styles = {
	controls: {
		marginBottom: '1.5rem',
	},
	topRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '0.5rem',
	},
	filter: {
		display: 'flex',
		gap: '0.5rem',
		flexWrap: 'wrap' as const,
		marginTop: '0.75rem',
	},
	button: {
		background: 'none',
		border: '1px solid #e0e0e0',
		padding: '0.25rem 0.75rem',
		fontSize: '0.875rem',
		fontFamily: 'inherit',
		cursor: 'pointer',
		color: '#666666',
		transition: 'all 150ms ease',
	},
	buttonActive: {
		background: '#1a1a1a',
		color: '#ffffff',
		borderColor: '#1a1a1a',
	},
	status: {
		color: '#666666',
	},
	list: {
		listStyle: 'none',
		padding: 0,
		margin: 0,
	},
	listItem: {
		marginBottom: '0.5rem',
	},
	entry: {
		display: 'flex',
		gap: '0.5rem',
		alignItems: 'baseline',
		flexWrap: 'wrap' as const,
	},
	date: {
		fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
		fontSize: '0.875rem',
		color: '#666666',
		flexShrink: 0,
	},
	separator: {
		color: '#666666',
	},
	title: {
		color: '#1a1a1a',
		textDecoration: 'none',
	},
	source: {
		fontSize: '0.875rem',
		color: '#666666',
	},
	sectionDivider: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		margin: '1.5rem 0 1rem',
		color: '#666666',
		fontSize: '0.75rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.1em',
	},
	dividerLine: {
		flex: 1,
		height: '1px',
		background: '#e0e0e0',
	},
};

export default function FeedReader({ feeds }: Props) {
	const [items, setItems] = useState<FeedItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(feeds.map((f) => f.name)));
	const [showFilters, setShowFilters] = useState(false);

	const sources = feeds.map((f) => f.name);
	const allSelected = selectedSources.size === sources.length;

	const toggleSource = (source: string) => {
		const newSelected = new Set(selectedSources);
		if (newSelected.has(source)) {
			newSelected.delete(source);
		} else {
			newSelected.add(source);
		}
		setSelectedSources(newSelected);
	};

	const toggleAll = () => {
		if (allSelected) {
			setSelectedSources(new Set());
		} else {
			setSelectedSources(new Set(sources));
		}
	};

	useEffect(() => {
		async function loadFeeds() {
			setLoading(true);
			setError(false);

			const results = await Promise.all(feeds.map((feed) => fetchFeed(feed)));
			const allItems = results.flat();

			if (allItems.length === 0) {
				setError(true);
			} else {
				allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
				setItems(allItems);
			}

			setLoading(false);
		}

		loadFeeds();
	}, [feeds]);

	const filteredItems = items.filter((item) => selectedSources.has(item.source));

	const handleRefresh = () => {
		setItems([]);
		setLoading(true);
		setError(false);

		Promise.all(feeds.map((feed) => fetchFeed(feed))).then((results) => {
			const allItems = results.flat();
			if (allItems.length === 0) {
				setError(true);
			} else {
				allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
				setItems(allItems);
			}
			setLoading(false);
		});
	};

	// Group items by time category
	const todayItems = filteredItems.filter((item) => getTimeCategory(item.date) === 'today');
	const weekItems = filteredItems.filter((item) => getTimeCategory(item.date) === 'week');
	const olderItems = filteredItems.filter((item) => getTimeCategory(item.date) === 'older');

	const renderItem = (item: FeedItem, i: number) => (
		<li key={`${item.link}-${i}`} style={styles.listItem}>
			<div style={styles.entry}>
				<time style={styles.date}>{formatDate(item.date)}</time>
				<span style={styles.separator}>—</span>
				<a
					style={styles.title}
					href={item.link}
					target="_blank"
					rel="noreferrer"
					onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
					onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
				>
					{item.title}
				</a>
				<span style={styles.source}>({item.source})</span>
			</div>
		</li>
	);

	const renderDivider = (label: string) => (
		<div style={styles.sectionDivider}>
			<span style={styles.dividerLine}></span>
			<span>{label}</span>
			<span style={styles.dividerLine}></span>
		</div>
	);

	return (
		<div>
			<div style={styles.controls}>
				<div style={styles.topRow}>
					<button
						style={{
							...styles.button,
							...(showFilters ? styles.buttonActive : {}),
						}}
						onClick={() => setShowFilters(!showFilters)}
					>
						Filter
					</button>
					<button
						style={{
							...styles.button,
							opacity: loading ? 0.5 : 1,
							cursor: loading ? 'not-allowed' : 'pointer',
						}}
						onClick={handleRefresh}
						disabled={loading}
					>
						{loading ? 'Loading...' : 'Refresh'}
					</button>
				</div>
				{showFilters && (
					<div style={styles.filter}>
						<button
							style={{
								...styles.button,
								...(allSelected ? styles.buttonActive : {}),
							}}
							onClick={toggleAll}
						>
							All
						</button>
						{sources.map((source) => (
							<button
								key={source}
								style={{
									...styles.button,
									...(selectedSources.has(source) ? styles.buttonActive : {}),
								}}
								onClick={() => toggleSource(source)}
							>
								{source}
							</button>
						))}
					</div>
				)}
			</div>

			{loading && <p style={styles.status}>Loading feeds...</p>}

			{error && !loading && (
				<p style={styles.status}>Could not load feeds. Try refreshing.</p>
			)}

			{!loading && !error && filteredItems.length === 0 && (
				<p style={styles.status}>No posts found.</p>
			)}

			{!loading && filteredItems.length > 0 && (
				<div>
					{todayItems.length > 0 && (
						<>
							{renderDivider('Last 24 hours')}
							<ul style={styles.list}>
								{todayItems.map(renderItem)}
							</ul>
						</>
					)}

					{weekItems.length > 0 && (
						<>
							{renderDivider('This week')}
							<ul style={styles.list}>
								{weekItems.map(renderItem)}
							</ul>
						</>
					)}

					{olderItems.length > 0 && (
						<>
							{renderDivider('Older')}
							<ul style={styles.list}>
								{olderItems.slice(0, 30).map(renderItem)}
							</ul>
						</>
					)}
				</div>
			)}
		</div>
	);
}
