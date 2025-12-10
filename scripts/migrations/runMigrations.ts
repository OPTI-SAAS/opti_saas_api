import { BoClinic } from '@lib/shared';
import { DataSource, DataSourceOptions } from 'typeorm';

import { getSourceSchema } from './migration.helpers';

runAllMigrations()
  .then(() => {
    console.log('--- All Migrations executed successfully ---');
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

async function runAllMigrations() {
  const backofficeDataSource = new DataSource({
    ...getSourceSchema('backoffice'),
    schema: 'backoffice',
  } as DataSourceOptions);
  await runMigration(backofficeDataSource);
  console.log('--- (backoffice) migration executed successfully ---');
  await backofficeDataSource.initialize();
  const clinicRepo = backofficeDataSource.getRepository(BoClinic);
  const allClinics = await clinicRepo.find();
  console.log('+++ All clinics:', allClinics);
  await backofficeDataSource.destroy();
  const clinicsMigrationSuccess = new Array<string>(),
    clinicsMigrationFailed = new Array<string>();
  for (const clinic of allClinics) {
    try {
      console.log(`--- Executing Migration for Clinic ${clinic.name} ---`);
      const clinicDataSource = new DataSource({
        ...getSourceSchema('client'),
        schema: clinic.tenantId,
      } as DataSourceOptions);
      await runMigration(clinicDataSource);
      console.log(`--- (${clinic.name}) migration executed successfully ---`);
      clinicsMigrationSuccess.push(clinic.name);
    } catch (error) {
      console.error('Error running clinic migration:', error);
      clinicsMigrationFailed.push(clinic.name);
    }
  }
  if (clinicsMigrationFailed.length > 0) {
    console.error('Clinics migration failed:', clinicsMigrationFailed);
    process.exit(1);
  }
}

async function runMigration(dataSource: DataSource) {
  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
    await dataSource.destroy();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}
