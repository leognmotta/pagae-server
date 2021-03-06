import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  hasOne,
  HasOne,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Address from 'App/Models/Address'
import Tax from 'App/Models/Tax'
import Contact from 'App/Models/Contact'
import Project from './Project'

export default class Client extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ serializeAs: 'businessId' })
  public businessId: number

  @column()
  public name: string

  @hasOne(() => Address)
  public address: HasOne<typeof Address>

  @hasOne(() => Tax)
  public tax: HasOne<typeof Tax>

  @hasMany(() => Contact)
  public contacts: HasMany<typeof Contact>

  @hasMany(() => Project)
  public projects: HasMany<typeof Project>

  @column({ serializeAs: 'isActive' })
  public isActive: boolean

  @column.dateTime({ autoCreate: true, serializeAs: 'createdAt' })
  public createdAt: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    serializeAs: 'updatedAt',
  })
  public updatedAt: DateTime
}
