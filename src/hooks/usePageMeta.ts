import { useEffect } from 'react'

/** The wordmark on the brand navy — see `public/brand/`. */
const SHARE_CARD = '/brand/garagepilot-og.png'

export interface PageMeta {
  /** Shown in the tab and used as the social sharing title. */
  title: string
  /** The `<meta name="description">` and the social sharing description. */
  description: string
  /** `website` for the home page, `article` elsewhere — Open Graph's own term. */
  type?: 'website' | 'article'
}

/**
 * Sets the document title, the meta description and the Open Graph / Twitter
 * tags for one public page.
 *
 * Written by hand rather than with a helmet library: the public site is the
 * only part of the app that needs per-page metadata, and three `querySelector`
 * calls are cheaper than a dependency. Tags are created on first use and then
 * reused, so navigating between pages rewrites them instead of stacking them
 * up. `index.html` keeps the app-wide defaults, which is what a crawler sees
 * before React has run.
 */
export function usePageMeta({ title, description, type = 'website' }: PageMeta): void {
  useEffect(() => {
    document.title = title

    setMeta('name', 'description', description)

    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', 'GaragePilot')
    setMeta('property', 'og:url', window.location.href)

    // Absolute, because a share card is fetched by a crawler that has no
    // page to resolve a relative path against.
    const card = window.location.origin + SHARE_CARD
    setMeta('property', 'og:image', card)
    setMeta('property', 'og:image:alt', 'GaragePilot — Smart Garage Management')

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', card)

    setCanonical(window.location.origin + window.location.pathname)
  }, [title, description, type])
}

/** Writes one meta tag, creating it the first time it is asked for. */
function setMeta(keyName: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${keyName}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(keyName, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}
