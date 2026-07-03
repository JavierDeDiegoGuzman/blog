import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
	}),
});

const recommendations = defineCollection({
	loader: glob({ base: './src/content/recommendations', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		url: z.string().url(),
		pubDate: z.coerce.date(),
		note: z.string().optional(),
		author: z.string().optional(),
		source: z.string().optional(),
	}),
});

export const collections = { posts, recommendations };
