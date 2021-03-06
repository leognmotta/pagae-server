import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import StoreProjectValidator from 'App/Validators/StoreProjectValidator'
import Project from 'App/Models/Project'
import NoBusinessActiveException from 'App/Exceptions/NoBusinessActiveException'
import EntityNotFoundException from 'App/Exceptions/EntityNotFoundException'
import UpdateProjectValidator from 'App/Validators/UpdateProjectValidator'
import ProjectServices from 'App/Services/ProjectServices'
import ServiceServices from 'App/Services/ServiceServices'

export default class ProjectsController {
  public async index({ request }: HttpContextContract) {
    const { page, page_size } = request.get()

    if (!request.activeBusiness) {
      throw new NoBusinessActiveException()
    }

    const project = await Project.query()
      .where('business_id', request.activeBusiness)
      .preload('client')
      .preload('deposit')
      .preload('reminder', (r) => r.preload('invoiceRemindersCustomDates'))
      .preload('services', (s) => s.preload('term'))
      .paginate(Number(page) || 1, Number(page_size) || 15)

    return project.toJSON()
  }

  public async store({ request }: HttpContextContract) {
    const { project, reminder, services } = await request.validate(
      StoreProjectValidator
    )

    if (!request.activeBusiness) {
      throw new NoBusinessActiveException()
    }

    const projectInstance = await ProjectServices.createProject(
      request.activeBusiness,
      project
    )

    if (services) {
      await ServiceServices.createProjectServices(
        request.activeBusiness,
        projectInstance,
        services
      )
    }

    if (reminder) {
      // create reminder
    }
  }

  public async show({ params, request }: HttpContextContract) {
    const { id } = params

    if (!request.activeBusiness) {
      throw new NoBusinessActiveException()
    }

    const project = await Project.query()
      .where('id', id)
      .andWhere('business_id', request.activeBusiness)
      .preload('client')
      .preload('deposit')
      .preload('reminder')
      .preload('services')
      .first()

    if (!project) {
      throw new EntityNotFoundException()
    }

    return project.toJSON()
  }

  public async update({ params, request }: HttpContextContract) {
    const { id } = params
    const {
      name,
      currency,
      endTime,
      startTime,
      deposit,
      services,
      invoiceReminder,
    } = await request.validate(UpdateProjectValidator)

    if (!request.activeBusiness) {
      throw new NoBusinessActiveException()
    }

    const project = await Project.query()
      .where('id', id)
      .andWhere('business_id', request.activeBusiness)
      .first()

    if (!project) {
      throw new EntityNotFoundException()
    }

    if (deposit) {
      const depositInstance = await project
        .related('deposit')
        .query()
        .andWhere('project_id', id)
        .first()

      if (depositInstance && depositInstance.id !== deposit.id) {
        throw new EntityNotFoundException()
      }

      if (!depositInstance) {
        delete deposit.id

        await project.related('deposit').create(deposit)
      } else {
        Object.assign(depositInstance, { ...deposit })

        await depositInstance.save()
      }
    }

    if (invoiceReminder) {
      const {
        customDates,
        billingCycleType,
        firstInvoiceReminder,
        id: reminderId,
        lastInvoiceReminder,
      } = invoiceReminder

      let reminderInstance = await project
        .related('reminder')
        .query()
        .andWhere('project_id', id)
        .first()

      if (reminderInstance && reminderInstance.id !== reminderId) {
        throw new EntityNotFoundException()
      }

      if (!reminderInstance) {
        reminderInstance = await project.related('reminder').create({
          billingCycleType,
          firstInvoiceReminder,
          lastInvoiceReminder,
        })
      } else {
        Object.assign(reminderInstance, { ...invoiceReminder })

        await reminderInstance.save()
      }

      if (customDates) {
        customDates.forEach(async ({ date, id: customDateId, milestone }) => {
          if (reminderInstance) {
            const instance = await reminderInstance
              .related('invoiceRemindersCustomDates')
              .query()
              .where('id', customDateId)
              .andWhere('invoice_reminder_id', reminderInstance.id)
              .first()

            if (!instance) {
              await reminderInstance
                .related('invoiceRemindersCustomDates')
                .create({ date, milestone })
            } else {
              Object.assign(instance, { date, milestone })

              await instance.save()
            }
          }
        })
      }
    }

    if (services) {
      services.forEach(
        async ({
          id: serviceId,
          description,
          name,
          price,
          priceUnitId,
          quantity,
        }) => {
          const instance = await project
            .related('services')
            .query()
            .where('id', serviceId)
            .andWhere('project_id', id)
            .first()

          if (!instance) {
            await project
              .related('services')
              .create({ description, name, price, priceUnitId, quantity })
          } else {
            Object.assign(instance, {
              description,
              name,
              price,
              priceUnitId,
              quantity,
            })

            await instance.save()
          }
        }
      )
    }

    Object.assign(project, { name, currency, endTime, startTime })

    await project.save()
  }

  public async destroy({ request, params }: HttpContextContract) {
    const { id } = params

    if (!request.activeBusiness) {
      throw new NoBusinessActiveException()
    }

    const project = await Project.query()
      .where('id', id)
      .andWhere('business_id', request.activeBusiness)
      .first()

    if (!project) {
      throw new EntityNotFoundException()
    }

    await project.delete()
  }
}
