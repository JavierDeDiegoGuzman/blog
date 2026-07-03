import { useState } from 'preact/hooks';

interface FeedItem {
	title: string;
	link: string;
	date: string;
	source: string;
}

interface Props {
	items: FeedItem[];
	sources: string[];
}

function formatDate(dateStr: string): string {
	return dateStr.split('T')[0];
}

function getTimeCategory(dateStr: string): 'today' | 'week' | 'older' {
	const date = new Date(dateStr);
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
	empty: {
		color: '#666666',
	},
};

export default function FeedDisplay({ items, sources }: Props) {
	const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(sources));
	const [showFilters, setShowFilters] = useState(false);

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

	const filteredItems = items.filter((item) => selectedSources.has(item.source));

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

	if (items.length === 0) {
		return <p style={styles.empty}>No feeds loaded.</p>;
	}

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

			{filteredItems.length === 0 && <p style={styles.empty}>No posts match the filter.</p>}

			{filteredItems.length > 0 && (
				<div>
					{todayItems.length > 0 && (
						<>
							{renderDivider('Last 24 hours')}
							<ul style={styles.list}>{todayItems.map(renderItem)}</ul>
						</>
					)}

					{weekItems.length > 0 && (
						<>
							{renderDivider('This week')}
							<ul style={styles.list}>{weekItems.map(renderItem)}</ul>
						</>
					)}

					{olderItems.length > 0 && (
						<>
							{renderDivider('Older')}
							<ul style={styles.list}>{olderItems.map(renderItem)}</ul>
						</>
					)}
				</div>
			)}
		</div>
	);
}
