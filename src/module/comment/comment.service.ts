import * as gravatar from 'gravatar'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import { CommentEntity } from '@module/comment/comment.entity'
import { ArticleService } from '@module/article/article.service'
import { parseUserAgent } from '@/utils/userAgent'
import { EmailService } from '@/processor/email.service'
import { ArticleEntity } from '@module/article/article.entity'
import { PaginateService } from '@module/paginate/paginate.service'
import { getNewCommentHtml, getReplyCommentHtml } from '@/utils/html'
import { parseIp } from '@/utils/ip'

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly emailService: EmailService,
    private readonly articleService: ArticleService,
    private readonly configService: ConfigService,
    private readonly paginateService: PaginateService
  ) {}

  async create(ua: string, ip: string, body: Partial<CommentEntity>) {
    const { name, email, content, article_id, parent_id } = body
    if (!name || !email || !content) {
      throw new HttpException('参数错误', HttpStatus.BAD_REQUEST)
    }

    const { data } = parseUserAgent(ua)
    body.browser = data.browser
    body.os = data.os
    body.ip = ip

    if (!body.avatar) {
      body.avatar = gravatar.url(body.email)
    }

    const address = parseIp(ip)

    if (address) {
      body.address = address || '未知'
    }

    const newComment = this.commentRepository.create(body)

    let post: ArticleEntity

    if (article_id) {
      post = await this.articleService.updateComments(
        String(article_id),
        'create'
      )
    }

    if (!body.parent_id) {
      this.emailService.sendEmail({
        to: this.configService.get('ACCOUNT'),
        subject: '博客评论通知',
        html: getNewCommentHtml(
          post?.title || '',
          newComment.content,
          newComment.name,
          newComment.site
        )
      })
    } else {
      const comment = await this.findOne(String(parent_id))
      this.emailService.sendEmail({
        to: comment.email,
        subject: '评论回复通知',
        html: getReplyCommentHtml(
          newComment.name,
          comment.content,
          newComment.content,
          newComment.site
        )
      })
    }

    return await this.commentRepository.save(newComment)
  }

  async findAll(params: Record<string, string | number>) {
    const { page = 1, page_size = 12, status, ...rest } = params

    const query = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.parent_id is NULL')
      .orderBy('comment.created_at', 'DESC')

    const subQuery = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.parent_id = :parent_id')

    if (status) {
      query.andWhere('comment.status = :status', { status })
      subQuery.andWhere('comment.status = :status', { status })
    }

    if (rest) {
      Object.keys(rest).forEach((key) => {
        query
          .andWhere(`comment.${key} LIKE :${key}`)
          .setParameter(`${key}`, `%${rest[key]}%`)
      })
    }

    const result = await this.paginateService.paginate(query, {
      page: +page,
      page_size: +page_size
    })

    for (const item of result.data) {
      const subComments = await subQuery
        .setParameter('parent_id', item.id)
        .getMany()
      Object.assign(item, { replys: subComments })
    }

    return result
  }

  async findCommentList(params: Record<string, string | number>) {
    const { page = 1, page_size = 12, status, ...rest } = params

    const query = this.commentRepository
      .createQueryBuilder('comment')
      .orderBy('comment.created_at', 'DESC')

    if (status) {
      query.andWhere('comment.status = :status', { status })
    }

    if (rest) {
      Object.keys(rest).forEach((key) => {
        query
          .andWhere(`comment.${key} LIKE :${key}`)
          .setParameter(`${key}`, `%${rest[key]}%`)
      })
    }

    const result = await this.paginateService.paginate(query, {
      page: +page,
      page_size: +page_size
    })

    return result
  }

  async findAllByArticleId(articleId: string, params: Record<string, number>) {
    const { page = 1, page_size = 12, sort = -1 } = params

    const query = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.parent_id is NULL')
      .andWhere('comment.article_id = :article_id', {
        article_id: articleId
      })
      .andWhere('comment.status = :status', { status: '1' })
      .orderBy('comment.created_at', sort === -1 ? 'DESC' : 'ASC')

    const subQuery = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.parent_id = :parent_id')
      .andWhere('comment.status = :status', { status: '1' })

    const result = await this.paginateService.paginate(query, {
      page: +page,
      page_size: +page_size
    })

    for (const item of result.data) {
      const replys = await subQuery.setParameter('parent_id', item.id).getMany()
      Object.assign(item, { replys })
    }

    return result
  }

  async findOne(id: string) {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.id = :id', { id })

    const comment = await queryBuilder.getOne()
    if (!comment) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND)
    }

    return comment
  }

  async update(id: string, body: Partial<CommentEntity>) {
    const exist = await this.commentRepository.findOne(id)
    if (!exist) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND)
    }
    const updatedCategory = this.commentRepository.merge(exist, body)
    return await this.commentRepository.save(updatedCategory)
  }

  async remove(id: string) {
    const exist = await this.commentRepository.findOne(id)
    if (!exist) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND)
    }
    if (exist.article_id) {
      await this.articleService.updateComments(
        String(exist.article_id),
        'remove'
      )
    }
    return await this.commentRepository.remove(exist)
  }

  async removeMany(ids: Array<string>) {
    const exist = await this.commentRepository.findByIds(ids)
    if (!exist.length) {
      throw new HttpException('评论不存在', HttpStatus.NOT_FOUND)
    }
    return await this.commentRepository.remove(exist)
  }

  async getCount() {
    return await this.commentRepository.createQueryBuilder('comment').getCount()
  }
}
