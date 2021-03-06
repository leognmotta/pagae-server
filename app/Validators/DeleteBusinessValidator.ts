import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class DeleteBusinessValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    confirmation: schema.string(),
  })

  public cacheKey = this.ctx.routeKey

  public messages = {}
}
