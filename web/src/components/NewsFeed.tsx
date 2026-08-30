interface Article {
  title: string
  time: string
}

const defaultArticles: Article[] = [
  { title: 'Smog season alert: Punjab issues advisory for schools', time: '2 hours ago' },
  { title: 'New air quality monitoring stations installed in Lahore', time: '5 hours ago' },
  { title: 'Health tips for high AQI days: What you need to know', time: '1 day ago' },
  { title: 'EPA Punjab launches real-time AQI dashboard for citizens', time: '2 days ago' },
  { title: 'Study links poor air quality to respiratory hospital admissions', time: '3 days ago' },
]

export default function NewsFeed({ articles }: { articles?: Article[] }) {
  const items = articles ?? defaultArticles
  return (
    <div className="space-y-3" role="feed" aria-label="News articles">
      {items.map((article, i) => (
        <article key={i} className="p-4 bg-surface rounded-2xl border border-outline-variant">
          <p className="font-semibold text-on-surface text-sm mb-1">{article.title}</p>
          <p className="text-xs text-on-surface-variant">{article.time}</p>
        </article>
      ))}
    </div>
  )
}
