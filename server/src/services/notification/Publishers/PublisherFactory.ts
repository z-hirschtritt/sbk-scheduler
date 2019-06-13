import {Publisher} from './interfaces';
import {TwilioClient} from '../../../twilioSMSClient/TwilioClient';
import {StaffMember} from '../../staffMember/staffMember.interfaces';
import {EmailPublsiher} from './EmailPublisher';
import {SmsPublisher} from './SmsPublisher';
import {MailgunClient} from '../../../mailer/MailgunClient';

export function getAdminPublisher(publishers: Map<string, Publisher[]>): Publisher {
  return publishers.get('_ADMIN_')![0];
}

export class CompositePublisherFactory {
  private readonly publisherFactory: PublisherFactory;
  private readonly staffAdmin: StaffMember;

  constructor(emailClient: MailgunClient, smsClient: TwilioClient, staffEmail: string) {
    this.publisherFactory = new PublisherFactory(emailClient, smsClient);
    this.staffAdmin = {
      id: '_ADMIN_',
      name: 'admin',
      notifications: 1,
      textNotifications: 0,
      email: staffEmail,
    } as StaffMember;
  }

  manufacture(reciepients: StaffMember[]): Map<string, Publisher[]> {
    const staffPubs = reciepients.reduce((publisherMap: Map<string, Publisher[]>, reciepient: StaffMember) => {
      return publisherMap.set(reciepient.id, this.publisherFactory.manufacture(reciepient));
    }, new Map());

    staffPubs.set(this.staffAdmin.id, this.publisherFactory.manufacture(this.staffAdmin));

    return staffPubs;
  }
}

export class PublisherFactory {
  constructor(private readonly emailClient: MailgunClient, private readonly smsClient: TwilioClient) {}

  manufacture(reciepient: StaffMember): Publisher[] {
    const publishers = [];

    if (reciepient.notifications) {
      publishers.push(new EmailPublsiher(this.emailClient, reciepient.email));
    }
    if (reciepient.textNotifications) {
      publishers.push(new SmsPublisher(this.smsClient, reciepient.phoneNumber));
    }

    return publishers;
  }
}
