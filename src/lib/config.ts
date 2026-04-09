/**
 * Site-wide configuration.
 * When expanding to new topics (crypto, gaming, science, etc.),
 * update SITE_TOPIC here — the hero, email copy, and meta tags
 * all pull from this single source of truth.
 */
export const SITE_TOPIC = "AI";

export const SITE_NAME = "CurrentScout";

export const SITE_TAGLINE = `The ranked ${SITE_TOPIC} feed for practitioners.`;
export const SITE_KICKER  = `44 communities. Scored by signal, not noise. Updated every 15 minutes.`;

export const SITE_DESCRIPTION =
  `${SITE_NAME}: ${SITE_KICKER} ` +
  `Ranked signal from the communities where ${SITE_TOPIC} actually happens.`;
