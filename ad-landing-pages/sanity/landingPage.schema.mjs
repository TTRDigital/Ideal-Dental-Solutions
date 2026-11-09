// Sanity schema for the ad landing pages. Add to the studio's schemaTypes in the
// main site repo (this folder does not touch the main site code):
//   import landingPage from '../../ad-landing-pages/sanity/landingPage.schema.mjs'
// Use ** around words in the headline to make them orange.
const text = (name, title, rows = 3) => ({ name, title, type: 'text', rows });
const str = (name, title) => ({ name, title, type: 'string' });
const items = (name, title, fields) => ({ name, title, type: 'array', of: [{ type: 'object', fields }] });
const t = [str('title', 'Title'), text('text', 'Text')];

export default {
  name: 'landingPage', title: 'Ad landing page', type: 'document',
  fields: [
    str('title', 'Page title'),
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    str('phone', 'Default phone (digits)'), str('phoneDisplay', 'Phone shown'), str('callLabel', 'Call button label'),
    text('headline', 'Headline (** for orange words)', 3),
    { name: 'gallery', type: 'object', fields: [str('eyebrow', 'Eyebrow'), str('title', 'Title')] },
    { name: 'process', type: 'object', fields: [str('eyebrow', 'Eyebrow'), str('title', 'Title'), str('subtitle', 'Subtitle'), items('steps', 'Steps', t)] },
    { name: 'craft', type: 'object', fields: [str('title', 'Title'), items('items', 'Items', t)] },
    { name: 'why', type: 'object', fields: [str('eyebrow', 'Eyebrow'), str('title', 'Title'), str('subtitle', 'Subtitle'), items('cards', 'Cards', [...t, str('icon', 'Icon file')])] },
    { name: 'veneers', type: 'object', fields: [str('eyebrow', 'Eyebrow'), str('title', 'Title'), text('intro', 'Intro'), str('lead', 'Lead-in'), items('items', 'Reasons', t)] },
    { name: 'reviews', type: 'object', fields: [str('title', 'Title'), str('elfsightId', 'Elfsight app id')] },
    { name: 'location', type: 'object', fields: [str('title', 'Title'), text('text', 'Text'), str('name', 'Office name'), str('address', 'Address'), str('mapsUrl', 'Maps link'), { name: 'hours', title: 'Hours', type: 'array', of: [{ type: 'string' }] }] },
    { name: 'faq', type: 'object', fields: [str('eyebrow', 'Eyebrow'), str('title', 'Title'), items('items', 'Questions', [str('q', 'Question'), text('a', 'Answer')])] },
    { name: 'form', type: 'object', fields: [str('title', 'Title'), str('button', 'Button'), str('success', 'Success message'), str('error', 'Error message')] },
    { name: 'footer', type: 'object', fields: [str('linksTitle', 'Links title'), items('links', 'Links', [str('label', 'Label'), str('href', 'URL')]), str('connectTitle', 'Connect title'), str('copyright', 'Copyright')] },
    { name: 'tracking', type: 'object', fields: [str('gtm', 'GTM container id'), str('siteKey', 'TTR OS site key')] },
  ],
};
