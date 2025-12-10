import { Controller } from '@nestjs/common';

export const BackofficeController = (route: string) =>
  Controller(`backoffice/${route}`);

export const ClientController = (route: string) =>
  Controller(`client/${route}`);
