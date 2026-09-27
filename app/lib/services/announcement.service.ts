import { prisma } from '../db'
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '../validations/announcement.schema'

export async function createAnnouncement(data: CreateAnnouncementInput) {
  return prisma.announcement.create({ data })
}

export async function updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
  return prisma.announcement.update({ where: { id }, data })
}

export async function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } })
}

export async function getPublicAnnouncements(page = 1, limit = 10) {
  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where: { isVisible: true },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.announcement.count({ where: { isVisible: true } })
  ])

  return { announcements, total, totalPages: Math.ceil(total / limit) }
}

export async function getAllAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }]
  })
}

export async function getLatestAnnouncements(limit = 3) {
  return prisma.announcement.findMany({
    where: { isVisible: true },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    take: limit
  })
}
