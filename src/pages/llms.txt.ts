import { requireSite } from '@/utilities/require-site';
import type { APIRoute } from 'astro';
import { stops } from '@/data/Stop/stops';
import { formatStopDate, formatTimes, locationText, nextPublicStop } from '@/domain/stop/stop-timing';
import { SERVICE_AREA, SITE_TAGLINE, socialLinks } from '@/data/Content/settings';
import { siteContent } from '@/data/Content/site-content';
import { SITE_NAME } from '@/utilities/brand';
import { toAbsolute } from '@/utilities/with-base';

/** llms.txt: a plain-language map of the site for AI assistants and crawlers (llmstxt.org). Built from the same data as the pages. */
export const GET: APIRoute = ({ site }) => {
  const page = (path: string) => toAbsolute(requireSite(site), path);
  const next = nextPublicStop(stops, new Date());
  const socials = [socialLinks.instagram && `- [Instagram](${socialLinks.instagram})`, socialLinks.facebook && `- [Facebook](${socialLinks.facebook})`, socialLinks.tiktok && `- [TikTok](${socialLinks.tiktok})`].filter(Boolean);

  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_TAGLINE} A mobile coffee trailer based in Chester, serving ${SERVICE_AREA}: markets, festivals, weddings and private events.`,
    '',
    '## Key facts',
    `- Where: the trailer moves. ${next ? `Next stop: ${formatStopDate(next.date)}, ${formatTimes(next)}, ${locationText(next)}.` : 'The next stops are announced soon.'}`,
    `- Hire: book the trailer for events. We like about ${siteContent.hire.leadTimeDays} days' notice. ${siteContent.hire.travelNote}`,
    '- Shop: beans and merchandise online, collected from the trailer.',
    '',
    `- Background: ${siteContent.venture.intro}`,
    '',
    '## Pages',
    `- [Home](${page('/')}): what Éire Coffee is and the next stop`,
    `- [Find us](${page('/calendar/')}): calendar of stops, with a subscribable feed`,
    `- [Menu](${page('/menu/')}): what we pour`,
    `- [Book the trailer](${page('/book/')}): packages and a booking request form`,
    `- [Shop](${page('/shop/')}): coffee and merchandise`,
    `- [FAQs](${page('/faqs/')}): common questions answered`,
    `- [Our story](${page('/our-story/')}): the earlier venture, Capuchin Coffee in Hale, Altrincham, and what we bring from it`,
    `- [Contact](${page('/contact/')}): ways to reach us`,
    `- [Calendar feed](${page('/eire-coffee-stops.ics')}): iCalendar file of public stops`,
    ...(socials.length > 0 ? ['', '## Social', ...socials] : []),
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
