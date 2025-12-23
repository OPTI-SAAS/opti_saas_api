// import { BoClinic } from '../entities/backoffice';

export function _generateId(name: string, date: Date): string {
  const sanitizedName = name.toLowerCase().replace(/\s+/g, '');
  const timestamp = date.getTime();
  return `${sanitizedName}${timestamp}`;
}

// generate a function accept argument Clinic and return a Repository<Clinic>
export function generateClinicTenantId(_clinic: any): void {
  // export function generateClinicTenantId(clinic: BoClinic): void {
  // clinic.name = clinic.name.replace(/\s/g, '-').toLowerCase();
  // clinic.tenantId = generateId(clinic.name, new Date(clinic.createdAt));
  // clinic.tenantId = generateId(clinic.name, new Date('2023-01-01T00:00:00Z'));
}

export function getEnumValues<T extends Record<string, string>>(object: T) {
  return Object.values(object);
}
