import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const topics = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/topics' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    slug: z.string(),
    collection: z.enum(['aws', 'kubernetes', 'devops-sre', 'foundations']),
    tags: z.array(z.string()).min(1),
    technologies: z.array(z.string()),
    format: z.enum(['visual-brief', 'deep-dive', 'flow-explorer', 'operational-reference']),
    difficulty: z.enum(['foundational', 'intermediate', 'advanced']),
    published: z.coerce.date(),
    reviewed: z.coerce.date().optional(),
    versionScope: z.string().optional(),
    legacyPath: z.string(),
    featured: z.boolean().default(false),
    state: z.enum(['legacy', 'draft', 'reviewed']).default('legacy'),
  }),
});

export const collections = { topics };
