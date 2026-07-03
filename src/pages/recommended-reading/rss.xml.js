import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';

export async function GET(context) {
	const recommendations = await getCollection('recommendations');
	return rss({
		title: `${SITE_TITLE} recommendations`,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: recommendations.map((recommendation) => ({
			title: recommendation.data.title,
			description: recommendation.data.note ?? recommendation.data.url,
			pubDate: recommendation.data.pubDate,
			link: recommendation.data.url,
		})),
	});
}
