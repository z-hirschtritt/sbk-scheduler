import moment from 'moment';
import {MinimalLogger} from '../../../twilioSMSClient/Interfaces';
import {Shift} from '../../shift/shift.interfaces';
import {StaffMember} from '../../staffMember/staffMember.interfaces';
import {NotificationHandler} from './NotificationHandlerFactory';
import {NotificationContext} from '../notification.interfaces';
import {Publisher, NotificationViewModel} from '../Publishers';
import {IShiftService} from '../../shift/ShiftService';
import {formatEmail, TemplateName} from '../../../mailer/templator';
import {getAdminPublisher} from '../Publishers/PublisherFactory';

export class WeeklyShiftUpdateHandler implements NotificationHandler {
  constructor(
    private readonly log: MinimalLogger,
    private readonly shiftService: IShiftService,
    private readonly publishers: Map<number, Publisher[]>,
    private readonly staff: StaffMember[],
  ) {}

  private async sendEmptyShiftEmail(shift: Shift) {
    this.log.info('Sending empty shift warning email', JSON.stringify(shift, null, 2));
    const adminPublisher = getAdminPublisher(this.publishers);
    const vm: NotificationViewModel = {
      emailHtml: formatEmail(TemplateName.emptyShift, {shift}),
      subjectText: `⚠️ SBK Reminder: Unassigned Upcoming Shift ${formatDate(shift.date)}`,
      smsText: '',
    };

    return await adminPublisher.publish(vm);
  }

  private async sendUpcomingShiftEmail(shift: Shift, assignedStaffMembers: StaffMember[]) {
    this.log.info({shift, assignedStaffMembers}, 'Sending shift reminder email');

    const publishers = getPublishersForStaffMembers(assignedStaffMembers, this.publishers);
    const vm: NotificationViewModel = {
      emailHtml: formatEmail(TemplateName.upcomingShift, {shift}),
      subjectText: `👋 SBK Reminder: Upcoming Shift ${formatDate(shift.date)}`,
      smsText: `👋 SBK Reminder: You have an upcoming SBK shift this week: ${shift.date}`,
    };

    return await Promise.all(publishers.map(p => p.publish(vm)));
  }

  private async handleNextShift(shift: Shift): Promise<void | void[]> {
    // if shop is closed, no emails
    if (!shift.shop_open) {
      this.log.info({shift}, 'Not sending emails for upcoming shift, shop closed');
      return Promise.resolve();
    }

    try {
      // if upcoming shift is empty and shop is open, draft email to staff
      const isStaffAssigned = shift.primary_staff || shift.secondary_staff;
      if (!isStaffAssigned) {
        return this.sendEmptyShiftEmail(shift);
      }

      // if upcoming shift is staffed, draft emails to all assigned staffMembers
      const assignedStaffMembers = findAssignedStaffForShift(shift, this.staff);
      return this.sendUpcomingShiftEmail(shift, assignedStaffMembers);
    } catch (err) {
      throw new Error(err);
    }
  }

  async handle(context: NotificationContext) {
    const nextShifts = await getShiftsForWeek(this.shiftService);
    await Promise.all(nextShifts.map(shift => this.handleNextShift(shift)));
  }
}

function getPublishersForStaffMembers(assignedStaffMembers: StaffMember[], publishers: Map<number, Publisher[]>) {
  return assignedStaffMembers.reduce((pubs: Publisher[], staff) => {
    return pubs.concat(publishers.get(staff.id) || []);
  }, []);
}

async function getShiftsForWeek(shiftService: IShiftService): Promise<Shift[]> {
  const today = new Date();
  const endOfWeek = moment()
    .add(7, 'days')
    .toDate();
  return await shiftService.findByDateRange(today, endOfWeek);
}

function findAssignedStaffForShift(upcomingShift: Shift, staff: StaffMember[]): StaffMember[] {
  const assignedStaffMembers = staff.filter(staffMember => {
    return [upcomingShift.primary_staff, upcomingShift.secondary_staff]
      .map(name => name.toLowerCase())
      .includes(staffMember.name.toLowerCase());
  });
  return assignedStaffMembers;
}

function formatDate(date: string) {
  return moment(date).format('dddd, MMM D, YYYY');
}
