import { Outlet, useParams } from 'react-router-dom'
import './EmbedLayout.css'

export default function EmbedLayout() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="embed-layout">
      <div className="embed-layout__content">
        <Outlet context={{ basePath: `/${slug}/embed` }} />
      </div>
      <a href={`/${slug}`} target="_blank" rel="noreferrer" className="embed-layout__footer">
        Powered by Jogaê Sports
      </a>
    </div>
  )
}
