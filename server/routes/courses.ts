import { Router } from 'express'
import { z } from 'zod'
import { Course } from '../models/Course.js'
import { Translation } from '../models/Translation.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { localeMiddleware } from '../middleware/locale.js'
import { applyTranslation, applyTranslations } from '../utils/applyTranslation.js'
import { toErrorMessage } from '../utils/errorMessage.js'
import { parsePagination } from '../utils/parsePagination.js'
import { validate } from '../utils/validate.js'
import { isAdminUser } from '../utils/adminAccess.js'

const router = Router()

// Accept either a string (id/slug) or null to clear. Empty string becomes null.
const refSchema = z.union([z.string(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null))

const lessonSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional().default(''),
  order: z.number().optional().default(0),
  videoUrl: z.string().optional(),
  durationMinutes: z.number().optional(),
})

const courseBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional().default(''),
  description: z.string().optional().default(''),
  coverImage: refSchema,
  category: refSchema,
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  durationMinutes: z.number().optional(),
  lessons: z.array(lessonSchema).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('published'),
  publishedAt: z.string().optional(),
  order: z.number().optional().default(0),
})

const courseUpdateSchema = courseBodySchema.partial().omit({ slug: true })

const listQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  featured: z.string().optional(),
  status: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const detailQuerySchema = z.object({
  preview: z.string().optional(),
  locale: z.string().optional(),
}).passthrough()

const slugParamsSchema = z.object({ slug: z.string().min(1) })

router.get('/', localeMiddleware, optionalAuth, async (req, res) => {
  const { category, tag, featured, status, limit = '20', page = '1' } = validate(listQuerySchema, req.query)

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (tag) filter.tags = tag
  if (featured === 'true') filter.featured = true

  filter.status = isAdminUser(req.user) && status ? status : 'published'

  const { pageNum, limitNum, skip } = parsePagination(page, limit)
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('coverImage')
      .populate('category')
      .sort({ order: 1, publishedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Course.countDocuments(filter),
  ])

  let result = courses.map(c => c.toJSON())
  if (!req.isDefaultLocale) {
    const translations = await Translation.find({
      locale: req.locale,
      collectionName: 'courses',
      documentId: { $in: courses.map(c => c._id.toString()) },
    })
    result = applyTranslations(result, translations)
  }

  res.json({ courses: result, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

router.get('/:slug', localeMiddleware, optionalAuth, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  const { preview } = validate(detailQuerySchema, req.query)

  const filter: Record<string, unknown> = { slug }
  if (!isAdminUser(req.user) || preview !== 'true') filter.status = 'published'

  const course = await Course.findOne(filter).populate('coverImage').populate('category')
  if (!course) return res.status(404).json({ error: 'Course not found' })
  if (req.isDefaultLocale) return res.json(course)

  const translation = await Translation.findOne({
    locale: req.locale,
    collectionName: 'courses',
    documentId: course._id.toString(),
  })
  res.json(applyTranslation(course.toJSON(), translation))
})

router.post('/', requireAuth, adminOnly, async (req, res) => {
  try {
    const body = validate(courseBodySchema, req.body)
    const existing = await Course.findOne({ slug: body.slug })
    if (existing) return res.status(409).json({ error: 'Course with this slug already exists' })
    const { publishedAt, ...rest } = body
    const course = await Course.create({
      ...rest,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    })
    const populated = await Course.findById(course._id).populate('coverImage').populate('category')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: `Failed to create course: ${toErrorMessage(err)}` })
  }
})

router.put('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const body = validate(courseUpdateSchema, req.body)
    const { publishedAt, ...rest } = body
    const patch: Record<string, unknown> = { ...rest }
    if (publishedAt) patch.publishedAt = new Date(publishedAt)
    const course = await Course.findOneAndUpdate({ slug }, patch, { new: true, runValidators: true })
      .populate('coverImage')
      .populate('category')
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) {
    res.status(500).json({ error: `Failed to update course: ${toErrorMessage(err)}` })
  }
})

router.delete('/:slug', requireAuth, adminOnly, async (req, res) => {
  const { slug } = validate(slugParamsSchema, req.params)
  try {
    const course = await Course.findOneAndDelete({ slug })
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json({ ok: true, slug })
  } catch (err) {
    res.status(500).json({ error: `Failed to delete course: ${toErrorMessage(err)}` })
  }
})

export default router
